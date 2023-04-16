import { ModuleNameParser, parseModuleName } from './moduleNameParser.ts';

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

/** type, pkg name, version */
type FileResolveResult = [string, string, string | null];

const parseModuleNameWrapper = function (
  moduleName: string,
  parsers: ModuleNameParser[],
): FileResolveResult {
  return parseModuleName(moduleName, parsers) ?? ['unknown', moduleName, null];
};

const resolvePackageJson = function (content: string): FileResolveResult[] {
  const packageJson = JSON.parse(content) as PackageJson;

  // TODO: support imports other than npm
  const results: FileResolveResult[] = [];
  for (const key in packageJson.dependencies) {
    const value = packageJson.dependencies[key];
    results.push(['npm_package', key, packageJson.dependencies[key]]);
  }
  for (const key in packageJson.devDependencies) {
    results.push(['npm_package', key, packageJson.devDependencies[key]]);
  }

  return results;
};

const resolveImportMap = function (
  content: string,
  parsers: ModuleNameParser[],
): FileResolveResult[] {
  const importmap = JSON.parse(content) as Importmap;

  const moduleNames = [
    ...Object.values(importmap?.imports ?? {}),
    ...Object.values(importmap?.scope ?? {})
      .flatMap((map) => Object.values(map)),
  ];

  console.log(moduleNames);

  return moduleNames.map((moduleName) =>
    parseModuleNameWrapper(moduleName, parsers)
  );
};

const resolveDenoModuleNameStrings = function (
  content: string,
  parsers: ModuleNameParser[],
): FileResolveResult[] {
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

export type { FileResolveResult };

export { resolveDenoModuleNameStrings, resolveImportMap, resolvePackageJson };
