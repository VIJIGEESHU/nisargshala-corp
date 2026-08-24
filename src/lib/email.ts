import nodemailer from 'nodemailer';

export function isEmailConfigured(): boolean {
  if (process.env.RESEND_API_KEY && process.env.RESEND_API_KEY.trim()) {
    return true;
  }
  return Boolean(
    process.env.SMTP_HOST &&
    process.env.SMTP_HOST.trim() &&
    process.env.SMTP_USER &&
    process.env.SMTP_USER.trim() &&
    process.env.SMTP_PASSWORD &&
    process.env.SMTP_PASSWORD.trim()
  );
}

export async function sendOTPEmail(params: { to: string; otp: string }) {
  const { to, otp } = params;
  const cleanTo = to.trim().toLowerCase();

  if (!isEmailConfigured()) {
    console.error(`[EMAIL_SERVICE_NOT_CONFIGURED] Email service is not configured. Missing SMTP_HOST/SMTP_USER/SMTP_PASSWORD or RESEND_API_KEY environment variables when sending to ${cleanTo}`);
    throw new Error('EMAIL_SERVICE_NOT_CONFIGURED');
  }

  const fromEmail = process.env.EMAIL_FROM || '"Nisargshala Corporate Vouchers" <corporate@nisargshala.in>';
  const subject = 'Nisargshala Corporate Portal — Verification Code';

  const htmlBody = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>${subject}</title>
    </head>
    <body style="font-family: 'Helvetica Neue', Arial, sans-serif; background-color: #f4f6f4; margin: 0; padding: 30px 10px; color: #1c2b21;">
      <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e1e8e3; box-shadow: 0 10px 25px rgba(0,0,0,0.05);">
        <!-- Header -->
        <tr>
          <td style="background-color: #05A658; padding: 30px; text-align: center;">
            <h1 style="color: #ffffff; font-size: 22px; font-weight: 700; margin: 0; letter-spacing: 0.5px;">Nisargshala</h1>
            <p style="color: #e0f5ea; font-size: 12px; margin: 4px 0 0 0; text-transform: uppercase; letter-spacing: 1px;">Corporate Experience Vouchers</p>
          </td>
        </tr>
        <!-- Content -->
        <tr>
          <td style="padding: 35px 30px;">
            <h2 style="color: #0d3822; font-size: 18px; margin-top: 0;">Password Reset Verification</h2>
            <p style="font-size: 14px; line-height: 1.6; color: #3d4f43;">Hello,</p>
            <p style="font-size: 14px; line-height: 1.6; color: #3d4f43;">Your 6-digit verification code for the Nisargshala Corporate Portal is:</p>
            
            <!-- OTP Box -->
            <div style="background-color: #f0f9f4; border: 2px dashed #05A658; border-radius: 12px; padding: 20px; text-align: center; margin: 25px 0;">
              <span style="font-family: monospace, Courier, monospace; font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #05A658;">${otp}</span>
            </div>

            <p style="font-size: 13px; line-height: 1.6; color: #5a6e60;">
              <strong>Note:</strong> This verification code will expire in <strong>10 minutes</strong>.
            </p>
            <p style="font-size: 13px; line-height: 1.6; color: #5a6e60;">
              If you did not request a password reset, you can safely ignore this email. Your account security remains intact.
            </p>

            <hr style="border: none; border-top: 1px solid #eef2ef; margin: 30px 0;">

            <p style="font-size: 12px; color: #788a7e; margin: 0; line-height: 1.5;">
              Warm regards,<br>
              <strong>Nisargshala Corporate Support Team</strong><br>
              <a href="https://corp.nisargshala.in" style="color: #05A658; text-decoration: none;">https://corp.nisargshala.in</a>
            </p>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  // Option A: Resend API if configured
  if (process.env.RESEND_API_KEY && process.env.RESEND_API_KEY.trim()) {
    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.RESEND_API_KEY.trim()}`,
        },
        body: JSON.stringify({
          from: fromEmail,
          to: [cleanTo],
          subject,
          html: htmlBody,
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        console.error(`[EMAIL_SEND_FAILED] Resend API error sending to ${cleanTo}: ${response.status} ${errText}`);
        throw new Error(`Resend API Error ${response.status}`);
      }

      return { success: true, provider: 'Resend' };
    } catch (err: any) {
      console.error(`[EMAIL_SEND_FAILED] Failed to dispatch via Resend to ${cleanTo}: ${err.message}`);
      throw new Error('EMAIL_SEND_FAILED');
    }
  }

  // Option B: Nodemailer SMTP
  try {
    const isSecure = process.env.SMTP_SECURE === 'true' || process.env.SMTP_PORT === '465';
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST?.trim(),
      port: Number(process.env.SMTP_PORT) || (isSecure ? 465 : 587),
      secure: isSecure,
      auth: {
        user: process.env.SMTP_USER?.trim(),
        pass: process.env.SMTP_PASSWORD?.trim(),
      },
      tls: {
        rejectUnauthorized: false,
      },
    });

    await transporter.sendMail({
      from: fromEmail,
      to: cleanTo,
      subject,
      html: htmlBody,
    });

    return { success: true, provider: 'SMTP' };
  } catch (err: any) {
    console.error(`[EMAIL_SEND_FAILED] SMTP error sending to ${cleanTo}: ${err.message}`);
    throw new Error('EMAIL_SEND_FAILED');
  }
}
