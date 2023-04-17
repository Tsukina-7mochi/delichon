import * as fs from "fs";
import * as posix from "posix";
import * as cliffy from "cliffy";
import { Module } from './moduleTypes.ts';
import checkModuleVersion, { ModuleVersionCheckResult } from './moduleVersionChecker.ts';
import { configurations as fileConfigs } from './files.ts';

const enumerateFiles = async function* (basePath: string, files: string[]) {
  for (const filename of files) {
    for await (const file of fs.expandGlob(posix.resolve(basePath, filename))) {
      if (file.isFile) {
        yield [file.path, filename];
      }
    }
  }
};

const main = async function () {
  const command = new cliffy.Command()
    .name('deps-scanner-js')
    .description('Dependency scanner for Node.js and Deno project')
    .option('-l, --level [level:string]', 'version update limit', {
      default: 'major'
    })
    .option('--prerelease', 'use prerelease')
    .arguments('[path]');

  const { options, args } = await command.parse(Deno.args);
  let level_ = (typeof options.level === 'string') ? options.level.toLowerCase() : options.level;
  if(level_ !== 'major' && level_ !== 'minor' && level_ !== 'patch') {
    console.error(`${level_} is not a valid level.`);
    Deno.exit(1);
  }
  const level = level_ as 'major' | 'minor' | 'patch';
  const usePrerelease = options.prerelease === true;

  const cwd = Deno.cwd();
  const fileGlobs: string[] = [];
  for(const config of fileConfigs) {
    if(config.enabled === undefined || config.enabled(cwd)) {
      fileGlobs.push(config.file);
    }
  }

  // gather modules from files
  const moduleMap = new Map<string, Module>();
  for await (const [path, globName] of enumerateFiles(cwd, fileGlobs)) {
    console.log(`Scanning ${path}...`);

    const content = await Deno.readTextFile(path);

    for(const config of fileConfigs) {
      if(config.file === globName) {
        config.resolver(content).forEach((module) => {
          moduleMap.set(`${module.type}-${module.name}`, module);
        });
      }
    }
  }
  const modules = [...moduleMap.values()];

  // check updates
  const results: [Module, ModuleVersionCheckResult][] = [];
  for (const module of modules) {
    const result = await checkModuleVersion(module, {
      level,
      usePrerelease,
    });

    if (result === null) {
      console.log(`❔${module.name} cannot be resolved (${module.type})`);
    } else if (result.outdated === 'not_found') {
      console.log(`❔ ${module.name} not found on remote (${module.type})`);
    } else if (result.outdated === 'none') {
      if (result.fixed) {
        console.log(`✅ ${module.name} is up to date`);
      } else {
        console.log(`⚠️ ${module.name} may up to date (version not fixed)`);
      }
    } else {
      if (result.fixed) {
        console.log(`❌ ${module.name} is outdated (${result.outdated})`);
      } else {
        console.log(
          `❌ ${module.name} is outdated (${result.outdated}) and version is not fixed`,
        );
      }
    }

    if (result !== null) {
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
  const notFoundModules = results.filter(([_, result]) =>
    result.outdated === 'not_found'
  );
  const notFixedModules = results.filter(([_, result]) => !result.fixed);

  console.log();
  console.log(
    `\x1b[1m${outdatedModules.length}\x1b[0m module${
      outdatedModules.length > 1 ? 's are' : ' is'
    } outdated.`,
  );
  if (notFoundModules.length > 0) {
    console.log('Could not find following modules:');
    console.log(
      '  ' + notFoundModules.map(([module]) => module.name).join(', '),
    );
  }
  if (notFixedModules.length > 0) {
    console.log('Version not fixed at following modules:');
    console.log(
      '  ' + notFixedModules.map(([module]) => module.name).join(', '),
    );
  }

  if(outdatedModules.length > 0) {
    let logTable: string[][] = [
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
    for (const [module, result] of outdatedModules) {
      logTable.push([
        `${outdatedTextMap[result.outdated]}`,
        module.name,
        module.version ?? '(null)',
        result.latest ?? '(null)',
      ]);
    }
    const colWidths = new Array(logTable[0].length)
      .fill(0)
      .map((_, i) =>
        logTable.reduce(
          (max, arr) => arr[i].length > max ? arr[i].length : max,
          0,
        )
      );

    logTable = logTable.map((arr) =>
      arr.map((v, i) => `${v}${' '.repeat(colWidths[i])}`.slice(0, colWidths[i]))
    );
    // adjust for ANSI escape sequence
    colWidths[0] = 5;
    logTable[0][0] = '     ';

    console.log(logTable[0].join(' '));
    console.log(colWidths.map((len) => '-'.repeat(len)).join(' '));
    console.log(logTable.slice(1).map((arr) => arr.join(' ')).join('\n'));
  }
};

main();
