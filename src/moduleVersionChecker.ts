import { semver } from '../deps.ts';
import { Module } from './moduleTypes.ts';
import pkgResolverMap from './pkgResolver.ts';

type SemVer = semver.SemVer;

interface ModuleVersionCheckOptions {
  level: 'major' | 'minor' | 'patch';
  usePrerelease: boolean;
  gitHubToken?: string;
}

type ModuleVersionCheckResult = {
  fixed: boolean;
  outdated: 'major' | 'minor' | 'patch' | 'pre_release' | 'none' | 'not_found';
  latest: string | null;
};

const versionsCache = new Map<string, SemVer[] | null>();
const getVersions = async function (
  type: keyof typeof pkgResolverMap,
  name: string,
  ...args: string[]
) {
  const cacheName = type + ':' + name;
  const cachedVersions = versionsCache.get(cacheName);
  if (typeof cachedVersions !== 'undefined') {
    return cachedVersions;
  }

  const versions = await pkgResolverMap[type](name, ...args);
  versionsCache.set(cacheName, versions);

  return versions;
};

const getLargestVersion = (versions: SemVer[]) =>
  versions.reduce((max, ver) => semver.gt(ver, max) ? ver : max);

const checkModuleVersion = async function (
  module: Module,
  options: ModuleVersionCheckOptions,
): Promise<ModuleVersionCheckResult | null> {
  const pkgVersion = module.version ?? '';
  const versionFixed = semver.parse(pkgVersion) !== null;

  if (!(module.type in pkgResolverMap)) {
    return null;
  }
  const type = module.type as keyof typeof pkgResolverMap;

  const additionalArgs = [];
  if (type === 'raw_github' && typeof options?.gitHubToken === 'string') {
    additionalArgs.push(options.gitHubToken);
  }

  let versionList = await getVersions(type, module.name, ...additionalArgs);
  if (versionList === null) {
    return {
      fixed: versionFixed,
      outdated: 'not_found',
      latest: null,
    };
  }
  if (!options.usePrerelease) {
    versionList = versionList.filter((version) =>
      version.prerelease.length === 0
    );
  }

  // extract versions in the specified range;
  // fixed versions are interpreted as a range of `=x.y.z`
  const versionsInRange = versionList.filter((v) =>
    semver.satisfies(
      v,
      pkgVersion,
      { includePrerelease: options.usePrerelease },
    )
  );
  if (versionsInRange.length < 1) {
    return {
      fixed: versionFixed,
      outdated: 'not_found',
      latest: null,
    };
  }
  const latestVerInRange = getLargestVersion(versionsInRange);

  const versionsGreater = versionList.filter((v) =>
    semver.gtr(
      v,
      pkgVersion,
      { includePrerelease: options.usePrerelease },
    )
  ).filter((v) => {
    switch (options.level) {
      case 'major':
        return true;
      case 'minor':
        return semver.major(latestVerInRange) === v.major;
      case 'patch':
        return semver.major(latestVerInRange) === v.major &&
          semver.minor(latestVerInRange) === v.minor;
    }
  });

  let outdated: ModuleVersionCheckResult['outdated'] = 'none';
  let latestVer: SemVer | null = null;
  if (versionsGreater.length > 0) {
    latestVer = getLargestVersion(versionsGreater);

    if (latestVer.major > latestVerInRange.major) {
      outdated = 'major';
    } else if (latestVer.minor > latestVerInRange.minor) {
      outdated = 'minor';
    } else if (latestVer.patch > latestVerInRange.patch) {
      outdated = 'patch';
    } else if (
      options.usePrerelease &&
      semver.gt(latestVer, latestVerInRange, { includePrerelease: true })
    ) {
      outdated = 'pre_release';
    }
  }

  // console.log(
  //   name,
  //   versionsInRange.map((v) => v.version),
  //   versionsGreater.map((v) => v.version),
  //   outdated,
  // );

  return {
    fixed: versionFixed,
    outdated,
    latest: latestVer?.version ?? null,
  };
};

export type { ModuleVersionCheckOptions, ModuleVersionCheckResult }

export default checkModuleVersion;
