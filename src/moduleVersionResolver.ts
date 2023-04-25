import * as semver from 'semver';
import { SemVer } from 'semver';
import moduleTypes from './moduleTypes.ts';
import { decomposePackageNameVersion } from './util.ts';

const getLargestVersion = (versions: SemVer[]) =>
  versions.reduce((max, ver) => semver.gt(ver, max) ? ver : max);

const calcLatestVersionRange = function (
  refVer: SemVer,
  level: 'major' | 'minor' | 'patch',
) {
  let range = `>=${refVer}`;

  if (level === 'major') {
    // do nothing
  } else if (level === 'minor') {
    range += ` <=${refVer.major}`;
  } else if (level === 'patch') {
    range += ` <=${refVer.major}.${refVer.minor}`;
  }

  return range;
};

const resolveNpmPackage = async function (pkgName: string) {
  const url = `https://registry.npmjs.org/${pkgName}`;
  const res = await fetch(url);
  if (!res.ok) {
    return null;
  }
  const data = JSON.parse(await res.text());
  const versions = Object.keys(data['versions'])
    .map((v) => semver.parse(v))
    .filter((v) => v !== null) as SemVer[];

  return versions;
};

const resolveDenoLandPackage = async function (pkgName: string) {
  const url = `https://apiland.deno.dev/v2/modules/${pkgName}`;
  const res = await fetch(url);
  if (!res.ok) {
    return null;
  }
  const data = JSON.parse(await res.text());
  const versions = (data['versions'] as string[])
    .map((v) => semver.parse(v))
    .filter((v) => v !== null) as SemVer[];

  return versions;
};

const resolveRawGitHubContent = async function (
  repoName: string,
  token?: string,
) {
  const headers = {
    'Accept': 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  };
  if (typeof token === 'string') {
    Object.defineProperty(headers, 'Authorization', {
      value: `Barer ${token}`,
    });
  }

  const res = await fetch(
    `https://api.github.com/repos/${repoName}/releases`,
    { headers },
  );
  if (!res.ok) {
    return null;
  }
  const data = JSON.parse(await res.text()) as Required<{ tag_name: string }>[];
  const versions = (data)
    .map((v) => semver.parse(v.tag_name))
    .filter((v) => v !== null) as SemVer[];

  return versions;
};

const getEsmShVersion = async function (url: string) {
  const moduleNameRegExp = /^\/\* esm.sh - (\S+) \*\//;
  const res = await fetch(url);
  if (!res.ok) {
    return null;
  }

  const content = await res.text();
  const moduleNameMatch = content.match(moduleNameRegExp);
  if (moduleNameMatch === null) {
    return null;
  }
  const [_, version] = decomposePackageNameVersion(moduleNameMatch[1]);
  return version;
};
const resolveEsmSh = async function (pkgName: string, versionRange: string) {
  const latestUrl = `https://esm.sh/${pkgName}`;
  const latestInRangeUrl = `${latestUrl}@${versionRange}`;

  const latest = semver.parse(await getEsmShVersion(latestUrl));
  const latestInRange = semver.parse(await getEsmShVersion(latestInRangeUrl));
  if (latest === null || latestInRange === null) {
    return null;
  }
  return { latest, latestInRange };
};

interface GetVersionsOptions {
  level: 'major' | 'minor' | 'patch';
  usePrerelease: boolean;
  gitHubToken?: string;
}
const versionListCache = new Map<string, SemVer[] | null>();
const getLatestVersions = async function (
  type: typeof moduleTypes[keyof typeof moduleTypes],
  name: string,
  version: string,
  options: GetVersionsOptions,
) {
  const semverOption = { includePrerelease: options.usePrerelease };
  if (
    type === moduleTypes.denoLand || type === moduleTypes.npmPackage ||
    type === moduleTypes.rawGitHub
  ) {
    const cacheName = type + ':' + name;
    const cachedVersionList = versionListCache.get(cacheName);

    let versionList: SemVer[] | null = null;
    if (typeof cachedVersionList !== 'undefined') {
      versionList = cachedVersionList;
    } else {
      if (type === moduleTypes.denoLand) {
        versionList = await resolveDenoLandPackage(name);
      } else if (type === moduleTypes.npmPackage) {
        versionList = await resolveNpmPackage(name);
      } else if (type === moduleTypes.rawGitHub) {
        versionList = await resolveRawGitHubContent(name, options.gitHubToken);
      }

      versionListCache.set(cacheName, versionList);
    }

    if (versionList === null || versionList.length < 1) {
      return null;
    }

    const versionListInRange = versionList
      .filter((ver) => semver.satisfies(ver, version, semverOption));
    if (versionListInRange.length < 1) {
      return null;
    }
    const latestInRange = getLargestVersion(versionListInRange);

    const versionGreaterRange = calcLatestVersionRange(
      latestInRange,
      options.level,
    );
    const versionListGreater = versionList
      .filter((ver) =>
        semver.satisfies(ver, versionGreaterRange, semverOption)
      );

    return {
      latest: getLargestVersion(versionListGreater),
      latestInRange: latestInRange,
    };
  } else if (type === moduleTypes.esmSh) {
    return resolveEsmSh(name, version);
  }

  return null;
};

export { getLatestVersions };
