import { SemVer } from 'semver';

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

export {
  updateVersionRange,
};
