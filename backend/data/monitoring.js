// Error tracking with Sentry, on only when SENTRY_DSN is set (like every other integration).
// Imported by server.js right after dotenv, so Sentry starts before Express loads.
//
// Nothing personal is sent: no IP address, cookies, auth headers or request bodies (which can hold
// passwords, code and payment details). Errors carry the route, the stack and the app mode.

import * as Sentry from '@sentry/node';
import { APP_MODE } from './app-mode.js';

const dsn = process.env.SENTRY_DSN || '';
export const monitoringOn = Boolean(dsn);

const SECRET_HEADERS = ['authorization', 'cookie', 'x-razorpay-signature'];

/** Remove anything that could identify a person or leak a secret */
export function scrubEvent(event) {
  if (event.request) {
    delete event.request.cookies;
    delete event.request.data;
    delete event.request.query_string;
    if (event.request.headers) {
      for (const key of Object.keys(event.request.headers)) {
        if (SECRET_HEADERS.includes(key.toLowerCase())) delete event.request.headers[key];
      }
    }
  }
  if (event.user) event.user = event.user.id ? { id: event.user.id } : undefined;
  return event;
}

if (monitoringOn) {
  Sentry.init({
    dsn,
    environment: process.env.SENTRY_ENVIRONMENT || APP_MODE,
    sendDefaultPii: false,
    tracesSampleRate: 0, // errors only; performance tracing would use up the free quota
    beforeSend: scrubEvent,
  });
}

/** Report errors that reach Express, then answer with JSON instead of Express's HTML error page */
export function setupErrorHandling(app) {
  if (monitoringOn) Sentry.setupExpressErrorHandler(app);
  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    if (res.headersSent) return next(err);
    const status = Number(err.status || err.statusCode) || 500;
    if (status >= 500) console.error(`[error] ${req.method} ${req.path}:`, err);
    res.status(status).json({ error: status >= 500 ? 'Something went wrong on our side. Try again' : (err.expose && err.message) || 'Bad request' });
  });
}

/** Report an error caught by hand (e.g. a failed background save) */
export function reportError(err, context = {}) {
  if (monitoringOn) Sentry.captureException(err, { extra: context });
}
