import { fs, posix } from '../deps.ts';
import { semver } from '../deps.ts';
import * as fileResolver from './fileResolver.ts';
import { default as moduleTypes, Module } from './moduleTypes.ts';
import * as moduleNameParser from './moduleNameParser.ts';
import pkgResolverMap from './pkgResolver.ts';

type SemVer = semver.SemVer;

const enumerateFiles = async function* (basePath: string, files: string[]) {
  for (const filename of files) {
    for await (const file of fs.expandGlob(posix.resolve(basePath, filename))) {
      if (file.isFile) {
        yield [file.path, filename];
      }
    }
  }
};

interface ModuleVersionCheckOptions {
  level: 'major' | 'minor' | 'patch';
  usePrerelease: boolean;
  gitHubToken?: string;
}

type ModuleVersionCheckResult = {
  fixed: boolean;
  outdated: 'major' | 'minor' | 'patch' | 'pre_release' | 'none' | 'not_found';
  latest: string | null,
};

const versionsCache = new Map<string, SemVer[] | null>();
const getVersions = async function (
  type: keyof typeof pkgResolverMap,
  name: string,
  ...args: string[]
) {
  const cacheName = type + ':' + name;
  const cachedVersions = versionsCache.get(cacheName);
  if (typeof cachedVersions !== 'undefined') {
    return cachedVersions;
  }

  const versions = await pkgResolverMap[type](name, ...args);
  versionsCache.set(cacheName, versions);

  return versions;
};

const getLargestVersion = (versions: SemVer[]) =>
  versions.reduce((max, ver) => semver.gt(ver, max) ? ver : max);

const checkModuleVersion = async function (
  module: Module,
  options: ModuleVersionCheckOptions,
): Promise<ModuleVersionCheckResult | null> {
  const pkgVersion = module.version ?? '';
  const versionFixed = semver.parse(pkgVersion) !== null;

  if (!(module.type in pkgResolverMap)) {
    return null;
  }
  const type = module.type as keyof typeof pkgResolverMap;

  const additionalArgs = [];
  if (type === 'raw_github' && typeof options?.gitHubToken === 'string') {
    additionalArgs.push(options.gitHubToken);
  }

  let versionList = await getVersions(type, module.name, ...additionalArgs);
  if (versionList === null) {
    return {
      fixed: versionFixed,
      outdated: 'not_found',
      latest: null,
    };
  }
  if (!options.usePrerelease) {
    versionList = versionList.filter((version) =>
      version.prerelease.length === 0
    );
  }

  // extract versions in the specified range;
  // fixed versions are interpreted as a range of `=x.y.z`
  const versionsInRange = versionList.filter((v) =>
    semver.satisfies(
      v,
      pkgVersion,
      { includePrerelease: options.usePrerelease },
    )
  );
  if (versionsInRange.length < 1) {
    return {
      fixed: versionFixed,
      outdated: 'not_found',
      latest: null,
    };
  }
  const latestVerInRange = getLargestVersion(versionsInRange);

  const versionsGreater = versionList.filter((v) =>
    semver.gtr(
      v,
      pkgVersion,
      { includePrerelease: options.usePrerelease },
    )
  ).filter((v) => {
    switch (options.level) {
      case 'major':
        return true;
      case 'minor':
        return semver.major(latestVerInRange) === v.major;
      case 'patch':
        return semver.major(latestVerInRange) === v.major &&
          semver.minor(latestVerInRange) === v.minor;
    }
  });

  let outdated: ModuleVersionCheckResult['outdated'] = 'none';
  let latestVer: SemVer | null = null;
  if (versionsGreater.length > 0) {
    latestVer = getLargestVersion(versionsGreater);

    if (latestVer.major > latestVerInRange.major) {
      outdated = 'major';
    } else if (latestVer.minor > latestVerInRange.minor) {
      outdated = 'minor';
    } else if (latestVer.patch > latestVerInRange.patch) {
      outdated = 'patch';
    } else if (
      options.usePrerelease &&
      semver.gt(latestVer, latestVerInRange, { includePrerelease: true })
    ) {
      outdated = 'pre_release';
    }
  }

  // console.log(
  //   name,
  //   versionsInRange.map((v) => v.version),
  //   versionsGreater.map((v) => v.version),
  //   outdated,
  // );

  return {
    fixed: versionFixed,
    outdated,
    latest: latestVer?.version ?? null
  };
};

const main = async function () {
  let fileGlobs = [
    'package.json',
  ];

  // add configurations for deno
  const isDeno = fs.existsSync(posix.resolve('deno.json'), { isFile: true }) ||
    fs.existsSync(posix.resolve('deno.jsonc'), { isFile: true });
  if (isDeno) {
    fileGlobs = [
      ...fileGlobs,
      'import_map.json',
      '**/deps.ts',
    ];
  }

  // gather modules from files
  let modules: Module[] = [];
  for await (const [path, globName] of enumerateFiles(Deno.cwd(), fileGlobs)) {
    console.log(`Scanning ${path}...`);

    const content = await Deno.readTextFile(path);

    if (globName === 'package.json') {
      modules = [
        ...modules,
        ...fileResolver.resolvePackageJson(content),
      ];
    } else if (globName === 'import_map.json') {
      modules = [
        ...modules,
        ...fileResolver.resolveImportMap(content, [
          moduleNameParser.denoLandUrlParser,
          moduleNameParser.rawGitHubUrlParser,
          moduleNameParser.denoNpmModuleParser,
        ]),
      ];
    } else if (globName === '**/deps.ts') {
      modules = [
        ...modules,
        ...fileResolver.resolveDenoModuleNameStrings(content, [
          moduleNameParser.denoLandUrlParser,
          moduleNameParser.rawGitHubUrlParser,
          moduleNameParser.denoNpmModuleParser,
        ]),
      ];
    }
  }

  // remove duplications
  const moduleMap = new Map<string, Module>();
  for(const module of modules) {
    moduleMap.set(`${module.type}-${module.name}`, module);
  }
  modules = [...moduleMap.values()];

  // check updates
  const results: [Module, ModuleVersionCheckResult][] = [];
  for (const module of modules) {
    const result = await checkModuleVersion(module, {
      level: 'major',
      usePrerelease: false,
    });

    if(result === null) {
      console.log(`❔${module.name} cannot be resolved`);
    } else if(result.outdated === 'not_found') {
      console.log(`❔ ${module.name} not found on remote`);
    } else if(result.outdated === 'none') {
      if(result.fixed) {
        console.log(`✅ ${module.name} is up to date`);
      } else {
        console.log(`⚠️ ${module.name} may up to date (version not fixed)`);
      }
    } else {
      if(result.fixed) {
        console.log(`❌ ${module.name} is outdated (${result.outdated})`);
      } else {
        console.log(`❌ ${module.name} is outdated (${result.outdated}) and version is not fixed`);
      }
    }

    if(result !== null) {
      results.push([
        module,
        result,
      ]);
    }
  }

  // show result
  const outdatedModules = results.filter(([, result]) => {
    return result.outdated !== 'none' && result.outdated !== 'not_found';
  });
  const notFoundModules = results.filter(([_, result]) => result.outdated === 'not_found');
  const notFixedModules = results.filter(([_, result]) => !result.fixed);

  console.log();
  console.log(`\x1b[1m${outdatedModules.length}\x1b[0m module${outdatedModules.length > 1 ? 's are' : ' is'} outdated.`);
  if(notFoundModules.length > 0) {
    console.log('Could not find following modules:');
    console.log('  ' + notFoundModules.map(([module]) => module.name).join(', '));
  }
  if(notFixedModules.length > 0) {
    console.log('Version not fixed at following modules:');
    console.log('  ' + notFixedModules.map(([module]) => module.name).join(', '));
  }

  let logTable: string[][] = [
    ['', 'package', 'current', 'latest']
  ];
  const outdatedTextMap = {
    'major': '\x1b[31mMajor\x1b[0m',
    'minor': '\x1b[33mMinor\x1b[0m',
    'patch': '\x1b[34mPatch\x1b[0m',
    'pre_release': '\x1b[36mPre\x1b[0m',
    'none': 'Latest',
    'not_found': 'Not Found',
  };
  for(const [module, result] of outdatedModules) {
    logTable.push([
      `${outdatedTextMap[result.outdated]     }`,
      module.name,
      module.version ?? '(null)',
      result.latest ?? '(null)',
    ]);
  }
  const colWidths = new Array(logTable[0].length)
    .fill(0)
    .map((_, i) => logTable.reduce((max, arr) => arr[i].length > max ? arr[i].length : max, 0));

  logTable = logTable.map((arr) => arr.map((v, i) => `${v}${' '.repeat(colWidths[i])}`.slice(0, colWidths[i])));
  // adjust for ANSI escape sequence
  colWidths[0] = 5;
  logTable[0][0] = '     ';

  console.log(logTable[0].join(' '));
  console.log(colWidths.map((len) => '-'.repeat(len)).join(' '));
  console.log(logTable.slice(1).map((arr) => arr.join(' ')).join('\n'));
};

export default main;
