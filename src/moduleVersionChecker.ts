import * as semver from 'semver';
import { Module } from './moduleTypes.ts';
import { getLatestVersions } from './moduleVersionResolver.ts';

interface ModuleVersionCheckOptions {
  level: 'major' | 'minor' | 'patch';
  usePrerelease: boolean;
  gitHubToken?: string;
}

interface ModuleVersionCheckResultFound {
  module: Module;
  fixed: boolean;
  found: true;
  outdated: boolean;
  outdatedLevel: 'major' | 'minor' | 'patch' | 'pre_release' | 'none';
  latestVersion: string;
  latestVersionInRange: string;
}

interface ModuleVersionCheckResultNotFound {
  module: Module;
  fixed: boolean;
  found: false;
}

type ModuleVersionCheckResult =
  | ModuleVersionCheckResultFound
  | ModuleVersionCheckResultNotFound;

const checkModuleVersion = async function (
  module: Module,
  options: ModuleVersionCheckOptions,
): Promise<ModuleVersionCheckResult> {
  const versionFixed = semver.parse(module.version ?? '') !== null;

  const latestVersions = await getLatestVersions(
    module.type,
    module.name,
    module.version ?? '',
    options,
  );
  if (latestVersions === null) {
    return {
      module,
      fixed: versionFixed,
      found: false,
    };
  }

  const latestVer = latestVersions.latest;
  const latestVerInRange = latestVersions.latestInRange;

  let outdatedLevel: ModuleVersionCheckResultFound['outdatedLevel'] = 'none';
  if(semver.gt(latestVer, latestVerInRange, { includePrerelease: true })) {
    if (latestVer.major > latestVerInRange.major) {
      outdatedLevel = 'major';
    } else if (latestVer.minor > latestVerInRange.minor) {
      outdatedLevel = 'minor';
    } else if (latestVer.patch > latestVerInRange.patch) {
      outdatedLevel = 'patch';
    } else {
      outdatedLevel = 'pre_release';
    }
  }

  // console.log(
  //   name,
  //   versionsInRange.map((v) => v.version),
  //   versionsGreater.map((v) => v.version),
  //   outdated,
  // );

  return {
    module,
    fixed: versionFixed,
    found: true,
    outdated: outdatedLevel !== 'none',
    outdatedLevel,
    latestVersion: latestVer.version,
    latestVersionInRange: latestVerInRange.version,
  };
};

export type { ModuleVersionCheckOptions, ModuleVersionCheckResult };

export default checkModuleVersion;
