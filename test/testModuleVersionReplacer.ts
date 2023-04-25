import { assert, assertEquals } from 'https://deno.land/std@0.183.0/testing/asserts.ts';
import { SemVer } from 'semver';
import { denoLandUrlReplacer, denoNpmModuleReplacer, esmShModuleReplacer, rawGitHubUrlReplacer, updateVersionRange } from '../src/moduleVersionReplacer.ts';

Deno.test('[moduleVersionReplacer] 1.0.0 -> 2.0.0', () => {
  assertEquals(
    updateVersionRange('1.0.0', new SemVer('2.0.0')),
    '2.0.0'
  );
});

Deno.test('[moduleVersionReplacer] 1.0.0 -> 1.0.1-alpha.1', () => {
  assertEquals(
    updateVersionRange('1.0.0', new SemVer('1.0.1-alpha.1')),
    '1.0.1-alpha.1'
  );
});

Deno.test('[moduleVersionReplacer] 1.0.0-alpha.1 -> 1.0.0', () => {
  assertEquals(
    updateVersionRange('1.0.0-alpha.1', new SemVer('1.0.0')),
    '1.0.0'
  );
});

Deno.test('[moduleVersionReplacer] 1.0.0-alpha.1 -> 1.0.0-alpha.2', () => {
  assertEquals(
    updateVersionRange('1.0.0-alpha.1', new SemVer('1.0.0-alpha.2')),
    '1.0.0-alpha.2'
  );
});

Deno.test('[moduleVersionReplacer] v1.0.0 -> 2.0.0', () => {
  assertEquals(
    updateVersionRange('v1.0.0', new SemVer('2.0.0')),
    'v2.0.0'
  );
});

Deno.test('[moduleVersionReplacer] =1.0.0 -> 2.0.0', () => {
  assertEquals(
    updateVersionRange('=1.0.0', new SemVer('2.0.0')),
    '=2.0.0'
  );
});

Deno.test('[moduleVersionReplacer] 1.0.x -> 1.2.3', () => {
  assertEquals(
    updateVersionRange('1.0.x', new SemVer('1.2.3')),
    '1.2.x'
  );
});

Deno.test('[moduleVersionReplacer] 1.x.x -> 2.0.0', () => {
  assertEquals(
    updateVersionRange('1.x.x', new SemVer('2.0.0')),
    '2.x.x'
  );
});

Deno.test('[moduleVersionReplacer] 1.x -> 2.0.0', () => {
  assertEquals(
    updateVersionRange('1.x', new SemVer('2.0.0')),
    '2.x'
  );
});

Deno.test('[moduleVersionReplacer] 1.0.X -> 1,2,3', () => {
  assertEquals(
    updateVersionRange('1.0.X', new SemVer('1.2.3')),
    '1.2.X'
  );
});

Deno.test('[moduleVersionReplacer] 1.0.* -> 1.2.3', () => {
  assertEquals(
    updateVersionRange('1.0.*', new SemVer('1.2.3')),
    '1.2.*'
  );
});

Deno.test('[moduleVersionReplacer] ^1.0.0 -> 2.3.4', () => {
  assertEquals(
    updateVersionRange('^1.0.0', new SemVer('2.3.4')),
    '^2.3.4'
  );
});

Deno.test('[moduleVersionReplacer] ~0.1.0 -> 0.2.3', () => {
  assertEquals(
    updateVersionRange('^0.1.0', new SemVer('0.2.3')),
    '^0.2.3'
  );
});

Deno.test('[moduleVersionReplacer] ^1.2.x -> 2.3.4', () => {
  assertEquals(
    updateVersionRange('^1.2.x', new SemVer('2.3.4')),
    '^2.3.x'
  );
});

Deno.test('[moduleVersionReplacer] ^1.x -> 2.3.4', () => {
  assertEquals(
    updateVersionRange('^1.x', new SemVer('2.3.4')),
    '^2.x'
  );
});

Deno.test('[moduleVersionReplacer] ^1.x.x -> 2.3.4', () => {
  assertEquals(
    updateVersionRange('^1.x.x', new SemVer('2.3.4')),
    '^2.x.x'
  );
});

Deno.test('[moduleVersionReplacer] ~1.2.3 -> 1.3.0', () => {
  assertEquals(
    updateVersionRange('~1.2.3', new SemVer('1.3.0')),
    '~1.3.0'
  );
});

Deno.test('[moduleVersionReplacer] ~1.2 -> 1.3.0', () => {
  assertEquals(
    updateVersionRange('~1.2', new SemVer('1.3.0')),
    '~1.3'
  );
});

Deno.test('[moduleVersionReplacer] ~1 -> 2.0.0', () => {
  assertEquals(
    updateVersionRange('~1', new SemVer('2.0.0')),
    '~2'
  );
});

Deno.test('[moduleVersionReplacer] ~0.1.2 -> 0.2.0', () => {
  assertEquals(
    updateVersionRange('~0.1.2', new SemVer('0.2.0')),
    '~0.2.0'
  );
});

Deno.test('[moduleVersionReplacer] ~0.1 -> 0.2.0', () => {
  assertEquals(
    updateVersionRange('~0.1', new SemVer('0.2.0')),
    '~0.2'
  );
});

Deno.test('[moduleVersionReplacer] ~0 -> 1.0.0', () => {
  assertEquals(
    updateVersionRange('~0', new SemVer('1.0.0')),
    '~1'
  );
});

Deno.test('[moduleVersionReplacer] deno.land 1', () => {
  const url = 'https://deno.land/std@0.183.0/mod.ts';

  assert(
    denoLandUrlReplacer.test.test(url),
    'module name test must succeed'
  );
  assertEquals(
    denoLandUrlReplacer.replace(url, '0.184.0'),
    'https://deno.land/std@0.184.0/mod.ts'
  );
});

Deno.test('[moduleVersionReplacer] deno.land 2', () => {
  const url = 'https://deno.land/x/esbuild@v0.17.17/mod.js';

  assert(
    denoLandUrlReplacer.test.test(url),
    'module name test must succeed'
  );
  assertEquals(
    denoLandUrlReplacer.replace(url, 'v0.17.18'),
    'https://deno.land/x/esbuild@v0.17.18/mod.js'
  );
});

Deno.test('[moduleVersionReplacer] raw.githubusercontent.com', () => {
  const url = 'https://raw.githubusercontent.com/Tsukina-7mochi/esbuild-plugin-result-deno/v1.0.7/mod.ts';

  assert(
    rawGitHubUrlReplacer.test.test(url),
    'module name test must succeed'
  );
  assertEquals(
    rawGitHubUrlReplacer.replace(url, 'v1.0.8'),
    'https://raw.githubusercontent.com/Tsukina-7mochi/esbuild-plugin-result-deno/v1.0.8/mod.ts'
  );
});

Deno.test('[moduleVersionReplacer] npm:module', () => {
  const url = 'npm:lodash@4.17.21';

  assert(
    denoNpmModuleReplacer.test.test(url),
    'module name test must succeed'
  );
  assertEquals(
    denoNpmModuleReplacer.replace(url, '4.17.22'),
    'npm:lodash@4.17.22'
  );
});

Deno.test('[moduleVersionReplacer] esm.sh', () => {
  const url = 'https://esm.sh/preact@10.13.2';

  assert(
    esmShModuleReplacer.test.test(url),
    'module name test must succeed'
  );
  assertEquals(
    esmShModuleReplacer.replace(url, '10.13.3'),
    'https://esm.sh/preact@10.13.3'
  );
});

Deno.test('[moduleVersionReplacer] esm.sh', () => {
  const url = 'https://esm.sh/preact-render-to-string@6.0.2?external=preact';

  assert(
    esmShModuleReplacer.test.test(url),
    'module name test must succeed'
  );
  assertEquals(
    esmShModuleReplacer.replace(url, '6.0.3'),
    'https://esm.sh/preact-render-to-string@6.0.3?external=preact'
  );
});
