import { decomposePackageNameVersion } from './util.ts';
import { default as moduleTypes, Module } from './moduleTypes.ts';

interface ModuleNameParser {
  test: RegExp;
  parse: (moduleName: string) => Module;
}

const denoLandUrlParser: ModuleNameParser = {
  test: /^https?:\/\/deno.land/,
  parse: (moduleName) => {
    const path = new URL(moduleName).pathname.split('/').slice(1);
    const pkgStr = path[0] === 'x' ? path[1] : path[0];
    const [name, version] = decomposePackageNameVersion(pkgStr);

    return {
      type: moduleTypes.denoLand,
      name,
      version,
    };
  },
};

const rawGitHubUrlParser: ModuleNameParser = {
  test: /^https?:\/\/raw.githubusercontent.com/,
  parse: (moduleName) => {
    const path = new URL(moduleName).pathname.split('/').slice(1);
    const name = `${path[0]}/${path[1]}`;
    const version = path[2];

    return {
      type: moduleTypes.rawGitHub,
      name,
      version,
    };
  },
};

const denoNpmModuleParser: ModuleNameParser = {
  test: /^npm:/,
  parse: (moduleName) => {
    const [name, version] = decomposePackageNameVersion(moduleName.slice(4));
    return {
      type: moduleTypes.npmPackage,
      name,
      version,
    }
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
