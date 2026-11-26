import { FastifyPluginAsync } from 'fastify';

function renderLegalPage(title: string, bodyHtml: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title} - MobiMatch</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 760px; margin: 40px auto; padding: 0 20px; line-height: 1.65; color: #0F172A; background: #F8FAFC; }
    .card { background: #FFFFFF; padding: 28px; border-radius: 12px; border: 1px solid #E2E8F0; }
    h1 { color: #0284C7; margin-top: 0; }
    h2 { color: #1E293B; margin-top: 24px; font-size: 18px; }
    footer { margin-top: 28px; font-size: 13px; color: #64748B; text-align: center; }
  </style>
</head>
<body>
  <div class="card">
    <h1>${title}</h1>
    ${bodyHtml}
  </div>
  <footer>MobiMatch by Jhankar Mobile • Crafted by LaughingDev</footer>
</body>
</html>`;
}

export const legalRoutes: FastifyPluginAsync = async (server) => {
  server.get('/legal/terms', async (_req, reply) => {
    const html = renderLegalPage(
      'Terms & Conditions',
      `<p>Effective Date: November 2026</p>
      <p>By using <strong>MobiMatch</strong> (provided by Jhankar Mobile), you agree to use spare-part compatibility information responsibly as a reference aid for mobile device repair.</p>
      <h2>1. Technician Accounts</h2>
      <p>You are responsible for maintaining the security of your Google account used to access MobiMatch and for providing accurate workshop details.</p>
      <h2>2. Compatibility Data</h2>
      <p>While we verify compatibility entries regularly, technicians should always physically inspect connectors and flex cables prior to installation.</p>
      <h2>3. Prohibited Conduct</h2>
      <p>Automated scraping, credential sharing, or submitting false reports is prohibited and may result in account deactivation.</p>`
    );
    return reply.type('text/html; charset=utf-8').send(html);
  });

  server.get('/legal/privacy', async (_req, reply) => {
    const html = renderLegalPage(
      'Privacy Policy',
      `<p>Effective Date: November 2026</p>
      <p><strong>MobiMatch</strong> respects your privacy. This policy describes how we collect and use information when you use our mobile apps.</p>
      <h2>1. Information We Collect</h2>
      <ul>
        <li><strong>Google Account Identity:</strong> Email address, display name, and Google user ID for authentication.</li>
        <li><strong>Technician Profile:</strong> Phone number, shop name, and city provided during onboarding.</li>
        <li><strong>Usage & Reports:</strong> Issue reports and missing model requests you voluntarily submit.</li>
      </ul>
      <h2>2. Advertising</h2>
      <p>The MobiMatch Technician App may display Google AdMob banners or Jhankar Mobile promotional banners.</p>
      <h2>3. Account Deletion</h2>
      <p>You may permanently delete your account and revoke all active sessions directly in the app under <em>Profile → Delete Account</em>, or by visiting <a href="/legal/account-deletion">/legal/account-deletion</a>.</p>`
    );
    return reply.type('text/html; charset=utf-8').send(html);
  });

  server.get('/legal/account-deletion', async (_req, reply) => {
    const html = renderLegalPage(
      'Account Deletion',
      `<p>You can permanently delete your <strong>MobiMatch</strong> account and associated personal data at any time:</p>
      <h2>Option 1: In-App Deletion (Instant)</h2>
      <ol>
        <li>Open the <strong>MobiMatch</strong> app on your Android device.</li>
        <li>Tap the <strong>Profile</strong> tab in the bottom navigation bar.</li>
        <li>Scroll to <em>Account & Session</em> and tap <strong>Delete Account Permanently</strong>.</li>
      </ol>
      <h2>Option 2: Email Request</h2>
      <p>If you cannot access your device, email <strong>contact.mobimatch@gmail.com</strong> from your registered Google email address with the subject <em>"Delete MobiMatch Account"</em>.</p>`
    );
    return reply.type('text/html; charset=utf-8').send(html);
  });
};
