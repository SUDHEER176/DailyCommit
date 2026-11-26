// Runs solutions the way the editor does, but in Node, so the tests exercise the real runner code:
//   JavaScript  the real js.worker.js source, called with a fake `self`
//   Python      the real Python driver from py.worker.js, run by a local CPython (Pyodide runs the same code)
//   C++, Java   the real generated programs, compiled and run by a local g++ / java
// Languages whose tool isn't installed are reported by `available` so their tests can skip.

import { readFileSync, writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { buildSpec, assembleResult, parseMarkedOutput } from '../harness';
import { buildCppProgram } from '../cppDriver';
import { buildJavaProgram } from '../javaDriver';

const here = (file) => new URL(`../${file}`, import.meta.url);

const works = (cmd, args) => {
  try { return spawnSync(cmd, args, { encoding: 'utf8', timeout: 20000 }).status === 0; } catch { return false; }
};
const pythonCmd = ['python3', 'python'].find((c) => works(c, ['-c', 'import sys; assert sys.version_info >= (3, 8)']));

export const available = {
  javascript: true,
  python: Boolean(pythonCmd),
  cpp: works('g++', ['--version']),
  java: works('java', ['-version']) && works('javac', ['-version']),
};

function runJavaScript(code, spec) {
  const source = readFileSync(here('js.worker.js'), 'utf8');
  let message = null;
  const self = { postMessage: (data) => { message = data; } };
  new Function('self', source)(self);
  self.onmessage({ data: JSON.parse(JSON.stringify({ code, spec })) }); // structured clone, as postMessage does
  return message.cases;
}

/** The PRELUDE template string from py.worker.js, evaluated so its escapes match what Pyodide gets */
function pythonPrelude() {
  const source = readFileSync(here('py.worker.js'), 'utf8');
  const body = source.match(/const PRELUDE = `([\s\S]*?)`;/)[1];
  return new Function(`return \`${body}\`;`)();
}

function inTempDir(fn) {
  const dir = mkdtempSync(join(tmpdir(), 'dc-runner-'));
  try { return fn(dir); } finally { rmSync(dir, { recursive: true, force: true }); }
}

function runPython(code, spec) {
  return inTempDir((dir) => {
    writeFileSync(join(dir, 'user.py'), code);
    writeFileSync(join(dir, 'spec.json'), JSON.stringify(spec));
    writeFileSync(join(dir, 'main.py'), `${pythonPrelude()}
import sys as __sys
with open(__sys.argv[1], encoding='utf-8') as __f: __code = __f.read()
with open(__sys.argv[2], encoding='utf-8') as __f: __spec = __f.read()
print(__run(__code, __spec))
`);
    const r = spawnSync(pythonCmd, [join(dir, 'main.py'), join(dir, 'user.py'), join(dir, 'spec.json')], { encoding: 'utf8', timeout: 30000 });
    if (r.status !== 0) throw new Error(`Python driver failed: ${r.stderr}`);
    return JSON.parse(r.stdout.trim().split('\n').pop());
  });
}

function runCompiled(language, code, spec, count) {
  return inTempDir((dir) => {
    let run;
    if (language === 'cpp') {
      writeFileSync(join(dir, 'main.cpp'), buildCppProgram(code, spec));
      const exe = join(dir, process.platform === 'win32' ? 'main.exe' : 'main');
      const c = spawnSync('g++', ['-std=gnu++14', '-O0', '-o', exe, join(dir, 'main.cpp')], { encoding: 'utf8', timeout: 120000 });
      if (c.status !== 0) return { compileError: c.stderr };
      run = spawnSync(exe, [], { encoding: 'utf8', timeout: 20000 });
    } else {
      writeFileSync(join(dir, 'Main.java'), buildJavaProgram(code, spec));
      const c = spawnSync('javac', ['-nowarn', '-d', dir, join(dir, 'Main.java')], { encoding: 'utf8', timeout: 120000 });
      if (c.status !== 0) return { compileError: c.stderr };
      run = spawnSync('java', ['-cp', dir, 'Main'], { encoding: 'utf8', timeout: 20000 });
    }
    return { cases: parseMarkedOutput(run.stdout || '', count).cases };
  });
}

/** Run like the editor's runSolution, returning { success, verdict, results } */
export function runLocally({ problem, language, code, testCases }) {
  const spec = buildSpec({ problem, language, signatureSource: problem.starterTemplates?.[language] || code, testCases });
  if (language === 'javascript') return assembleResult({ problem, testCases, caseOutputs: runJavaScript(code, spec), spec });
  if (language === 'python') return assembleResult({ problem, testCases, caseOutputs: runPython(code, spec), spec });
  const out = runCompiled(language, code, spec, testCases.length);
  if (out.compileError) return assembleResult({ problem, testCases, runError: out.compileError, verdictHint: 'Compile Error' });
  return assembleResult({ problem, testCases, caseOutputs: out.cases, spec });
}
