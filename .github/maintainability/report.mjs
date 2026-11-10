import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const configDir = fileURLToPath(new URL('.', import.meta.url));
const [basePath, baseRevision] = process.argv.slice(2);
if (!basePath || !baseRevision) {
  throw new Error('Usage: node .github/maintainability/report.mjs BASE_DIRECTORY BASE_REVISION');
}
const headDir = process.cwd();
const baseDir = resolve(basePath);
const temporary = mkdtempSync(join(tmpdir(), 'motion-maintainability-'));
const issueTypes = ['files', 'exports', 'dependencies'];

function run(tool, args, cwd) {
  return execFileSync(join(configDir, 'node_modules/.bin', tool), args, {
    cwd, encoding: 'utf8', maxBuffer: 16 * 1024 * 1024,
  });
}

function unusedFindings(directory) {
  const { issues } = JSON.parse(run('knip', [
    '--config', join(configDir, 'knip.json'), '--include', issueTypes.join(','),
    '--reporter', 'json', '--no-exit-code', '--no-progress', '--no-config-hints',
  ], directory));
  return issueTypes.flatMap(type => issues.flatMap(row => (row[type] ?? []).map(({ name, line }) => ({
    type, file: row.file, name, line,
  }))));
}

function clones(directory, label) {
  const output = join(temporary, label);
  run('jscpd', [
    '.', '--config', join(configDir, 'jscpd.json'), '--fail-on-empty', '--output', output,
  ], directory);
  const { duplicates } = JSON.parse(readFileSync(join(output, 'jscpd-report.json'), 'utf8'));
  return duplicates;
}

function cloneKey({ format, fragment, firstFile, secondFile }) {
  const files = [firstFile.name, secondFile.name].sort();
  return JSON.stringify([format, files, fragment.replaceAll('\r\n', '\n')]);
}

function addedFindings(base, head, key) {
  const remaining = new Map();
  for (const finding of base) {
    const id = key(finding);
    remaining.set(id, (remaining.get(id) ?? 0) + 1);
  }
  return head.filter(finding => {
    const id = key(finding);
    const count = remaining.get(id) ?? 0;
    if (count === 0) return true;
    remaining.set(id, count - 1);
    return false;
  });
}

function issueKey({ type, file, name }) {
  return JSON.stringify([type, file, name]);
}

function code(value) {
  const escaped = String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;').replace(/[\r\n]/g, ' ');
  return '<code>' + escaped + '</code>';
}

function location(file, line) {
  return code(line ? file + ':' + line : file);
}

function section(title, findings, format) {
  const limit = 50;
  const rows = findings.slice(0, limit).map(finding => '- ' + format(finding));
  if (findings.length > limit) rows.push('- ' + (findings.length - limit) + ' more findings omitted.');
  return ['### ' + title + ' (' + findings.length + ')', '', ...(rows.length ? rows : ['None.']), ''].join('\n');
}

try {
  const newClones = addedFindings(clones(baseDir, 'base'), clones(headDir, 'head'), cloneKey);
  const newUnused = addedFindings(unusedFindings(baseDir), unusedFindings(headDir), issueKey);
  const headRevision = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
  const report = [
    '## Maintainability report',
    '',
    'Advisory findings against base ' + code(baseRevision) + ' at ' + code(headRevision) + '. Review before acting.',
    '',
    section('New duplicate fragments', newClones, ({ firstFile, secondFile, lines }) =>
      location(firstFile.name, firstFile.start) + ' and ' + location(secondFile.name, secondFile.start)
        + ' (' + lines + ' lines)'),
    section('New unused code and dependencies', newUnused, ({ type, file, name, line }) =>
      location(file, line) + ' (' + type + ')' + (name && type !== 'files' ? ' ' + code(name) : '')),
  ];
  process.stdout.write(report.join('\n') + '\n');
} finally {
  rmSync(temporary, { recursive: true, force: true });
}
