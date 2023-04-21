import { SemVer } from 'semver';
import { decomposePackageNameVersion } from './util.ts';

const isIntegerString = (str: unknown) =>
  typeof str === 'string' && isFinite(parseInt(str));

const updateVersionRange = function(range: string, version: SemVer) {
  const rangeRegExp = /^([v=\^~])?(\d+|[xX*])(?:\.(\d+|[xX*])(?:\.(\d+|[xX*])(.+)?)?)?$/;

  const match = range.match(rangeRegExp);
  if(match === null) {
    return null;
  }

  const prefix = match[1];
  let major = match[2];
  let minor = match[3];
  let patch = match[4];
  let prerelease = match[5];

  if(isIntegerString(major)) {
    major = `${version.major}`;
  }
  if(isIntegerString(minor)) {
    minor = `${version.minor}`;
  }
  if(isIntegerString(patch)) {
    patch = `${version.patch}`;
  }
  if(version.prerelease.length === 0) {
    prerelease = '';
  } else {
    prerelease = ((prerelease ?? '-')[0]) + version.prerelease.join('.');
  }

  let newRange = `${prefix ?? ''}${major}`;
  if(minor) {
    newRange += `.${minor}`;
  }
  if(patch) {
    newRange += `.${patch}`;
  }
  if(prerelease) {
    newRange += prerelease;
  }

  return newRange;
}

interface ModuleVersionReplacer {
  test: RegExp;
  replace: (moduleName: string, version: string) => string;
}

const denoLandUrlReplacer: ModuleVersionReplacer = {
  test: /^https?:\/\/deno.land/,
  replace: (moduleName, version) => {
    const url = new URL(moduleName);
    const path = url.pathname.split('/').slice(1);
    const pkgStr = path[0] === 'x' ? path[1] : path[0];
    const [name, _] = decomposePackageNameVersion(pkgStr);

    path[path[0] === 'x' ? 1 : 0] = `${name}@${version}`;

    return `https://deno.land/${path.join('/')}${url.search}`;
  }
}

const rawGitHubUrlReplacer: ModuleVersionReplacer = {
  test: /^https?:\/\/raw.githubusercontent.com/,
  replace: (moduleName, version) => {
    const url = new URL(moduleName);
    const path = url.pathname.split('/').slice(1);

    path[2] = version;

    return `https://raw.githubusercontent.com/${path.join('/')}${url.search}`;
  }
}

const denoNpmModuleReplacer: ModuleVersionReplacer = {
  test: /^npm:/,
  replace: (moduleName, version) => {
    const [name, _] = decomposePackageNameVersion(moduleName.slice(4));
    return `npm:${name}@${version}`;
  }
}

const esmShModuleReplacer: ModuleVersionReplacer = {
  test: /^https?:\/\/esm.sh/,
  replace: (moduleName, version) => {
    const url = new URL(moduleName);
    const path = url.pathname.split('/').slice(1);
    const [name, _] = decomposePackageNameVersion(path[0]);

    return `https://esm.sh/${name}@${version}${url.search}`;
  }
}

const replaceModuleVersion = function(
  moduleName: string,
  replacers: ModuleVersionReplacer[],
  version: string
): ReturnType<ModuleVersionReplacer['replace']> | null {
  for(const replacer of replacers) {
    if(replacer.test.test(moduleName)) {
      return replacer.replace(moduleName, version);
    }
  }

  return null;
}

export {
  updateVersionRange,
  denoLandUrlReplacer,
  rawGitHubUrlReplacer,
  denoNpmModuleReplacer,
  esmShModuleReplacer,
  replaceModuleVersion,
};
