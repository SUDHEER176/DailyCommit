// Run and Submit for the code editor.
//   JavaScript → Web Worker in the browser
//   Python     → Pyodide (WebAssembly) in a Web Worker
//   C++, Java  → a generated program sent to Judge0 through our backend (/api/execute)
// Every path returns the same result: { success, verdict, runtimeMs, results: [...] }.

import { api } from '../api';
import { buildSpec, assembleResult, parseMarkedOutput, UnsupportedProblemError } from './harness';
import { runJavaScript, runPython, warmUpPython, TimeLimitError } from './browserRunners';
import { buildCppProgram } from './cppDriver';
import { USER_CODE_MARKER } from './harness';
import { buildJavaProgram } from './javaDriver';
import { languageHint, isParseError } from './languageCheck';

export { warmUpPython };

async function runCompiled(language, code, spec, testCases, problem) {
  const source = language === 'cpp' ? buildCppProgram(code, spec) : buildJavaProgram(code, spec);
  const res = await api.executeCode({ language, source });

  if (!res.success) {
    return assembleResult({ problem, testCases, runError: res.error, verdictHint: 'Execution Error' });
  }
  const { stdout = '', stderr = '', compileOutput = '', status = {} } = res.data;

  // Judge0 status ids: 3 accepted, 5 time limit, 6 compile error, 7–12 runtime errors
  if (status.id === 6) {
    // Line numbers in compiler messages count from the top of the generated program; shift them to the person's code
    const offset = source.slice(0, source.indexOf(USER_CODE_MARKER)).split('\n').length; // marker line itself counts
    const message = (compileOutput.trim() || 'Compile error')
      .replace(/(?:[\w./\\-]*?)(?:main\.cpp|Main\.java):(\d+)(?::(\d+))?:?/g, (_, line, col) => {
        const n = Number(line) - offset;
        return n > 0 ? `Line ${n}${col ? `, col ${col}` : ''}:` : 'In the test runner:';
      });
    return assembleResult({ problem, testCases, runError: message, verdictHint: 'Compile Error' });
  }
  const { cases, lastStarted } = parseMarkedOutput(stdout, testCases.length);
  let runError = null, verdictHint = null;
  if (status.id === 5) {
    runError = 'Time limit exceeded'; verdictHint = 'Time Limit Exceeded';
  } else if (status.id >= 7) {
    // The program crashed (e.g. a segfault) partway; the case it was on gets the message
    runError = (stderr.trim() || status.description || 'Runtime error');
    verdictHint = 'Runtime Error';
    if (lastStarted >= 0 && !cases[lastStarted].output && !cases[lastStarted].error) cases[lastStarted].error = runError;
  }
  return assembleResult({ problem, testCases, caseOutputs: cases, runError, verdictHint, spec });
}

/**
 * @param {object} args
 * @param {object} args.problem      the problem as the editor holds it (meta, starterTemplates, contentHtml)
 * @param {string} args.language     'javascript' | 'python' | 'cpp' | 'java'
 * @param {string} args.code         the person's code
 * @param {Array}  args.testCases    [{ input, args?, expected }]
 * @param {Function} [args.onStatus] called with a short status line while Python loads
 */
export async function runSolution(args) {
  const result = await runAll(args);
  return withLanguageHint(result, args.language, args.code);
}

/**
 * When the code failed to parse or compile and clearly is another language (a draft from the
 * wrong editor), say so under the error. Code that ran is never touched.
 */
function withLanguageHint(result, language, code) {
  const failedToParse = result.verdict === 'Compile Error'
    || result.results.some((r) => r.error && isParseError(r.error));
  const hint = failedToParse && languageHint(language, code);
  if (!hint) return result;
  return {
    ...result,
    results: result.results.map((r) => (r.error ? { ...r, error: `${r.error}\n\n${hint}` } : r)),
  };
}

async function runAll({ problem, language, code, testCases, onStatus }) {
  if (!testCases?.length) {
    return { success: false, verdict: 'No test cases', runtimeMs: 0, results: [] };
  }

  let spec;
  try {
    spec = buildSpec({
      problem,
      language,
      signatureSource: problem?.starterTemplates?.[language] || code,
      testCases,
    });
  } catch (err) {
    const message = err instanceof UnsupportedProblemError ? err.message : `Could not prepare the tests: ${err.message}`;
    return assembleResult({ problem, testCases, runError: message, verdictHint: 'Not supported' });
  }

  try {
    if (language === 'javascript') {
      const cases = await runJavaScript(code, spec);
      return assembleResult({ problem, testCases, caseOutputs: cases, spec });
    }
    if (language === 'python') {
      const cases = await runPython(code, spec, { onStatus });
      return assembleResult({ problem, testCases, caseOutputs: cases, spec });
    }
    if (language === 'cpp' || language === 'java') {
      return await runCompiled(language, code, spec, testCases, problem);
    }
    return assembleResult({ problem, testCases, runError: `${language} isn't supported`, verdictHint: 'Not supported' });
  } catch (err) {
    if (err instanceof TimeLimitError) {
      return assembleResult({ problem, testCases, runError: err.message, verdictHint: 'Time Limit Exceeded' });
    }
    if (err instanceof UnsupportedProblemError) {
      return assembleResult({ problem, testCases, runError: err.message, verdictHint: 'Not supported' });
    }
    return assembleResult({ problem, testCases, runError: err.message || 'Execution failed', verdictHint: 'Execution Error' });
  }
}
