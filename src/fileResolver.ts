import { ModuleNameParser, parseModuleName } from './moduleNameParser.ts';
import { default as moduleTypes, Module } from './moduleTypes.ts';

interface Importmap {
  imports?: { [key: string]: string };
  scope?: {
    [key: string]: { [key: string]: string };
  };
}

type PackageJson = Required<{
  dependencies: { [key: string]: string };
  devDependencies: { [key: string]: string };
}>;

const resolvePackageJson = function (content: string): Module[] {
  const packageJson = JSON.parse(content) as PackageJson;

  // TODO: support imports other than npm
  const results: Module[] = [];
  for (const name in packageJson.dependencies) {
    results.push({
      type: moduleTypes.npmPackage,
      name,
      version: packageJson.dependencies[name],
    });
  }
  for (const name in packageJson.devDependencies) {
    results.push({
      type: moduleTypes.npmPackage,
      name,
      version: packageJson.devDependencies[name],
    });
  }

  return results;
};

const parseModuleNameWrapper = function (
  moduleName: string,
  parsers: ModuleNameParser[],
): Module {
  return parseModuleName(moduleName, parsers) ?? {
    type: moduleTypes.unknown,
    name: moduleName,
    version: null,
  };
};

const resolveImportMap = function (
  content: string,
  parsers: ModuleNameParser[],
): Module[] {
  const importmap = JSON.parse(content) as Importmap;

  const moduleNames = [
    ...Object.values(importmap?.imports ?? {}),
    ...Object.values(importmap?.scope ?? {})
      .flatMap((map) => Object.values(map)),
  ];

  return moduleNames.map((moduleName) =>
    parseModuleNameWrapper(moduleName, parsers)
  );
};

const resolveDenoModuleNameStrings = function (
  content: string,
  parsers: ModuleNameParser[],
): Module[] {
  const regExps = [
    /"https?:\/\/[\w/:%#\$&\?\(\)~\.=\+\-@]+"/g,
    /'https?:\/\/[\w/:%#\$&\?\(\)~\.=\+\-@]+'/g,
    /`https?:\/\/[\w/:%#\$&\?\(\)~\.=\+\-@]+`/g,
    /"npm:[\w/:%#\$&\?\(\)~\.=\+\-@]+"/g,
    /'npm:[\w/:%#\$&\?\(\)~\.=\+\-@]+'/g,
    /`npm:[\w/:%#\$&\?\(\)~\.=\+\-@]+`/g,
  ];

  const moduleNames = regExps.flatMap((regExp) => [...content.matchAll(regExp)])
    .map((match) => match[0].slice(1, -1));

  return moduleNames.map((moduleName) =>
    parseModuleNameWrapper(moduleName, parsers)
  );
};

export { resolveDenoModuleNameStrings, resolveImportMap, resolvePackageJson };
