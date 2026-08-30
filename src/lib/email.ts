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
          <td style="padding: 20px; text-align: center; background-color: #ffffff; border-bottom: 1px solid #e1e8e3;">
            <img src="https://corp.nisargshala.in/images/nisargshala-logo.png" alt="Nisargshala Logo" style="height: 60px; width: auto; object-fit: contain;" />
          </td>
        </tr>
        <tr>
          <td style="background-color: #062018; padding: 24px; text-align: center;">
            <h1 style="color: #ffffff; font-size: 20px; font-weight: 700; margin: 0; letter-spacing: 0.5px;">Corporate Gateway Security</h1>
            <p style="color: #a5f4bc; font-size: 12px; margin: 4px 0 0 0; text-transform: uppercase; letter-spacing: 1px;">Verification Code</p>
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
          <td style="padding: 20px; text-align: center; background-color: #ffffff; border-bottom: 1px solid #e1e8e3;">
            <img src="https://corp.nisargshala.in/images/nisargshala-logo.png" alt="Nisargshala Logo" style="height: 60px; width: auto; object-fit: contain;" />
          </td>
        </tr>
        <tr>
          <td style="background-color: #062018; padding: 24px; text-align: center;">
            <h1 style="color: #ffffff; font-size: 20px; font-weight: 700; margin: 0; letter-spacing: 0.5px;">Corporate Vouchers Activated</h1>
            <p style="color: #a5f4bc; font-size: 12px; margin: 4px 0 0 0; text-transform: uppercase; letter-spacing: 1px;">Order Reference: ${orderNumber}</p>
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

/**
 * Dispatch Corporate Team Outing & Retreat Confirmation Email with Tax Invoice PDF
 */
export async function sendTeamOutingConfirmationEmail(params: {
  to: string;
  clientName: string;
  companyName: string;
  bookingNumber: string;
  packageTitle: string;
  eventDate: string;
  attendeesCount: number;
  location: string;
  totalAmount: number;
  utrReference: string;
  invoiceHtml: string;
  invoicePdfBuffer?: Buffer;
  buyerGstin: string;
}) {
  const {
    to,
    clientName,
    companyName,
    bookingNumber,
    packageTitle,
    eventDate,
    attendeesCount,
    location,
    totalAmount,
    utrReference,
    invoiceHtml,
    invoicePdfBuffer,
    buyerGstin,
  } = params;

  const cleanTo = to.trim().toLowerCase();
  console.log(`[OUTING ${bookingNumber}] EMAIL_ATTEMPT | Recipient: ${cleanTo} | Booking: ${bookingNumber}`);

  if (!isEmailConfigured()) {
    console.warn(`[OUTING ${bookingNumber}] EMAIL_SKIPPED | Email service not configured | Recipient: ${cleanTo}`);
    return { success: false, reason: 'EMAIL_SERVICE_NOT_CONFIGURED' };
  }

  const fromEmail = process.env.EMAIL_FROM || '"Nisargshala Corporate Gateway" <corporate@nisargshala.in>';
  const subject = `Your Corporate Retreat is Confirmed — Booking #${bookingNumber}`;

  const htmlBody = `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="utf-8"/>
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
    <title>Booking Confirmation - Nisargshala</title>
  </head>
  <body style="background-color: #fdf9f5; font-family: 'Inter', Arial, sans-serif; margin: 0; padding: 30px 10px; color: #1c1c19;">
    <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 680px; background-color: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #ebe7e4; box-shadow: 0 16px 36px rgba(10,43,27,0.06);">
      <!-- Header Logo -->
      <tr>
        <td style="padding: 24px; text-align: center; border-bottom: 1px solid #f1ede9; background-color: #ffffff;">
          <img src="https://corp.nisargshala.in/images/nisargshala-logo.png" alt="Nisargshala Logo" style="height: 64px; width: auto; object-fit: contain;" />
        </td>
      </tr>
      
      <!-- Hero Banner -->
      <tr>
        <td style="background-color: #062018; position: relative; padding: 36px 30px; text-align: center; color: #ffffff;">
          <h1 style="font-size: 26px; font-weight: 700; margin: 0; color: #ffffff; letter-spacing: -0.5px;">Your Corporate Retreat is Confirmed</h1>
          <p style="color: #a5f4bc; font-size: 14px; margin-top: 8px;">Experience: <strong>${packageTitle}</strong></p>
        </td>
      </tr>

      <!-- Body Content -->
      <tr>
        <td style="padding: 36px 30px;">
          <p style="font-size: 16px; line-height: 1.6; color: #424843; margin-top: 0;">
            Hello <strong>${clientName}</strong> (<strong style="color: #1b6c40;">${companyName}</strong>),<br/>
            We are thrilled to host your team for an unforgettable experience blending professional growth with natural immersion.
          </p>

          <!-- Booking Summary Box -->
          <div style="background-color: #f7f3ef; border: 1px solid #e5e2de; border-radius: 12px; padding: 24px; margin: 28px 0;">
            <h2 style="color: #062018; font-size: 18px; margin-top: 0; margin-bottom: 16px; border-bottom: 1px solid #e5e2de; padding-bottom: 10px;">
              📅 Booking Summary
            </h2>
            <table width="100%" cellpadding="6" cellspacing="0" style="font-size: 14px; color: #1c1c19;">
              <tr>
                <td width="35%" style="color: #727973; font-weight: 600; text-transform: uppercase; font-size: 11px;">Booking Reference</td>
                <td style="font-weight: 700; color: #1b6c40;">${bookingNumber}</td>
              </tr>
              <tr>
                <td style="color: #727973; font-weight: 600; text-transform: uppercase; font-size: 11px;">Event Date</td>
                <td style="font-weight: 600;">${eventDate}</td>
              </tr>
              <tr>
                <td style="color: #727973; font-weight: 600; text-transform: uppercase; font-size: 11px;">Attendees</td>
                <td style="font-weight: 600;">${attendeesCount} Team Members</td>
              </tr>
              <tr>
                <td style="color: #727973; font-weight: 600; text-transform: uppercase; font-size: 11px;">Location</td>
                <td style="font-weight: 600;">${location}</td>
              </tr>
              <tr>
                <td style="color: #727973; font-weight: 600; text-transform: uppercase; font-size: 11px;">Total Amount Paid</td>
                <td style="font-weight: 700; color: #062018;">₹${totalAmount.toLocaleString('en-IN')} (Includes GST)</td>
              </tr>
              <tr>
                <td style="color: #727973; font-weight: 600; text-transform: uppercase; font-size: 11px;">Payment UTR Ref</td>
                <td style="font-family: monospace; font-size: 13px; font-weight: 600; color: #1b6c40;">${utrReference}</td>
              </tr>
              <tr>
                <td style="color: #727973; font-weight: 600; text-transform: uppercase; font-size: 11px;">Seller GSTIN</td>
                <td style="font-family: monospace; font-size: 12px;">27ARHPV2783R1ZN (Nisargshala)</td>
              </tr>
              <tr>
                <td style="color: #727973; font-weight: 600; text-transform: uppercase; font-size: 11px;">Buyer GSTIN</td>
                <td style="font-family: monospace; font-size: 12px;">${buyerGstin}</td>
              </tr>
            </table>
          </div>

          <!-- What to Expect Checklist -->
          <div style="margin: 28px 0;">
            <h3 style="color: #062018; font-size: 16px; margin-bottom: 12px;">What to Expect</h3>
            <ul style="padding-left: 20px; color: #424843; font-size: 14px; line-height: 1.8; margin: 0;">
              <li><strong>Pre-Arrival Guide:</strong> Look out for our comprehensive guide detailing packing lists and essential info in your inbox.</li>
              <li><strong>Team Building Activities:</strong> Your customized itinerary including guided hikes and leadership workshops is being finalized.</li>
              <li><strong>Dietary Preferences:</strong> Please inform our coordinator of any special dietary requirements prior to arrival.</li>
            </ul>
          </div>

          <!-- Invoice Attachment Notice -->
          <div style="background-color: #fdf9f5; border: 1px solid #e5e2de; border-radius: 10px; padding: 16px; text-align: center; margin: 24px 0;">
            <p style="margin: 0; font-size: 13px; color: #1b6c40; font-weight: 600;">
              📄 Your official Tax Invoice is attached to this email in PDF format.
            </p>
          </div>

          <!-- Call / WhatsApp Support Box -->
          <div style="background-color: #062018; color: #ffffff; border-radius: 12px; padding: 20px; text-align: center; margin-top: 28px;">
            <p style="margin: 0 0 10px 0; font-size: 13px; color: #a5f4bc; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">
              Need Operational Assistance or Customization?
            </p>
            <p style="margin: 0; font-size: 15px; font-weight: 600;">
              📞 Call: <a href="tel:+919049002053" style="color: #ffffff; text-decoration: underline;">+91 90490 02053</a> &nbsp;|&nbsp;
              💬 WhatsApp: <a href="https://wa.me/918698969892" style="color: #a5f4bc; text-decoration: underline;">+91 86989 69892</a>
            </p>
          </div>

          <hr style="border: none; border-top: 1px solid #ebe7e4; margin: 36px 0 20px 0;"/>

          <p style="font-size: 12px; color: #727973; margin: 0; text-align: center;">
            © 2026 Nisargshala Corporate Nature Retreats & Experiences. All rights reserved.<br/>
            <a href="https://corp.nisargshala.in" style="color: #1b6c40; text-decoration: none;">https://corp.nisargshala.in</a>
          </p>
        </td>
      </tr>
    </table>
  </body>
  </html>
  `;

  const pdfAttachment = invoicePdfBuffer || Buffer.from(invoiceHtml);
  const pdfFilename = `TAX_INVOICE_${bookingNumber}.pdf`;

  // Resend API
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
              filename: pdfFilename,
              content: pdfAttachment.toString('base64'),
            },
          ],
        }),
      });

      if (!response.ok) {
        console.error(`[OUTING ${bookingNumber}] EMAIL_FAILED | Resend API error: ${response.status}`);
      } else {
        console.log(`[OUTING ${bookingNumber}] EMAIL_SENT | Resend | Recipient: ${cleanTo}`);
        return { success: true, provider: 'Resend' };
      }
    } catch (err: any) {
      console.error(`[OUTING ${bookingNumber}] EMAIL_FAILED | Resend error: ${err.message}`);
    }
  }

  // SMTP Fallback
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
      tls: { rejectUnauthorized: false },
    });

    await transporter.sendMail({
      from: fromEmail,
      to: cleanTo,
      subject,
      html: htmlBody,
      attachments: [
        {
          filename: pdfFilename,
          content: pdfAttachment,
          contentType: 'application/pdf',
        },
      ],
    });

    console.log(`[OUTING ${bookingNumber}] EMAIL_SENT | SMTP | Recipient: ${cleanTo}`);
    return { success: true, provider: 'SMTP' };
  } catch (err: any) {
    console.error(`[OUTING ${bookingNumber}] EMAIL_FAILED | SMTP error: ${err.message}`);
    return { success: false, error: err.message };
  }
}

