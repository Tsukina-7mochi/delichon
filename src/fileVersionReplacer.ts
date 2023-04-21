import { ModuleVersionReplacer, replaceModuleVersion } from "./moduleVersionReplacer.ts";
import { Importmap, PackageJson } from './fileTypes.ts';

const replacePackageJsonVersions = function(
  content: string,
  versions: [string, string][],
) {
  const packageJson = JSON.parse(content) as PackageJson;

  for(const moduleName in packageJson.dependencies) {
    for(const [name, version] of versions) {
      if(moduleName === name) {
        packageJson.dependencies[moduleName] = version;
        break;
      }
    }
  }

  for(const name in packageJson.devDependencies) {
    for(const [moduleName, moduleVersion] of versions) {
      if(name === moduleName) {
        packageJson.devDependencies[name] = moduleVersion;
        break;
      }
    }
  }

  return JSON.stringify(packageJson);
}

const replaceImportMapVersions = function(
  content: string,
  versions: [string, string][],
  replacers: ModuleVersionReplacer[]
) {
  const importmap = JSON.parse(content) as Importmap;

  for(const key in importmap.imports) {
    for(const [name, version] of versions) {
      const replaced = replaceModuleVersion(importmap.imports[key], name, replacers, version);
      if(typeof replaced === 'string') {
        importmap.imports[key] = replaced;
        break;
      }
    }
  }

  for(const scopeKey in importmap.scopes) {
    for(const key in importmap.scopes[scopeKey]) {
      for(const [name, version] of versions) {
        const replaced = replaceModuleVersion(importmap.scopes[scopeKey][key], name, replacers, version);
        if(typeof replaced === 'string') {
          importmap.scopes[scopeKey][key] = replaced;
          break;
        }
      }
    }
  }

  return JSON.stringify(importmap);
}

const replaceDenoModuleNameStringVersions = function(
  content_: string,
  versions: [string, string][],
  replacers: ModuleVersionReplacer[]
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
  for(const regExp of regExps) {
    content = content.replaceAll(regExp, (moduleName) => {
      for(const [name, version] of versions) {
        const replaced = replaceModuleVersion(moduleName, name, replacers, version);
        if(typeof replaced === 'string') {
          return replaced
        }
      }
      return moduleName;
    });
  }

  return content;
}

export {
  replacePackageJsonVersions,
  replaceImportMapVersions,
  replaceDenoModuleNameStringVersions
}
