export interface Importmap {
  imports?: { [key: string]: string };
  scopes?: {
    [key: string]: { [key: string]: string };
  };
}

export type PackageJson = Required<{
  dependencies: { [key: string]: string };
  devDependencies: { [key: string]: string };
}>;
