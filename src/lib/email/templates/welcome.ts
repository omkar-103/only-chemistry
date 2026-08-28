// ============================================================
// Welcome Email Template
// Triggered once after a new student account is created in MongoDB.
// Does NOT contain passwords, tokens, or any secrets.
// ============================================================

export function welcomeEmailHtml(name: string, email: string): string {
  const year = new Date().getFullYear();
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to OnlyChemistry!</title>
</head>
<body style="margin:0;padding:0;background:#f4f5f7;font-family:Inter,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f5f7;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0"
          style="background:#ffffff;border-radius:16px;overflow:hidden;
                 box-shadow:0 4px 24px rgba(0,0,0,0.1);max-width:600px;width:100%;">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#0a0f2c 0%,#192a6c 100%);
                       padding:40px 40px 36px;text-align:center;">
              <p style="margin:0 0 4px;font-size:32px;">⚗️</p>
              <h1 style="color:#d4af37;margin:0;font-size:26px;font-weight:800;
                         letter-spacing:-0.5px;">
                OnlyChemistry
              </h1>
              <p style="color:rgba(255,255,255,0.65);margin:8px 0 0;font-size:13px;
                        letter-spacing:0.5px;text-transform:uppercase;">
                Premier Chemistry Education Platform
              </p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px 40px 32px;">
              <h2 style="color:#0a0f2c;font-size:22px;margin:0 0 8px;font-weight:700;">
                Welcome, ${name}! 🎉
              </h2>
              <p style="color:#555;font-size:15px;line-height:1.7;margin:0 0 24px;">
                Your <strong>OnlyChemistry</strong> account has been successfully created.
                You can now access your chemistry exams, courses, study material, practice
                resources, and all other learning features.
              </p>

              <!-- Account Info Box -->
              <div style="background:#f8f9fb;border-left:4px solid #d4af37;
                          border-radius:8px;padding:20px 24px;margin:0 0 28px;">
                <p style="margin:0 0 4px;font-size:12px;color:#999;
                           text-transform:uppercase;letter-spacing:1.5px;font-weight:600;">
                  Registered Email
                </p>
                <p style="margin:0;font-size:16px;color:#0a0f2c;font-weight:600;">
                  ${email}
                </p>
              </div>

              <!-- CTA Button -->
              <div style="text-align:center;margin:0 0 32px;">
                <a href="https://onlychemistry.com/login"
                   style="display:inline-block;background:linear-gradient(135deg,#d4af37,#b8962e);
                          color:#0a0f2c;font-weight:700;font-size:15px;
                          padding:14px 36px;border-radius:8px;text-decoration:none;
                          letter-spacing:0.3px;">
                  Go to My Dashboard →
                </a>
              </div>

              <p style="color:#888;font-size:14px;line-height:1.6;margin:0;">
                We're excited to have you with us. If you have any questions,
                feel free to reach out to our support team.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f8f9fb;padding:24px 40px;border-top:1px solid #eee;
                       text-align:center;">
              <p style="margin:0 0 4px;color:#0a0f2c;font-size:13px;font-weight:700;">
                Regards, OnlyChemistry Team
              </p>
              <p style="margin:0;color:#bbb;font-size:12px;">
                © ${year} OnlyChemistry. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`.trim();
}

export function welcomeEmailText(name: string, email: string): string {
  return `Welcome to OnlyChemistry, ${name}!

Your account has been successfully created.

Registered email: ${email}

You can now log in and access your chemistry exams, courses, study material, and practice resources.

Login: https://onlychemistry.com/login

Regards,
OnlyChemistry Team`;
}
