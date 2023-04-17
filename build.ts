import * as esbuild from "esbuild";
import * as posix from "posix";
import esbuildCachePlugin from "esbuild-plugin-cache";
import esbuildResultPlugin from "esbuild-plugin-result";
import importmap from "./import_map.json" assert { type: "json" };

await esbuild.build({
  entryPoints: [posix.resolve('src', 'mod.ts')],
  bundle: true,
  outdir: posix.resolve('dist'),
  plugins: [
    esbuildResultPlugin(),
    esbuildCachePlugin({
      directory: posix.resolve('cache'),
      importmap,
      rules: [
        { test: /\.ts$/, loader: 'ts' },
      ],
    }),
  ],
  minify: true,
  sourcemap: 'external',
});

esbuild.stop();
