import { fs, posix } from "../deps.ts";
import { Module } from "./moduleTypes.ts"
import * as moduleNameParser from './moduleNameParser.ts';
import * as fileResolver from './fileResolver.ts';

interface FileConfig {
  file: string,
  enabled?: (cwd: string) => boolean,
  resolver: (content: string) => Module[],
  // replacer
}

const isDenoProjectCache = new Map<string, boolean>();
const isDenoProject = (cwd: string) => {
  const cachedResult = isDenoProjectCache.get(cwd);
  if(typeof cachedResult === 'boolean') {
    return cachedResult;
  }

  if(fs.existsSync(posix.join(cwd, 'deno.json'), { isFile: true })) {
    isDenoProjectCache.set(cwd, true);
    return true;
  }
  if(fs.existsSync(posix.join(cwd, 'deno.jsonc'), { isFile: true })) {
    isDenoProjectCache.set(cwd, true);
    return true;
  }

  isDenoProjectCache.set(cwd, false);
  return false;
}

const npmPackageJson: FileConfig = {
  file: 'package.json',
  resolver: (content) => {
    return fileResolver.resolvePackageJson(content);
  }
}

const denoImportMap: FileConfig = {
  file: 'import_map.json',
  enabled: isDenoProject,
  resolver: (content) => {
    return fileResolver.resolveImportMap(content, [
      moduleNameParser.denoLandUrlParser,
      moduleNameParser.rawGitHubUrlParser,
      moduleNameParser.denoNpmModuleParser,
    ]);
  }
}

const denoDepsTs: FileConfig = {
  file: 'deps.ts',
  enabled: isDenoProject,
  resolver: (content) => {
    return fileResolver.resolveDenoModuleNameStrings(content, [
      moduleNameParser.denoLandUrlParser,
      moduleNameParser.rawGitHubUrlParser,
      moduleNameParser.denoNpmModuleParser,
    ])
  }
}

const denoDepsJs: FileConfig = {
  file: '**/deps.js',
  enabled: isDenoProject,
  resolver: (content) => {
    return fileResolver.resolveDenoModuleNameStrings(content, [
      moduleNameParser.denoLandUrlParser,
      moduleNameParser.rawGitHubUrlParser,
      moduleNameParser.denoNpmModuleParser,
    ])
  }
}

const configurations = [
  npmPackageJson,
  denoImportMap,
  denoDepsTs,
  denoDepsJs,
];

export { configurations };