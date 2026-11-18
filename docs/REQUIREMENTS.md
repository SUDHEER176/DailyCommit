# Still needed (only you can do these)

- [ ] **`GEMINI_API_KEY`** in `backend/.env`: free, no card, from https://aistudio.google.com/apikey (turns on AI code review).
- [ ] **Yearly Pro price**: the server still charges ₹1 (`backend/data/billing.js`, `pro_yearly`); tell me the real price. It also shows as "Add a year for ₹1" on the pricing page, and the server prints a warning about it at startup.
- [ ] **Before deploying to Render**: set `RESEND_API_KEY` to your `re_…` key (Render blocks SMTP), `APP_MODE=production`, and `CORS_ORIGINS=https://<your site>` (without it any website can call the API).
- [ ] **Razorpay dashboard → Webhooks**: also tick the `refund.processed` event (so a full refund removes Pro), and use a longer webhook secret than the current 10 characters (change it in the dashboard and in `backend/.env` together).
- [ ] **Terms, refund policy and contact pages** (Razorpay asks for these before live mode). These are business and legal decisions, so I haven't written them.

Everything else (Neon, Razorpay keys, Resend SMTP, Google sign-in, Judge0) is set and tested.
