import * as semver from 'semver';
import { FileConfig } from './files.ts';
import { ModuleVersionCheckResult } from './moduleVersionChecker.ts';
import { updateVersionRange } from './moduleVersionReplacer.ts';

const updateVersion = async function (
  results: ModuleVersionCheckResult[],
  doUpdate: boolean,
  doFix: boolean,
  fileConfigMap: Map<string, FileConfig>,
) {
  const versions: [string, string][] = [];

  for (const result of results) {
    if (!result.found) continue;

    const module = result.module;
    if(doUpdate && result.outdated) {
      if (typeof module.version !== 'string') continue;

      const latestVersion = semver.parse(result.latestVersion);
      if (latestVersion === null) continue;

      const targetVersion = doFix
        ? result.latestVersion
        : updateVersionRange(module.version, latestVersion);

      if (targetVersion === null) continue;

      console.log(
        `\x1b[32mUpdate\x1b[0m ${module.name}: ${module.version} -> ${targetVersion}`,
      );
      versions.push([module.name, targetVersion]);
    } else if(doFix && !result.fixed) {
      console.log(
        `\x1b[32mFix\x1b[0m ${module.name}: ${module.version} -> ${result.latestVersionInRange}`,
      );
      versions.push([module.name, result.latestVersionInRange]);
    }
  }

  for (const [path, config] of fileConfigMap.entries()) {
    console.log(`Updating ${path}`);

    let content = await Deno.readTextFile(path);

    content = config.replacer(content, versions);

    await Deno.writeTextFileSync(path, content);
  }
};

export default updateVersion;
