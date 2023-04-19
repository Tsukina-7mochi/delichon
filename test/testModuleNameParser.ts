import {
  denoLandUrlParser, denoNpmModuleParser, esmShModuleParser, rawGitHubUrlParser
} from '../src/moduleNameParser.ts';
import { assert, assertEquals } from 'testing/asserts.ts';
import moduleTypes from '../src/moduleTypes.ts';

Deno.test('[moduleNameParser] deno.land std lib', () => {
  const url = 'https://deno.land/std@0.184.0/mod.ts';

  const testResult = denoLandUrlParser.test.test(url);
  const parseResult = denoLandUrlParser.parse(url);

  assert(testResult, 'url test must succeed');
  assertEquals(parseResult, {
    type: moduleTypes.denoLand,
    name: 'std',
    version: '0.184.0',
  });
});

Deno.test('[moduleNameParser] deno.land std lib without version', () => {
  const url = 'https://deno.land/std/mod.ts';

  const testResult = denoLandUrlParser.test.test(url);
  const parseResult = denoLandUrlParser.parse(url);

  assert(testResult, 'url test must succeed');
  assertEquals(parseResult, {
    type: moduleTypes.denoLand,
    name: 'std',
    version: '',
  });
});


Deno.test('[moduleNameParser] deno.land third party module', () => {
  const url = 'https://deno.land/x/esbuild@v0.17.17/mod.js';

  const testResult = denoLandUrlParser.test.test(url);
  const parseResult = denoLandUrlParser.parse(url);

  assert(testResult, 'url test must succeed');
  assertEquals(parseResult, {
    type: moduleTypes.denoLand,
    name: 'esbuild',
    version: 'v0.17.17',
  });
});

Deno.test('[moduleNameParser] raw.githubusercontent.com', () => {
  const url = 'https://raw.githubusercontent.com/Tsukina-7mochi/esbuild-plugin-result-deno/v1.0.7/mod.ts';

  const testResult = rawGitHubUrlParser.test.test(url);
  const parseResult = rawGitHubUrlParser.parse(url);

  assert(testResult, 'url test must succeed');
  assertEquals(parseResult, {
    type: moduleTypes.rawGitHub,
    name: 'Tsukina-7mochi/esbuild-plugin-result-deno',
    version: 'v1.0.7',
  });
});

Deno.test('[moduleNameParser] npm:module', () => {
  const moduleName = 'npm:lodash@4.17.21';

  const testResult = denoNpmModuleParser.test.test(moduleName);
  const parseResult = denoNpmModuleParser.parse(moduleName);

  assert(testResult, 'module name test must succeed');
  assertEquals(parseResult, {
    type: moduleTypes.npmPackage,
    name: 'lodash',
    version: '4.17.21',
  });
});

Deno.test('[moduleNameParser] npm:module without version', () => {
  const moduleName = 'npm:lodash';

  const testResult = denoNpmModuleParser.test.test(moduleName);
  const parseResult = denoNpmModuleParser.parse(moduleName);

  assert(testResult, 'module name test must succeed');
  assertEquals(parseResult, {
    type: moduleTypes.npmPackage,
    name: 'lodash',
    version: '',
  });
});

Deno.test('[moduleNameParser] npm:module with @-leading name', () => {
  const moduleName = 'npm:@author/name@version';

  const testResult = denoNpmModuleParser.test.test(moduleName);
  const parseResult = denoNpmModuleParser.parse(moduleName);

  assert(testResult, 'module name test must succeed');
  assertEquals(parseResult, {
    type: moduleTypes.npmPackage,
    name: '@author/name',
    version: 'version',
  });
});

Deno.test('[moduleNameParser] npm:module with @-leading name without version', () => {
  const moduleName = 'npm:@author/name';

  const testResult = denoNpmModuleParser.test.test(moduleName);
  const parseResult = denoNpmModuleParser.parse(moduleName);

  assert(testResult, 'module name test must succeed');
  assertEquals(parseResult, {
    type: moduleTypes.npmPackage,
    name: '@author/name',
    version: '',
  });
});

Deno.test('[moduleNameParser] esm.sh', () => {
  const url = 'https://esm.sh/preact@10.13.2';

  const testResult = esmShModuleParser.test.test(url);
  const parseResult = esmShModuleParser.parse(url);

  assert(testResult, 'url test must succeed');
  assertEquals(parseResult, {
    type: moduleTypes.esmSh,
    name: 'preact',
    version: '10.13.2',
  });
});

Deno.test('[moduleNameParser] esm.sh without version', () => {
  const url = 'https://esm.sh/preact';

  const testResult = esmShModuleParser.test.test(url);
  const parseResult = esmShModuleParser.parse(url);

  assert(testResult, 'url test must succeed');
  assertEquals(parseResult, {
    type: moduleTypes.esmSh,
    name: 'preact',
    version: '',
  });
});
