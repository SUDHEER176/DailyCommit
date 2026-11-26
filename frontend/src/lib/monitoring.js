// Error tracking with Sentry, on only when VITE_SENTRY_DSN is set at build time.
// The SDK is loaded lazily, so visitors download nothing extra while it's off, and it starts after
// the first render instead of delaying it. Uncaught errors and unhandled rejections are reported,
// including React render errors (React rethrows them to the window).
//
// Nothing personal is sent: no IP address, no cookies, no request bodies, and URLs lose their
// query strings. Code people write in the editor never leaves the browser through this.

const dsn = import.meta.env.VITE_SENTRY_DSN || '';
export const monitoringOn = Boolean(dsn);

let sentry = null;

const stripQuery = (url) => (typeof url === 'string' ? url.split('?')[0] : url);

/** Remove anything that could identify a person or leak a secret */
export function scrubEvent(event) {
  if (event.request) {
    delete event.request.cookies;
    delete event.request.data;
    delete event.request.query_string;
    event.request.url = stripQuery(event.request.url);
    if (event.request.headers) delete event.request.headers.Authorization;
  }
  if (event.user) event.user = event.user.id ? { id: event.user.id } : undefined;
  (event.breadcrumbs || []).forEach((b) => {
    if (b.data?.url) b.data.url = stripQuery(b.data.url);
    if (b.category === 'console') b.message = b.message?.slice(0, 200); // console output can hold someone's code
  });
  return event;
}

export function initMonitoring() {
  if (!monitoringOn) return;
  import('@sentry/react')
    .then((Sentry) => {
      Sentry.init({
        dsn,
        environment: import.meta.env.VITE_SENTRY_ENVIRONMENT || import.meta.env.MODE,
        sendDefaultPii: false,
        tracesSampleRate: 0, // errors only
        beforeSend: scrubEvent,
      });
      sentry = Sentry;
    })
    .catch(() => {}); // a blocked or failed download must never break the app
}

/** Report an error caught by hand, e.g. in a component's catch */
export function reportError(error, context = {}) {
  sentry?.captureException(error, { extra: context });
}
