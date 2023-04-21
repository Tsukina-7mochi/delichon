import * as fs from 'fs';
import * as posix from 'posix';
import * as cliffy from 'cliffy';
import { Module } from './moduleTypes.ts';
import checkModuleVersion, {
  ModuleVersionCheckResult,
} from './moduleVersionChecker.ts';
import { configurations as fileConfigs, FileConfig } from './files.ts';
import appInfo from '../app.json' assert { type: 'json' };
import { buildTableString } from './util.ts';
import updateVersion from './moduleVersionUpdater.ts';

const enumerateFiles = async function* (basePath: string, files: string[]) {
  for (const filename of files) {
    for await (const file of fs.expandGlob(posix.resolve(basePath, filename))) {
      if (file.isFile) {
        yield [file.path, filename];
      }
    }
  }
};

const printVersionCheckResult = function(results: ModuleVersionCheckResult[]) {
  // type guards for version check result
  const isFound = (
    item: ModuleVersionCheckResult,
  ): item is ModuleVersionCheckResult & { found: true } => item.found;
  const isNotFound = (
    item: ModuleVersionCheckResult,
  ): item is ModuleVersionCheckResult & { found: false } => !item.found;

  const outdatedModules = results.filter(isFound).filter((result) =>
    result.outdated
  );
  const notFoundModules = results.filter(isNotFound);
  const notFixedModules = results.filter((result) => !result.fixed);

  console.log(
    `\x1b[1m${outdatedModules.length}\x1b[0m module${
      outdatedModules.length > 1 ? 's are' : ' is'
    } outdated.`,
  );
  if (notFoundModules.length > 0) {
    console.log('Could not find following modules:');
    console.log(
      '  ' + notFoundModules.map((result) => result.module.name).join(', '),
    );
  }
  if (notFixedModules.length > 0) {
    console.log('Version not fixed at following modules:');
    console.log(
      '  ' + notFixedModules.map((result) => result.module.name).join(', '),
    );
  }

  if (outdatedModules.length > 0) {
    const logTable: string[][] = [
      ['', 'package', 'current', 'latest'],
    ];
    const outdatedTextMap = {
      'major': '\x1b[31mMajor\x1b[0m',
      'minor': '\x1b[33mMinor\x1b[0m',
      'patch': '\x1b[34mPatch\x1b[0m',
      'pre_release': '\x1b[36mPre\x1b[0m',
      'none': 'Latest',
      'not_found': 'Not Found',
    };
    for (const result of outdatedModules) {
      logTable.push([
        `${outdatedTextMap[result.outdatedLevel]}`,
        result.module.name,
        result.module.version ?? '(null)',
        result.latestVersion,
      ]);
    }
    const logTableStr = buildTableString(logTable, true);
    console.log(logTableStr);
  }
}

const main = async function () {
  const appVersionCheckResult = await checkModuleVersion({
    type: 'raw_github',
    name: appInfo.repository,
    version: appInfo.version,
  }, {
    usePrerelease: false,
    level: 'major',
  });
  if (appVersionCheckResult.found && appVersionCheckResult.outdated) {
    console.log(`Update ${appVersionCheckResult.latestVersion} found`);
    console.log('You can update with $\x1b[33mdeno cache --reload\x1b[0m');
  }

  const command = new cliffy.Command()
    .name(appInfo.name)
    .version(appInfo.version)
    .description('Dependency scanner for Node.js and Deno project')
    .option('-u --update [update:boolean]', 'update versions')
    .option('--fix', 'fix version')
    .option('-l, --level [level:string]', 'version update limit', {
      default: 'major',
    })
    .option('--prerelease', 'use prerelease')
    .arguments('[path]');

  const { options, args } = await command.parse(Deno.args);
  const level_ = (typeof options.level === 'string')
    ? options.level.toLowerCase()
    : options.level;
  if (level_ !== 'major' && level_ !== 'minor' && level_ !== 'patch') {
    console.error(`${level_} is not a valid level.`);
    Deno.exit(1);
  }
  const level = level_ as 'major' | 'minor' | 'patch';
  const usePrerelease = options.prerelease === true;
  const doUpdate = options.update === true;
  const doFix = options.fix === true;

  const cwd = args.filter((v) => typeof v === 'string')[0] ?? Deno.cwd();
  const fileGlobs: string[] = [];
  for (const config of fileConfigs) {
    if (config.enabled === undefined || config.enabled(cwd)) {
      fileGlobs.push(config.file);
    }
  }

  // gather modules from files
  const fileConfigMap = new Map<string, FileConfig>();
  const moduleMap = new Map<string, Module>();
  for await (const [path, globName] of enumerateFiles(cwd, fileGlobs)) {
    console.log(`Scanning ${path}...`);

    for (const config of fileConfigs) {
      if (config.file === globName) {
        fileConfigMap.set(path, config);
      }
    }
  }

  for(const [path, config] of fileConfigMap.entries()) {
    const content = await Deno.readTextFile(path);

    config.resolver(content).forEach((module) => {
      moduleMap.set(`${module.type}-${module.name}-${module.version}`, module);
    });
  }

  const modules = [...moduleMap.values()];

  // check updates
  const results: ModuleVersionCheckResult[] = [];
  for (const module of modules) {
    const result = await checkModuleVersion(module, {
      level,
      usePrerelease,
    });

    if (!result.found) {
      console.log(`❔${module.name} cannot be resolved (${module.type})`);
    } else if (result.outdatedLevel === 'none') {
      if (result.fixed) {
        console.log(`✅ ${module.name} is up to date`);
      } else {
        console.log(`⚠️ ${module.name} may up to date (version not fixed)`);
      }
    } else {
      if (result.fixed) {
        console.log(`❌ ${module.name} is outdated (${result.outdatedLevel})`);
      } else {
        console.log(
          `❌ ${module.name} is outdated (${result.outdatedLevel}) and version is not fixed`,
        );
      }
    }

    results.push(result);
  }

  // show result
  console.log();
  printVersionCheckResult(results);

  // update
  if(doUpdate) {
    await updateVersion(results, doFix, fileConfigMap);
  }
};

main();
