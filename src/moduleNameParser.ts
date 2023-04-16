import { decomposePackageNameVersion } from './util.ts';

interface ModuleNameParser {
  test: RegExp;
  parse: (moduleName: string) => [string, string, string];
}

const denoLandUrlParser: ModuleNameParser = {
  test: /^https?:\/\/deno.land/,
  parse: (moduleName) => {
    const path = new URL(moduleName).pathname.split('/').slice(1);
    const pkgStr = path[0] === 'x' ? path[1] : path[0];

    return [
      'deno_land',
      ...decomposePackageNameVersion(pkgStr),
    ];
  },
};

const rawGitHubUrlParser: ModuleNameParser = {
  test: /^https?:\/\/raw.githubusercontent.com/,
  parse: (moduleName) => {
    const path = new URL(moduleName).pathname.split('/').slice(1);
    const pkgName = `${path[0]}/${path[1]}`;
    const pkgVersion = path[2];

    return ['raw_github', pkgName, pkgVersion];
  },
};

const denoNpmModuleParser: ModuleNameParser = {
  test: /^npm:/,
  parse: (moduleName) => {
    return [
      'npm_package',
      ...decomposePackageNameVersion(moduleName.slice(4)),
    ];
  },
};

const parseModuleName = function (
  url: string,
  parsers: ModuleNameParser[],
): ReturnType<ModuleNameParser['parse']> | null {
  for (const parser of parsers) {
    if (parser.test.test(url)) {
      return parser.parse(url);
    }
  }

  return null;
};

export type { ModuleNameParser };

export {
  denoLandUrlParser,
  denoNpmModuleParser,
  parseModuleName,
  rawGitHubUrlParser,
};
