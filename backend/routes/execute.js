import express from 'express';

// Compiles and runs C++ and Java for the code editor through Judge0.
// The browser builds the full program (see frontend/src/services/execution); this route only
// forwards it, so the Judge0 key never reaches the browser.
//
// Env:
//   JUDGE0_API_KEY   RapidAPI key for Judge0 CE (https://rapidapi.com/judge0-official/api/judge0-ce)
//   JUDGE0_URL       optional, defaults to https://judge0-ce.p.rapidapi.com. Point it at a
//                    self-hosted Judge0 to skip RapidAPI (then no key is needed)
//   JUDGE0_API_HOST  optional RapidAPI host header, defaults to judge0-ce.p.rapidapi.com

const router = express.Router();

const LANGUAGE_IDS = { cpp: 54, java: 62 }; // Judge0 CE: C++ (GCC 9.2.0), Java (OpenJDK 13)
const MAX_SOURCE_BYTES = 100 * 1024;

const DEFAULT_URL = 'https://judge0-ce.p.rapidapi.com';
const judgeUrl = () => (process.env.JUDGE0_URL || DEFAULT_URL).replace(/\/$/, '');
const usesRapidApi = () => judgeUrl().includes('rapidapi.com');

// ── A small per-IP rate limit, so one visitor can't spend the whole Judge0 quota ──
const WINDOW_MS = 60 * 1000;
const MAX_PER_WINDOW = 12;
const hits = new Map(); // ip → [timestamps]

function rateLimited(ip) {
  const now = Date.now();
  const recent = (hits.get(ip) || []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 5000) hits.clear(); // keep memory bounded
  return recent.length > MAX_PER_WINDOW;
}

const b64 = (s) => Buffer.from(s || '', 'utf8').toString('base64');
const unb64 = (s) => (s ? Buffer.from(s, 'base64').toString('utf8') : '');

export function executeStatus() {
  return { configured: !usesRapidApi() || Boolean(process.env.JUDGE0_API_KEY), url: judgeUrl() };
}

router.post('/', async (req, res) => {
  const { language, source } = req.body || {};

  if (!LANGUAGE_IDS[language]) {
    return res.status(400).json({ success: false, error: 'Only C++ and Java run on the server. JavaScript and Python run in your browser' });
  }
  if (typeof source !== 'string' || !source.trim()) {
    return res.status(400).json({ success: false, error: 'No code to run' });
  }
  if (Buffer.byteLength(source, 'utf8') > MAX_SOURCE_BYTES) {
    return res.status(413).json({ success: false, error: 'The program is too large to run' });
  }
  if (!executeStatus().configured) {
    return res.status(503).json({ success: false, error: 'C++ and Java aren’t set up on this server yet. Use JavaScript or Python for now' });
  }
  if (rateLimited(req.ip)) {
    return res.status(429).json({ success: false, error: 'Too many runs in a minute. Wait a moment and try again' });
  }

  const headers = { 'Content-Type': 'application/json' };
  if (usesRapidApi()) {
    headers['X-RapidAPI-Key'] = process.env.JUDGE0_API_KEY;
    headers['X-RapidAPI-Host'] = process.env.JUDGE0_API_HOST || 'judge0-ce.p.rapidapi.com';
  }

  try {
    const response = await fetch(`${judgeUrl()}/submissions?base64_encoded=true&wait=true&fields=stdout,stderr,compile_output,status,time,memory`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        language_id: LANGUAGE_IDS[language],
        source_code: b64(source),
        cpu_time_limit: 5,
        wall_time_limit: 10,
        memory_limit: 256000,
      }),
      signal: AbortSignal.timeout(40000),
    });

    const json = await response.json().catch(() => ({}));
    if (!response.ok) {
      const quota = response.status === 429 ? 'The daily code-run quota is used up. Try again later' : null;
      console.warn('[execute] Judge0 returned', response.status, json?.message || json?.error || '');
      return res.status(502).json({ success: false, error: quota || `The code runner returned ${response.status}` });
    }

    return res.json({
      success: true,
      data: {
        stdout: unb64(json.stdout),
        stderr: unb64(json.stderr),
        compileOutput: unb64(json.compile_output),
        status: json.status || {},
        time: json.time,
        memory: json.memory,
      },
    });
  } catch (err) {
    console.warn('[execute] Judge0 request failed:', err.message);
    return res.status(502).json({ success: false, error: 'Couldn’t reach the code runner. Try again in a moment' });
  }
});

export default router;
