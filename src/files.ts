import * as fs from 'fs';
import * as posix from 'posix';
import { Module } from './moduleTypes.ts';
import * as moduleNameParser from './moduleNameParser.ts';
import * as fileResolver from './fileResolver.ts';
import * as moduleVersionReplacer from './moduleVersionReplacer.ts';
import * as fileVersionReplacer from './fileVersionReplacer.ts';
import { replacePackageJsonVersions } from './fileVersionReplacer.ts';

interface FileConfig {
  file: string;
  enabled?: (cwd: string) => boolean;
  resolver: (content: string) => Module[];
  replacer: (content: string, versions: [string, string][]) => void;
}

const isDenoProjectCache = new Map<string, boolean>();
const isDenoProject = (cwd: string) => {
  const cachedResult = isDenoProjectCache.get(cwd);
  if (typeof cachedResult === 'boolean') {
    return cachedResult;
  }

  if (fs.existsSync(posix.join(cwd, 'deno.json'), { isFile: true })) {
    isDenoProjectCache.set(cwd, true);
    return true;
  }
  if (fs.existsSync(posix.join(cwd, 'deno.jsonc'), { isFile: true })) {
    isDenoProjectCache.set(cwd, true);
    return true;
  }

  isDenoProjectCache.set(cwd, false);
  return false;
};

const denoModuleNameParsers = [
  moduleNameParser.denoLandUrlParser,
  moduleNameParser.rawGitHubUrlParser,
  moduleNameParser.denoNpmModuleParser,
  moduleNameParser.esmShModuleParser,
];

const denoModuleVersionReplacers = [
  moduleVersionReplacer.denoLandUrlReplacer,
  moduleVersionReplacer.rawGitHubUrlReplacer,
  moduleVersionReplacer.denoNpmModuleReplacer,
  moduleVersionReplacer.esmShModuleReplacer,
];

const npmPackageJson: FileConfig = {
  file: 'package.json',
  resolver: (content) => {
    return fileResolver.resolvePackageJson(content);
  },
  replacer: (content, versions) => {
    return replacePackageJsonVersions(content, versions);
  }
};

const denoImportMap: FileConfig = {
  file: 'import_map.json',
  enabled: isDenoProject,
  resolver: (content) => {
    return fileResolver.resolveImportMap(content, denoModuleNameParsers);
  },
  replacer: (content, versions) => {
    return fileVersionReplacer.replaceImportMapVersions(content, versions, denoModuleVersionReplacers);
  }
};

const denoDepsTs: FileConfig = {
  file: 'deps.ts',
  enabled: isDenoProject,
  resolver: (content) => {
    return fileResolver.resolveDenoModuleNameStrings(content, denoModuleNameParsers);
  },
  replacer: (content, versions) => {
    return fileVersionReplacer.replaceDenoModuleNameStringVersions(content, versions, denoModuleVersionReplacers);
  }
};

const denoDepsJs: FileConfig = {
  file: '**/deps.js',
  enabled: isDenoProject,
  resolver: (content) => {
    return fileResolver.resolveDenoModuleNameStrings(content, denoModuleNameParsers);
  },
  replacer: (content, versions) => {
    return fileVersionReplacer.replaceDenoModuleNameStringVersions(content, versions, denoModuleVersionReplacers);
  }
};

const configurations = [
  npmPackageJson,
  denoImportMap,
  denoDepsTs,
  denoDepsJs,
];

export { configurations };
