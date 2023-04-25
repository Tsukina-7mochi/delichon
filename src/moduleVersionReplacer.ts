import { SemVer } from 'semver';
import { decomposePackageNameVersion } from './util.ts';

const isIntegerString = (str: unknown) =>
  typeof str === 'string' && isFinite(parseInt(str));

const updateVersionRange = function (range: string, version: SemVer) {
  const rangeRegExp =
    /^([v=\^~])?(\d+|[xX*])(?:\.(\d+|[xX*])(?:\.(\d+|[xX*])(.+)?)?)?$/;

  const match = range.match(rangeRegExp);
  if (match === null) {
    return null;
  }

  const prefix = match[1];
  let major = match[2];
  let minor = match[3];
  let patch = match[4];
  let prerelease = match[5];

  if (isIntegerString(major)) {
    major = `${version.major}`;
  }
  if (isIntegerString(minor)) {
    minor = `${version.minor}`;
  }
  if (isIntegerString(patch)) {
    patch = `${version.patch}`;
  }
  if (version.prerelease.length === 0) {
    prerelease = '';
  } else {
    prerelease = ((prerelease ?? '-')[0]) + version.prerelease.join('.');
  }

  let newRange = `${prefix ?? ''}${major}`;
  if (minor) {
    newRange += `.${minor}`;
  }
  if (patch) {
    newRange += `.${patch}`;
  }
  if (prerelease) {
    newRange += prerelease;
  }

  return newRange;
};

interface ModuleVersionReplacer {
  test: RegExp;
  replace: (
    moduleName: string,
    nameTest: string,
    version: string,
  ) => string | null;
}

const denoLandUrlReplacer: ModuleVersionReplacer = {
  test: /^https?:\/\/deno.land/,
  replace: (moduleName, nameTest, version) => {
    const url = new URL(moduleName);
    const path = url.pathname.split('/').slice(1);
    const pkgStr = path[0] === 'x' ? path[1] : path[0];
    const [name, _] = decomposePackageNameVersion(pkgStr);

    if (name !== nameTest) {
      return null;
    }

    path[path[0] === 'x' ? 1 : 0] = `${name}@${version}`;

    return `https://deno.land/${path.join('/')}${url.search}`;
  },
};

const rawGitHubUrlReplacer: ModuleVersionReplacer = {
  test: /^https?:\/\/raw.githubusercontent.com/,
  replace: (moduleName, nameTest, version) => {
    const url = new URL(moduleName);
    const path = url.pathname.split('/').slice(1);
    const name = `${path[0]}/${path[1]}`;

    if (name !== nameTest) {
      return null;
    }

    path[2] = version;

    return `https://raw.githubusercontent.com/${path.join('/')}${url.search}`;
  },
};

const denoNpmModuleReplacer: ModuleVersionReplacer = {
  test: /^npm:/,
  replace: (moduleName, nameTest, version) => {
    const [name, _] = decomposePackageNameVersion(moduleName.slice(4));

    if (name !== nameTest) {
      return null;
    }

    return `npm:${name}@${version}`;
  },
};

const esmShModuleReplacer: ModuleVersionReplacer = {
  test: /^https?:\/\/esm.sh/,
  replace: (moduleName, nameTest, version) => {
    const url = new URL(moduleName);
    const path = url.pathname.split('/').slice(1);
    const [name, _] = decomposePackageNameVersion(path[0]);

    if (name !== nameTest) {
      return null;
    }

    return `https://esm.sh/${name}@${version}${url.search}`;
  },
};

const replaceModuleVersion = function (
  moduleName: string,
  nameTest: string,
  replacers: ModuleVersionReplacer[],
  version: string,
): ReturnType<ModuleVersionReplacer['replace']> | null {
  for (const replacer of replacers) {
    if (replacer.test.test(moduleName)) {
      const replaced = replacer.replace(moduleName, nameTest, version);

      if (replaced !== null) {
        return replaced;
      }
    }
  }

  return null;
};

export type { ModuleVersionReplacer };

export {
  denoLandUrlReplacer,
  denoNpmModuleReplacer,
  esmShModuleReplacer,
  rawGitHubUrlReplacer,
  replaceModuleVersion,
  updateVersionRange,
};
