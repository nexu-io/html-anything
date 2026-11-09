import assert from 'node:assert/strict';

export function checkReleaseVersion(version) {
  assert.match(version, /^(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)(?:-test\.[1-9]\d*(?:\.[1-9]\d*)*)?$/, 'Use MAJOR.MINOR.PATCH or MAJOR.MINOR.PATCH-test.N[.N]');
}
