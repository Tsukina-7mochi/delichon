import { semver } from '../deps.ts';
import moduleTypes from './moduleTypes.ts';

type SemVer = semver.SemVer;

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
      value: `Bearer ${token}`,
    });
  }

  const res = await fetch(
    `https://api.github.com/repos/${repoName}/releases/`,
    { headers },
  );
  if (!res.ok) {
    return null;
  }
  const data = JSON.parse(await res.text());
  const versions = (data as Required<{ tag_name: string }>[])
    .map((v) => semver.parse(v.tag_name))
    .filter((v) => v !== null) as SemVer[];

  return versions;
};

const pkgResolverMap = {
  [moduleTypes.npmPackage]: resolveNpmPackage,
  [moduleTypes.denoLand]: resolveDenoLandPackage,
  [moduleTypes.rawGitHub]: resolveRawGitHubContent,
};

export { resolveDenoLandPackage, resolveNpmPackage, resolveRawGitHubContent };

export default pkgResolverMap;
