import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import QRCode from 'qrcode';
import JSZip from 'jszip';

export interface VoucherPDFData {
  humanRef: string;
  redemptionCode: string;
  productTitle: string;
  voucherValue: number;
  companyName: string;
  issueDate: string;
  expiryDate: string;
  eligibleExperiences: string[];
  terms: string[];
  assignedEmployee?: string;
}

/**
 * Generate SVG/DataURI QR Code for Nisargshala redemption portal.
 */
export async function generateRedemptionQRCode(): Promise<string> {
  const redemptionUrl = 'https://nisargshala.in/redeem';
  try {
    return await QRCode.toDataURL(redemptionUrl, {
      margin: 1,
      width: 200,
      color: {
        dark: '#05A658',
        light: '#FFFFFF',
      },
    });
  } catch (err) {
    console.error('Error generating QR Code:', err);
    return '';
  }
}

/**
 * Generates single HTML voucher markup for web view and printing.
 */
export function generateVoucherHtml(data: VoucherPDFData, qrCodeDataUrl: string): string {
  const formattedValue = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(data.voucherValue);

  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8" />
    <title>Nisargshala Corporate Voucher - ${data.humanRef}</title>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&family=Outfit:wght@600;700&display=swap');
      body {
        font-family: 'Inter', sans-serif;
        background: #F4F7F3;
        color: #045830;
        margin: 0;
        padding: 40px 20px;
        display: flex;
        justify-content: center;
      }
      .voucher-card {
        background: #FFFFFF;
        width: 100%;
        max-width: 750px;
        border-radius: 16px;
        overflow: hidden;
        box-shadow: 0 10px 30px rgba(5, 166, 88, 0.12);
        border: 2px solid #DCFCE7;
      }
      .header {
        background: linear-gradient(135deg, #045830 0%, #02341C 100%);
        color: #FFFFFF;
        padding: 28px 36px;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      .brand-title {
        font-family: 'Outfit', serif;
        font-size: 24px;
        font-weight: 700;
        letter-spacing: 1px;
        color: #FFFFFF;
        margin: 0;
      }
      .brand-sub {
        font-size: 11px;
        color: #86EFAC;
        margin-top: 4px;
        text-transform: uppercase;
        letter-spacing: 1.5px;
      }
      .badge {
        background: #D97706;
        color: #FFFFFF;
        padding: 6px 14px;
        border-radius: 20px;
        font-size: 12px;
        font-weight: 600;
      }
      .content {
        padding: 36px;
      }
      .title-row {
        display: flex;
        justify-content: space-between;
        align-items: baseline;
        border-bottom: 2px dashed #DCFCE7;
        padding-bottom: 20px;
        margin-bottom: 24px;
      }
      .product-title {
        font-family: 'Outfit', serif;
        font-size: 22px;
        color: #02341C;
        margin: 0;
      }
      .voucher-value {
        font-size: 30px;
        font-weight: 700;
        color: #D97706;
      }
      .code-box {
        background: #F0FDF4;
        border: 2px dashed #05A658;
        border-radius: 12px;
        padding: 20px;
        text-align: center;
        margin-bottom: 24px;
      }
      .code-label {
        font-size: 11px;
        font-weight: 600;
        color: #05A658;
        text-transform: uppercase;
        letter-spacing: 1px;
        margin-bottom: 6px;
      }
      .secret-code {
        font-family: monospace;
        font-size: 26px;
        font-weight: 700;
        letter-spacing: 3px;
        color: #02341C;
      }
      .meta-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 16px;
        margin-bottom: 24px;
        background: #FAFBF9;
        padding: 16px;
        border-radius: 10px;
      }
      .meta-item label {
        display: block;
        font-size: 10px;
        color: #16A34A;
        text-transform: uppercase;
        margin-bottom: 2px;
      }
      .meta-item span {
        font-weight: 600;
        font-size: 13px;
        color: #02341C;
      }
      .section-title {
        font-size: 13px;
        font-weight: 700;
        color: #02341C;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        margin-bottom: 8px;
      }
      .experiences-list {
        margin: 0 0 20px 0;
        padding-left: 20px;
        color: #045830;
        font-size: 13px;
        line-height: 1.5;
      }
      .footer {
        background: #F4F7F3;
        border-top: 1px solid #DCFCE7;
        padding: 24px 36px;
        display: flex;
        align-items: center;
        justify-content: space-between;
      }
      .qr-img {
        width: 80px;
        height: 80px;
        border-radius: 8px;
        border: 1px solid #DCFCE7;
      }
      .instructions {
        font-size: 12px;
        color: #045830;
        line-height: 1.5;
        max-width: 480px;
      }
      .instructions a {
        color: #D97706;
        font-weight: 600;
        text-decoration: none;
      }
    </style>
  </head>
  <body>
    <div class="voucher-card">
      <div class="header">
        <div>
          <h1 class="brand-title">NISARGSHALA</h1>
          <div class="brand-sub">Corporate Experience Gift Voucher</div>
        </div>
        <div class="badge">Valid Gift Certificate</div>
      </div>
      <div class="content">
        <div class="title-row">
          <div>
            <h2 class="product-title">${data.productTitle}</h2>
            <div style="font-size: 12px; color: #16A34A; margin-top: 4px;">Issued for: <strong>${data.companyName}</strong></div>
          </div>
          <div class="voucher-value">${formattedValue}</div>
        </div>

        <div class="code-box">
          <div class="code-label">Secret Redemption Code (Confidential)</div>
          <div class="secret-code">${data.redemptionCode}</div>
        </div>

        <div class="meta-grid">
          <div class="meta-item">
            <label>Voucher Ref</label>
            <span>${data.humanRef}</span>
          </div>
          <div class="meta-item">
            <label>Issue Date</label>
            <span>${data.issueDate}</span>
          </div>
          <div class="meta-item">
            <label>Expiry Date</label>
            <span>${data.expiryDate}</span>
          </div>
          <div class="meta-item" style="grid-column: span 3; border-top: 1px solid #DCFCE7; pt: 8px; mt: 4px;">
            <label>Seller GSTIN (Nisargshala)</label>
            <span style="font-family: monospace; font-size: 12px; color: #045830;">27ARHPV2783R1ZN</span>
          </div>
        </div>

        ${data.assignedEmployee ? `
          <div style="margin-bottom: 20px; padding: 12px 16px; background: #DCFCE7; border-radius: 8px; font-size: 13px; color: #02341C;">
            👥 Assigned Recipient: <strong>${data.assignedEmployee}</strong>
          </div>
        ` : ''}

        <div class="section-title">Eligible Experience Modules</div>
        <ul class="experiences-list">
          ${data.eligibleExperiences.map(exp => `<li>${exp}</li>`).join('')}
        </ul>

        <div class="section-title">Terms & Conditions</div>
        <ul class="experiences-list" style="font-size: 11px;">
          ${data.terms.map(t => `<li>${t}</li>`).join('')}
        </ul>
      </div>

      <div class="footer">
        <div class="instructions">
          <strong>How to Redeem:</strong><br/>
          Visit the official Nisargshala retail website at <a href="https://nisargshala.in/redeem" target="_blank">https://nisargshala.in/redeem</a>, select your desired experience dates, and enter your secret code during checkout.
        </div>
        ${qrCodeDataUrl ? `<img src="${qrCodeDataUrl}" class="qr-img" alt="Redeem QR Code" />` : ''}
      </div>
    </div>
  </body>
  </html>
  `;
}

/**
 * Generates a single combined HTML document containing all N vouchers in sequence for printing.
 */
export async function generateCombinedVouchersHtml(vouchers: VoucherPDFData[]): Promise<string> {
  const qrCode = await generateRedemptionQRCode();
  
  const pagesHtml = vouchers.map((voucher) => {
    return `<div style="page-break-after: always; margin-bottom: 40px;">${generateVoucherHtml(voucher, qrCode)}</div>`;
  }).join('');

  return `
  <!DOCTYPE html>
  <html>
  <head>
    <title>Nisargshala Corporate Vouchers Bundle (${vouchers.length} Vouchers)</title>
    <style>
      @media print {
        div { page-break-after: always; }
      }
    </style>
  </head>
  <body>
    ${pagesHtml}
  </body>
  </html>
  `;
}

/**
 * Generates a styled vector PDF binary buffer for a voucher certificate using pdf-lib (zero filesystem/node_modules asset dependencies).
 */
export async function generateVoucherPdfBuffer(data: VoucherPDFData): Promise<Buffer> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 841.89]); // A4 Page

  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontMono = await pdfDoc.embedFont(StandardFonts.CourierBold);

  // Generate QR Code PNG Buffer
  const redemptionUrl = 'https://nisargshala.in/redeem';
  const qrBuffer = await QRCode.toBuffer(redemptionUrl, {
    margin: 1,
    width: 200,
    color: { dark: '#05A658', light: '#FFFFFF' },
  });
  const qrImage = await pdfDoc.embedPng(qrBuffer);

  const formattedValue = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(data.voucherValue);

  const priceString = formattedValue.replace('₹', 'Rs. ').trim();

  // 1. Outer Card Background
  page.drawRectangle({
    x: 40,
    y: 50,
    width: 515,
    height: 740,
    color: rgb(1, 1, 1),
    borderColor: rgb(0.86, 0.99, 0.91),
    borderWidth: 1.5,
  });

  // 2. Header Banner
  page.drawRectangle({
    x: 40,
    y: 715,
    width: 515,
    height: 75,
    color: rgb(0.015, 0.22, 0.15), // #043927
  });

  // Header Brand Title
  page.drawText('NISARGSHALA', {
    x: 64,
    y: 754,
    size: 20,
    font: fontBold,
    color: rgb(1, 1, 1),
  });

  // Header Subtitle
  page.drawText('CORPORATE EXPERIENCE GIFT VOUCHER', {
    x: 64,
    y: 736,
    size: 8.5,
    font: fontBold,
    color: rgb(0.525, 0.937, 0.675), // #86EFAC
  });

  // Badge "Valid Gift Certificate"
  page.drawRectangle({
    x: 385,
    y: 740,
    width: 145,
    height: 24,
    color: rgb(0.85, 0.46, 0.02), // #D97706
  });

  page.drawText('Valid Gift Certificate', {
    x: 397,
    y: 748,
    size: 9,
    font: fontBold,
    color: rgb(1, 1, 1),
  });

  // 3. Title & Value Row
  page.drawText(data.productTitle, {
    x: 64,
    y: 672,
    size: 18,
    font: fontBold,
    color: rgb(0.01, 0.17, 0.13), // #022C22
  });

  page.drawText('Issued for: ', {
    x: 64,
    y: 654,
    size: 9.5,
    font: fontRegular,
    color: rgb(0.08, 0.64, 0.29), // #16A34A
  });

  const issuedForWidth = fontRegular.widthOfTextAtSize('Issued for: ', 9.5);
  page.drawText(data.companyName, {
    x: 64 + issuedForWidth,
    y: 654,
    size: 9.5,
    font: fontBold,
    color: rgb(0.01, 0.17, 0.13),
  });

  // Voucher Value
  const priceWidth = fontBold.widthOfTextAtSize(priceString, 26);
  page.drawText(priceString, {
    x: 555 - priceWidth,
    y: 666,
    size: 26,
    font: fontBold,
    color: rgb(0.85, 0.46, 0.02), // #D97706
  });

  // Dashed divider line
  page.drawLine({
    start: { x: 64, y: 640 },
    end: { x: 531, y: 640 },
    color: rgb(0.86, 0.99, 0.91),
    thickness: 1.5,
    dashArray: [4, 4],
  });

  // 4. Secret Code Box
  page.drawRectangle({
    x: 64,
    y: 555,
    width: 467,
    height: 70,
    color: rgb(0.94, 0.99, 0.96), // #F0FDF4
    borderColor: rgb(0.02, 0.65, 0.35), // #05A658
    borderWidth: 1.5,
    borderDashArray: [4, 4],
  });

  const codeLabelText = 'SECRET REDEMPTION CODE (CONFIDENTIAL)';
  const codeLabelWidth = fontBold.widthOfTextAtSize(codeLabelText, 8);
  page.drawText(codeLabelText, {
    x: 64 + (467 - codeLabelWidth) / 2,
    y: 604,
    size: 8,
    font: fontBold,
    color: rgb(0.02, 0.65, 0.35),
  });

  const codeText = data.redemptionCode;
  const codeWidth = fontMono.widthOfTextAtSize(codeText, 18);
  page.drawText(codeText, {
    x: 64 + (467 - codeWidth) / 2,
    y: 574,
    size: 18,
    font: fontMono,
    color: rgb(0.01, 0.17, 0.13),
  });

  // 5. Meta Grid Box
  page.drawRectangle({
    x: 64,
    y: 445,
    width: 467,
    height: 95,
    color: rgb(0.98, 0.98, 0.97), // #FAFBF9
    borderColor: rgb(0.9, 0.9, 0.9),
    borderWidth: 0.5,
  });

  // Col 1: Voucher Ref
  page.drawText('VOUCHER REF', { x: 80, y: 520, size: 7.5, font: fontBold, color: rgb(0.08, 0.64, 0.29) });
  page.drawText(data.humanRef, { x: 80, y: 505, size: 10, font: fontBold, color: rgb(0.01, 0.17, 0.13) });

  // Col 2: Issue Date
  page.drawText('ISSUE DATE', { x: 230, y: 520, size: 7.5, font: fontBold, color: rgb(0.08, 0.64, 0.29) });
  page.drawText(data.issueDate, { x: 230, y: 505, size: 10, font: fontBold, color: rgb(0.01, 0.17, 0.13) });

  // Col 3: Expiry Date
  page.drawText('EXPIRY DATE', { x: 380, y: 520, size: 7.5, font: fontBold, color: rgb(0.08, 0.64, 0.29) });
  page.drawText(data.expiryDate, { x: 380, y: 505, size: 10, font: fontBold, color: rgb(0.01, 0.17, 0.13) });

  // Meta Grid Divider
  page.drawLine({
    start: { x: 80, y: 492 },
    end: { x: 515, y: 492 },
    color: rgb(0.86, 0.99, 0.91),
    thickness: 1,
  });

  // Bottom Row: Seller GSTIN
  page.drawText('SELLER GSTIN (NISARGSHALA)', { x: 80, y: 476, size: 7.5, font: fontBold, color: rgb(0.08, 0.64, 0.29) });
  page.drawText('27ARHPV2783R1ZN', { x: 80, y: 461, size: 9.5, font: fontMono, color: rgb(0.01, 0.17, 0.13) });

  // 6. Assigned Recipient (if applicable)
  let currentY = 415;
  if (data.assignedEmployee) {
    page.drawRectangle({
      x: 64,
      y: 410,
      width: 467,
      height: 24,
      color: rgb(0.86, 0.99, 0.91), // #DCFCE7
    });
    page.drawText(`Assigned Recipient: ${data.assignedEmployee}`, {
      x: 74,
      y: 418,
      size: 9.5,
      font: fontBold,
      color: rgb(0.01, 0.17, 0.13),
    });
    currentY -= 35;
  }

  // 7. Eligible Experiences Section
  page.drawText('ELIGIBLE EXPERIENCE MODULES', {
    x: 64,
    y: currentY,
    size: 9,
    font: fontBold,
    color: rgb(0.01, 0.17, 0.13),
  });

  currentY -= 16;
  for (const exp of data.eligibleExperiences) {
    page.drawText(`•  ${exp}`, {
      x: 72,
      y: currentY,
      size: 9,
      font: fontRegular,
      color: rgb(0.02, 0.35, 0.19),
    });
    currentY -= 14;
  }

  // 8. Terms & Conditions Section
  currentY -= 8;
  page.drawText('TERMS & CONDITIONS', {
    x: 64,
    y: currentY,
    size: 9,
    font: fontBold,
    color: rgb(0.01, 0.17, 0.13),
  });

  currentY -= 16;
  for (const t of data.terms) {
    page.drawText(`•  ${t}`, {
      x: 72,
      y: currentY,
      size: 8.5,
      font: fontRegular,
      color: rgb(0.02, 0.35, 0.19),
    });
    currentY -= 14;
  }

  // 9. Footer Section
  page.drawRectangle({
    x: 40,
    y: 50,
    width: 515,
    height: 75,
    color: rgb(0.95, 0.97, 0.95), // #F4F7F3
    borderColor: rgb(0.86, 0.99, 0.91),
    borderWidth: 1,
  });

  page.drawText('How to Redeem:', {
    x: 64,
    y: 104,
    size: 9.5,
    font: fontBold,
    color: rgb(0.02, 0.35, 0.19),
  });

  page.drawText('Visit the official Nisargshala retail website at ', {
    x: 64,
    y: 88,
    size: 8.5,
    font: fontRegular,
    color: rgb(0.02, 0.35, 0.19),
  });

  const part1Width = fontRegular.widthOfTextAtSize('Visit the official Nisargshala retail website at ', 8.5);
  page.drawText('https://nisargshala.in/redeem', {
    x: 64 + part1Width,
    y: 88,
    size: 8.5,
    font: fontBold,
    color: rgb(0.85, 0.46, 0.02),
  });

  const part2Width = fontBold.widthOfTextAtSize('https://nisargshala.in/redeem', 8.5);
  page.drawText(', select your', {
    x: 64 + part1Width + part2Width,
    y: 88,
    size: 8.5,
    font: fontRegular,
    color: rgb(0.02, 0.35, 0.19),
  });

  page.drawText('desired experience dates, and enter your secret code during checkout.', {
    x: 64,
    y: 74,
    size: 8.5,
    font: fontRegular,
    color: rgb(0.02, 0.35, 0.19),
  });

  // QR Code Image on Right
  page.drawImage(qrImage, {
    x: 470,
    y: 55,
    width: 64,
    height: 64,
  });

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}

/**
 * Creates a ZIP archive containing individual PDF vouchers for an entire order.
 */
export async function generateBulkOrderVouchersZip(vouchers: VoucherPDFData[]): Promise<Buffer> {
  const zip = new JSZip();

  for (const voucher of vouchers) {
    const pdfBuf = await generateVoucherPdfBuffer(voucher);
    const baseName = `${voucher.humanRef}-${voucher.redemptionCode.slice(-4)}`;
    zip.file(`${baseName}.pdf`, pdfBuf);
  }

  return await zip.generateAsync({ type: 'nodebuffer' });
}
