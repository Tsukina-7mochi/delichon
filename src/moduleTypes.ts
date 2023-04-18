const moduleTypes = {
  denoLand: 'deno_land',
  npmPackage: 'npm_package',
  rawGitHub: 'raw_github',
  esmSh: 'esm_sh',
  unknown: 'unknown',
} as const;

export interface Module {
  type: ModuleType;
  name: string;
  version: string | null;
}

export type ModuleType = typeof moduleTypes[keyof typeof moduleTypes];

export default moduleTypes;
