// Starts the JavaScript and Python workers and enforces time limits.
// A worker stuck in an infinite loop can't be interrupted, so on timeout it is terminated
// and the next run starts a fresh one.

const JS_TIME_LIMIT_MS = 5000;
const PY_TIME_LIMIT_MS = 8000;      // per run, once Python has loaded
const PY_LOAD_LIMIT_MS = 60000;     // first load downloads about 10 MB

export class TimeLimitError extends Error {}

/** Run once in a fresh worker, terminated after the limit */
export function runJavaScript(code, spec) {
  return new Promise((resolve, reject) => {
    const worker = new Worker(new URL('./js.worker.js', import.meta.url));
    const timer = setTimeout(() => {
      worker.terminate();
      reject(new TimeLimitError(`Stopped after ${JS_TIME_LIMIT_MS / 1000} s. Look for an infinite loop or a slow approach`));
    }, JS_TIME_LIMIT_MS);
    worker.onmessage = ({ data }) => { clearTimeout(timer); worker.terminate(); resolve(data.cases); };
    worker.onerror = (e) => { clearTimeout(timer); worker.terminate(); reject(new Error(e.message || 'JavaScript worker failed')); };
    worker.postMessage({ code, spec });
  });
}

// Python keeps one warm worker, since loading Pyodide takes a few seconds
let pyWorker = null;
let pyReady = null;

function startPython() {
  pyWorker = new Worker(new URL('./py.worker.js', import.meta.url));
  pyReady = new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Python took too long to load. Check your connection and try again')), PY_LOAD_LIMIT_MS);
    pyWorker.addEventListener('message', function onReady({ data }) {
      if (data.type === 'ready') { clearTimeout(timer); pyWorker.removeEventListener('message', onReady); resolve(); }
      if (data.type === 'loadError') { clearTimeout(timer); reject(new Error(`Python could not load: ${data.error}`)); }
    });
    pyWorker.onerror = (e) => { clearTimeout(timer); reject(new Error(e.message || 'Python worker failed to start')); };
  });
  pyReady.catch(() => { pyWorker?.terminate(); pyWorker = null; });
  return pyReady;
}

/** Load Python ahead of time, e.g. when the person picks Python in the editor */
export function warmUpPython() {
  if (!pyWorker) startPython();
  return pyReady;
}

export async function runPython(code, spec, { onStatus } = {}) {
  if (!pyWorker) {
    onStatus?.('Loading Python');
    startPython();
  }
  await pyReady;
  onStatus?.(null);

  const worker = pyWorker;
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      worker.terminate();
      if (pyWorker === worker) pyWorker = null; // next run loads a fresh interpreter
      reject(new TimeLimitError(`Stopped after ${PY_TIME_LIMIT_MS / 1000} s. Look for an infinite loop or a slow approach`));
    }, PY_TIME_LIMIT_MS);
    const onMessage = ({ data }) => {
      if (data.type !== 'done' && data.type !== 'failed') return;
      clearTimeout(timer);
      worker.removeEventListener('message', onMessage);
      if (data.type === 'done') resolve(data.cases);
      else reject(new Error(data.error));
    };
    worker.addEventListener('message', onMessage);
    worker.postMessage({ code, spec });
  });
}
