import * as semver from 'semver';
import { Module } from './moduleTypes.ts';
import { getLatestVersions } from './pkgResolver.ts';

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

const checkModuleVersion = async function (
  module: Module,
  options: ModuleVersionCheckOptions,
): Promise<ModuleVersionCheckResult | null> {
  const versionFixed = semver.parse(module.version ?? '') !== null;

  const latestVersions = await getLatestVersions(
    module.type,
    module.name,
    module.version ?? '',
    options
  );
  if(latestVersions === null) {
    return {
      fixed: versionFixed,
      outdated: 'not_found',
      latest: null,
    };
  }

  const latestVer = latestVersions.latest;
  const latestVerInRange = latestVersions.latestInRange;

  let outdated: ModuleVersionCheckResult['outdated'] = 'none';
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

export type { ModuleVersionCheckOptions, ModuleVersionCheckResult };

export default checkModuleVersion;
