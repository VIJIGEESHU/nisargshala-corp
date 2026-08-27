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

/**
 * Dispatch Order Confirmation Email with Vouchers ZIP Attachment
 */
export async function sendVouchersConfirmationEmail(params: {
  to: string;
  companyName: string;
  orderNumber: string;
  totalAmount: number;
  vouchersCount: number;
  zipBuffer: Buffer;
  customerGstin?: string;
  contactPerson?: string;
}) {
  const { to, companyName, orderNumber, totalAmount, vouchersCount, zipBuffer, customerGstin, contactPerson } = params;
  const cleanTo = to.trim().toLowerCase();

  console.log(`[ORDER ${orderNumber}] CUSTOMER_EMAIL_ATTEMPTED | Recipient: ${cleanTo} | Vouchers: ${vouchersCount}`);

  if (!isEmailConfigured()) {
    console.warn(`[ORDER ${orderNumber}] CUSTOMER_EMAIL_SKIPPED | Email service not configured in environment variables | Recipient: ${cleanTo}`);
    return { success: false, reason: 'EMAIL_SERVICE_NOT_CONFIGURED' };
  }

  const fromEmail = process.env.EMAIL_FROM || '"Nisargshala Corporate Vouchers" <corporate@nisargshala.in>';
  const subject = `Nisargshala Corporate Vouchers Activated — Order #${orderNumber}`;

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
            <h2 style="color: #0d3822; font-size: 18px; margin-top: 0;">Payment Verified & Vouchers Activated!</h2>
            <p style="font-size: 14px; line-height: 1.6; color: #3d4f43;">Dear <strong>${contactPerson || companyName}</strong>,</p>
            <p style="font-size: 14px; line-height: 1.6; color: #3d4f43;">
              We are pleased to inform you that your RTGS/NEFT payment transfer for Order <strong>#${orderNumber}</strong> (Total Amount: <strong>₹${totalAmount.toLocaleString('en-IN')}</strong>) for <strong>${companyName}</strong> has been verified and confirmed by Nisargshala operations.
            </p>
            
            <div style="background-color: #f0f9f4; border: 1px solid #c2e8d3; border-radius: 12px; padding: 20px; margin: 25px 0;">
              <h3 style="color: #05A658; margin-top: 0; font-size: 15px;">Order & Tax Breakdown</h3>
              <p style="margin: 5px 0; font-size: 13px; color: #2d4536;">• Order Reference: <strong>${orderNumber}</strong></p>
              <p style="margin: 5px 0; font-size: 13px; color: #2d4536;">• Total Activated Vouchers: <strong>${vouchersCount} Units</strong></p>
              <p style="margin: 5px 0; font-size: 13px; color: #2d4536;">• Validity Period: <strong>12 Months from Today</strong></p>
              <p style="margin: 5px 0; font-size: 13px; color: #2d4536;">• Seller GSTIN (Nisargshala): <strong>27ARHPV2783R1ZN</strong></p>
              ${customerGstin ? `<p style="margin: 5px 0; font-size: 13px; color: #2d4536;">• Buyer GSTIN (Customer): <strong>${customerGstin}</strong></p>` : ''}
              <p style="margin: 5px 0; font-size: 13px; color: #2d4536;">• Delivery Package: <strong>Attached ZIP Archive (PDF Vouchers)</strong></p>
            </div>

            <p style="font-size: 13px; line-height: 1.6; color: #5a6e60;">
              Your complete corporate voucher package is attached directly to this email as a compressed ZIP archive containing individual PDF vouchers for distribution to your employees.
            </p>

            <div style="background-color: #faf8f5; border: 1px solid #e8e2d5; border-radius: 12px; padding: 15px 20px; margin: 20px 0; text-align: center;">
              <p style="margin: 0; font-size: 13px; color: #6b5c43; font-weight: 600;">
                📎 Your voucher package is attached to this email. Please keep this email and attachments for your company records.
              </p>
            </div>

            <p style="font-size: 12px; line-height: 1.6; color: #5a6e60;">
              Need help with your order? Contact Nisargshala Corporate Operations at <strong>corporate@nisargshala.in</strong> or call <strong>+91 90490 02053</strong>.
            </p>

            <hr style="border: none; border-top: 1px solid #eef2ef; margin: 30px 0;">

            <p style="font-size: 12px; color: #788a7e; margin: 0; line-height: 1.5;">
              Warm regards,<br>
              <strong>Nisargshala Corporate Operations Team</strong><br>
              <a href="https://corp.nisargshala.in" style="color: #05A658; text-decoration: none;">https://corp.nisargshala.in</a>
            </p>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  const attachmentFilename = `NISARGSHALA_VOUCHERS_${orderNumber}.zip`;

  // Option A: Resend API
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
          attachments: [
            {
              filename: attachmentFilename,
              content: zipBuffer.toString('base64'),
            },
          ],
        }),
      });

      if (!response.ok) {
        console.error(`[ORDER ${orderNumber}] CUSTOMER_EMAIL_FAILED | Resend API error sending confirmation to ${cleanTo}`);
      } else {
        console.log(`[ORDER ${orderNumber}] CUSTOMER_EMAIL_SENT | Provider: Resend | Recipient: ${cleanTo}`);
        return { success: true, provider: 'Resend' };
      }
    } catch (err: any) {
      console.error(`[ORDER ${orderNumber}] CUSTOMER_EMAIL_FAILED | Resend error: ${err.message}`);
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
      attachments: [
        {
          filename: attachmentFilename,
          content: zipBuffer,
        },
      ],
    });

    console.log(`[ORDER ${orderNumber}] CUSTOMER_EMAIL_SENT | Provider: SMTP | Recipient: ${cleanTo}`);
    return { success: true, provider: 'SMTP' };
  } catch (err: any) {
    console.error(`[ORDER ${orderNumber}] CUSTOMER_EMAIL_FAILED | SMTP error sending voucher confirmation to ${cleanTo}: ${err.message}`);
    return { success: false, error: err.message };
  }
}
