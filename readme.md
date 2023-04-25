# Delichon

## Overview

Dependency scanner for Typescript/Javascript project

## Currently supported projects

- Node.js (`package.json`)
- Deno (`import_map.json`, `deps.ts`)

## Currently supported repositories

- registry.npmjs.org
- deno.land
- raw.githubusercontent.com

## Usage

```sh
$deno run --allow-read --allow-write --allow-net https://raw.githubusercontent.com/Tsukina-7mochi/delichon/deploy/mod.js
```

To update Delichon:

```sh
$deno cache --reload https://raw.githubusercontent.com/Tsukina-7mochi/delichon/deploy/mod.js
```

### Options

- `-u, --update`: Update dependencies automatically
- `--fix`: Fix ranged versions to specific ones (e.g., `^1.2.3` -> `1.3.0` if version `1.3.0` is available)
- `-l, --level [major|minor|patch]`: Version check limit
- `--prerelease`: Use prerelease for version to update
