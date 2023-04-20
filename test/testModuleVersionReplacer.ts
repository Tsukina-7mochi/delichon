import { assertEquals } from 'https://deno.land/std@0.183.0/testing/asserts.ts';
import { SemVer } from 'semver';
import { updateVersionRange } from '../src/moduleVersionReplacer.ts';

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
