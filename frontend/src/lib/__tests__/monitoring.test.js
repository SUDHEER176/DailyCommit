import { describe, it, expect } from 'vitest';
import { scrubEvent, monitoringOn } from '../monitoring';

describe('error reports', () => {
  it('carry no personal details, secrets or code', () => {
    const event = scrubEvent({
      request: { url: 'https://app.test/practice?token=abc', data: '{"password":"x"}', cookies: { s: '1' }, headers: { Authorization: 'Bearer t', Accept: '*/*' } },
      user: { id: 'u1', email: 'a@b.c', ip_address: '1.2.3.4' },
      breadcrumbs: [
        { category: 'fetch', data: { url: 'https://api.test/api/planner/revision?today=2026-11-26&tz=-330' } },
        { category: 'console', message: 'x'.repeat(1000) },
      ],
    });
    expect(event.request).toEqual({ url: 'https://app.test/practice', headers: { Accept: '*/*' } });
    expect(event.user).toEqual({ id: 'u1' });
    expect(event.breadcrumbs[0].data.url).toBe('https://api.test/api/planner/revision');
    expect(event.breadcrumbs[1].message).toHaveLength(200);
  });

  it('are off without VITE_SENTRY_DSN', () => {
    expect(monitoringOn).toBe(Boolean(import.meta.env.VITE_SENTRY_DSN));
  });
});
