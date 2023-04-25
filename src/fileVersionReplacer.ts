import {
  ModuleVersionReplacer,
  replaceModuleVersion,
} from './moduleVersionReplacer.ts';
import { JSONParser, replaceJSONValue } from 'json-edit';
import { Importmap } from './fileTypes.ts';

const replacePackageJsonVersions = function (
  content: string,
  versions: [string, string][],
) {
  const packageJson = JSONParser.parse(content);

  for (const [name, version] of versions) {
    try {
      replaceJSONValue(
        packageJson,
        ['dependencies', name],
        JSON.stringify(version),
      );
      continue;
    } catch {
      // just erase error
    }

    try {
      replaceJSONValue(
        packageJson,
        ['devDependencies', name],
        JSON.stringify(version),
      );
      continue;
    } catch {
      // just erase error
    }

    console.error(`Failed to update ${name}`);
  }

  return packageJson.stringify();
};

const replaceImportMapVersions = function (
  content: string,
  versions: [string, string][],
  replacers: ModuleVersionReplacer[],
) {
  const importmap = JSON.parse(content) as Importmap;
  const importmapTree = JSONParser.parse(content);

  for (const key in importmap.imports) {
    for (const [name, version] of versions) {
      const replaced = replaceModuleVersion(
        importmap.imports[key],
        name,
        replacers,
        version,
      );
      if (typeof replaced === 'string') {
        try {
          replaceJSONValue(
            importmapTree,
            ['imports', key],
            JSON.stringify(replaced),
          );
          break;
        } catch {
          console.error(`Failed to update ${name}`);
        }
      }
    }
  }

  for (const scopeKey in importmap.scopes) {
    for (const key in importmap.scopes[scopeKey]) {
      for (const [name, version] of versions) {
        const replaced = replaceModuleVersion(
          importmap.scopes[scopeKey][key],
          name,
          replacers,
          version,
        );
        if (typeof replaced === 'string') {
          try {
            replaceJSONValue(
              importmapTree,
              ['scopes', scopeKey, key],
              JSON.stringify(replaced),
            );
            break;
          } catch {
            console.error(`Failed to update ${name}`);
          }
          break;
        }
      }
    }
  }

  return importmapTree.stringify();
};

const replaceDenoModuleNameStringVersions = function (
  content_: string,
  versions: [string, string][],
  replacers: ModuleVersionReplacer[],
) {
  const regExps = [
    /("https?:\/\/[\w/:%#\$&\?\(\)~\.=\+\-@]+")/g,
    /('https?:\/\/[\w/:%#\$&\?\(\)~\.=\+\-@]+')/g,
    /(`https?:\/\/[\w/:%#\$&\?\(\)~\.=\+\-@]+`)/g,
    /("npm:[\w/:%#\$&\?\(\)~\.=\+\-@]+")/g,
    /('npm:[\w/:%#\$&\?\(\)~\.=\+\-@]+')/g,
    /(`npm:[\w/:%#\$&\?\(\)~\.=\+\-@]+`)/g,
  ];

  let content = content_;
  for (const regExp of regExps) {
    content = content.replaceAll(regExp, (moduleName_) => {
      const moduleName = moduleName_.slice(1, -1);
      const quote = moduleName_[0];

      for (const [name, version] of versions) {
        const replaced = replaceModuleVersion(
          moduleName,
          name,
          replacers,
          version,
        );
        if (typeof replaced === 'string') {

          return quote + replaced + quote;
        }
      }
      return moduleName_;
    });
  }

  return content;
};

export {
  replaceDenoModuleNameStringVersions,
  replaceImportMapVersions,
  replacePackageJsonVersions,
};
