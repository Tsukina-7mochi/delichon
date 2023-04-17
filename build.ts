import * as esbuild from "esbuild";
import * as posix from "posix";
import esbuildResultPlugin from "esbuild-plugin-result";
import importmap from "./import_map.json" assert { type: "json" };

interface Importmap {
  imports?: { [key: string]: string };
  scopes?: {
    [key: string]: { [key: string]: string };
  };
}

const importmapAsExternalPlugin = (importmap: Importmap): esbuild.Plugin => ({
  name: 'importmap-as-external',
  setup(build) {
    const imports = importmap.imports ?? {};
    const scopes = importmap.scopes ?? {};

    for(const name in imports) {
      const filter = new RegExp(`^${name}$`);
      build.onResolve({ filter }, () => ({
        external: true,
        path: imports[name]
      }));
    }

    for(const scope in scopes) {
      for(const name in scopes[scope]) {
        const filter = new RegExp(`^${name}$`);
        build.onResolve({ filter }, () => ({
          external: true,
          path: imports[name]
        }));
      }
    }
  },
})

await esbuild.build({
  entryPoints: [posix.resolve('src', 'mod.ts')],
  bundle: true,
  outdir: posix.resolve('dist'),
  plugins: [
    esbuildResultPlugin(),
    importmapAsExternalPlugin(importmap),
  ],
  platform: 'neutral',
  target: 'deno1',
  minify: true,
  sourcemap: 'external',
});

esbuild.stop();
