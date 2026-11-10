import assert from 'node:assert/strict';

export function testVersion(base, run, attempt = '1') {
  assert(/^\d+\.\d+\.\d+$/.test(base), 'Source version must be MAJOR.MINOR.PATCH');
  assert(/^[1-9]\d*$/.test(String(run)) && /^[1-9]\d*$/.test(String(attempt)), 'Use positive run and attempt numbers');
  const [major, minor, patch] = base.split('.').map(Number);
  return `${major}.${minor}.${patch + 1}-test.${run}.${attempt}`;
}

export function checkReleaseVersion(version) {
  assert.match(version, /^(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)(?:-test\.[1-9]\d*(?:\.[1-9]\d*)*)?$/, 'Use MAJOR.MINOR.PATCH or MAJOR.MINOR.PATCH-test.N[.N]');
}

export function releaseTemplateEnvironment(version) {
  checkReleaseVersion(version);
  return version.includes('-test.') ? 'dev' : 'prod';
}

export function compareReleaseVersions(left, right) {
  checkReleaseVersion(left); checkReleaseVersion(right);
  const parts = value => {
    const [core, test] = value.split('-test.');
    return [...core.split('.').map(BigInt), test === undefined ? 1n : 0n, ...(test?.split('.').map(BigInt) || [])];
  };
  const a = parts(left), b = parts(right);
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    if (a[i] === undefined) return -1;
    if (b[i] === undefined) return 1;
    if (a[i] !== b[i]) return a[i] > b[i] ? 1 : -1;
  }
  return 0;
}
