/**
 * Code Execution Service
 * Supports Piston API for multi-language execution (JavaScript, Python, C++, Java)
 * with graceful in-browser fallback for JavaScript.
 */

const PISTON_ENDPOINT = "https://emkc.org/api/v2/piston/execute";

const LANGUAGE_CONFIG = {
  javascript: {
    language: "javascript",
    version: "18.15.0",
    extension: "js"
  },
  python: {
    language: "python",
    version: "3.10.0",
    extension: "py"
  },
  cpp: {
    language: "cpp",
    version: "10.2.0",
    extension: "cpp"
  },
  java: {
    language: "java",
    version: "15.0.2",
    extension: "java"
  }
};

function getAutoFnCall(language, userCode, testCase) {
  if (language === "javascript") {
    if (testCase.fnCallJs) return testCase.fnCallJs;
    const fnMatch = userCode.match(/(?:var|const|let)\s+([a-zA-Z0-9_$]+)\s*=\s*function/) ||
                    userCode.match(/function\s+([a-zA-Z0-9_$]+)\s*\(/);
    if (fnMatch) {
      let args = (testCase.input || "").trim();
      args = args.replace(/(?:^|\n|,)\s*[a-zA-Z0-9_$]+\s*=\s*/g, (m) => m.startsWith(',') ? ', ' : '').trim();
      return `${fnMatch[1]}(${args})`;
    }
  }
  if (language === "python") {
    if (testCase.fnCallPy) return testCase.fnCallPy;
    const pyMatch = userCode.match(/def\s+([a-zA-Z0-9_$]+)\s*\(self/);
    if (pyMatch) {
      let args = (testCase.input || "").trim();
      args = args.replace(/(?:^|\n|,)\s*[a-zA-Z0-9_$]+\s*=\s*/g, (m) => m.startsWith(',') ? ', ' : '').trim();
      args = args.replace(/\btrue\b/g, 'True').replace(/\bfalse\b/g, 'False').replace(/\bnull\b/g, 'None');
      return `Solution().${pyMatch[1]}(${args})`;
    }
  }
  return "";
}

/**
 * Builds test driver code that executes the user code against a specific test case
 */
function buildDriverCode(language, userCode, testCase) {
  if (language === "javascript") {
    const fnCall = getAutoFnCall("javascript", userCode, testCase);
    return `
${userCode}

try {
  const result = ${fnCall || "null"};
  console.log("___TEST_OUTPUT___" + JSON.stringify(result));
} catch (err) {
  console.error("___TEST_ERROR___" + (err.message || err));
}
`;
  }

  if (language === "python") {
    const fnCall = getAutoFnCall("python", userCode, testCase);
    return `
import json
${userCode}

try:
    result = ${fnCall || "None"}
    # Normalize booleans or lists for comparison
    if isinstance(result, bool):
        print("___TEST_OUTPUT___" + ("true" if result else "false"))
    else:
        print("___TEST_OUTPUT___" + json.dumps(result))
except Exception as e:
    print("___TEST_ERROR___" + str(e))
`;
  }

  // Fallback for C++ / Java (basic execution)
  return userCode;
}

/**
 * Executes code via Piston API
 */
async function executeOnPiston(language, sourceCode) {
  const config = LANGUAGE_CONFIG[language] || { language, version: "*", extension: "txt" };

  const response = await fetch(PISTON_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      language: config.language,
      version: config.version,
      files: [
        {
          name: `solution.${config.extension}`,
          content: sourceCode
        }
      ]
    })
  });

  if (!response.ok) {
    throw new Error(`Piston API returned status ${response.status}`);
  }

  const data = await response.json();
  return {
    stdout: data.run?.stdout || "",
    stderr: data.run?.stderr || "",
    output: data.run?.output || "",
    code: data.run?.code ?? 0
  };
}

/**
 * In-browser fallback execution for JavaScript
 */
function executeLocalJS(userCode, testCase) {
  try {
    const fnCall = getAutoFnCall("javascript", userCode, testCase);
    if (!fnCall) {
      return { output: "No test runner configured for this case", passed: false };
    }
    // Execute inside isolated function scope
    const runner = new Function(`
      ${userCode}
      return ${fnCall};
    `);
    const startTime = performance.now();
    const result = runner();
    const duration = Math.round(performance.now() - startTime);

    const actualStr = JSON.stringify(result);
    const expectedClean = testCase.expected.trim();
    
    // Check match (handling array order if applicable)
    let passed = actualStr === expectedClean;
    if (!passed) {
      try {
        const parsedActual = JSON.parse(actualStr);
        const parsedExpected = JSON.parse(expectedClean);
        if (Array.isArray(parsedActual) && Array.isArray(parsedExpected)) {
          passed = JSON.stringify([...parsedActual].sort()) === JSON.stringify([...parsedExpected].sort());
        }
      } catch (e) {
        // keep false
      }
    }

    return {
      passed,
      actual: actualStr,
      expected: expectedClean,
      runtimeMs: duration,
      logs: ""
    };
  } catch (err) {
    return {
      passed: false,
      error: err.message || "Runtime Error",
      expected: testCase.expected,
      logs: err.stack || ""
    };
  }
}

/**
 * Main evaluation function for running test cases
 * @param {string} language - 'javascript' | 'python' | 'cpp' | 'java'
 * @param {string} userCode - Code written by user
 * @param {Array} testCases - Array of test case objects
 */
export async function runCodeAgainstCases(language, userCode, testCases) {
  const results = [];
  const startTime = performance.now();

  for (let i = 0; i < testCases.length; i++) {
    const testCase = testCases[i];
    
    // Try local execution for JS if preferred or fast
    if (language === "javascript" && testCase.fnCallJs) {
      const localRes = executeLocalJS(userCode, testCase);
      results.push({
        testCaseIndex: i + 1,
        input: testCase.input,
        expected: testCase.expected,
        actual: localRes.actual ?? "undefined",
        passed: localRes.passed,
        error: localRes.error || null,
        logs: localRes.logs || ""
      });
      continue;
    }

    // Try remote execution via Piston
    try {
      const driverCode = buildDriverCode(language, userCode, testCase);
      const execution = await executeOnPiston(language, driverCode);
      const output = execution.stdout || execution.output || "";
      const stderr = execution.stderr || "";

      let actual = "";
      let error = stderr || null;
      let logs = [];

      const lines = output.split("\n");
      for (const line of lines) {
        if (line.startsWith("___TEST_OUTPUT___")) {
          actual = line.replace("___TEST_OUTPUT___", "").trim();
        } else if (line.startsWith("___TEST_ERROR___")) {
          error = line.replace("___TEST_ERROR___", "").trim();
        } else if (line.trim()) {
          logs.push(line);
        }
      }

      const expectedClean = testCase.expected.trim();
      let passed = actual === expectedClean;
      if (!passed && actual) {
        try {
          const parsedActual = JSON.parse(actual);
          const parsedExpected = JSON.parse(expectedClean);
          if (Array.isArray(parsedActual) && Array.isArray(parsedExpected)) {
            passed = JSON.stringify([...parsedActual].sort()) === JSON.stringify([...parsedExpected].sort());
          }
        } catch {
          // ignore
        }
      }

      results.push({
        testCaseIndex: i + 1,
        input: testCase.input,
        expected: expectedClean,
        actual: actual || (error ? "Error" : "undefined"),
        passed,
        error,
        logs: logs.join("\n")
      });
    } catch (err) {
      // Fallback in case of network issue
      results.push({
        testCaseIndex: i + 1,
        input: testCase.input,
        expected: testCase.expected,
        actual: "Execution failed",
        passed: false,
        error: err.message || "Failed to reach execution sandbox."
      });
    }
  }

  const totalRuntimeMs = Math.round(performance.now() - startTime);
  const allPassed = results.every(r => r.passed);

  return {
    success: allPassed,
    verdict: allPassed ? "Accepted" : results.some(r => r.error) ? "Runtime Error" : "Wrong Answer",
    runtimeMs: totalRuntimeMs,
    results
  };
}
