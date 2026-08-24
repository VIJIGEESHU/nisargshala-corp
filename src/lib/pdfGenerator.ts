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
 * Creates a ZIP archive containing individual HTML/text vouchers for an entire order.
 */
export async function generateBulkOrderVouchersZip(vouchers: VoucherPDFData[]): Promise<Buffer> {
  const zip = new JSZip();

  for (const voucher of vouchers) {
    const qrCode = await generateRedemptionQRCode();
    const html = generateVoucherHtml(voucher, qrCode);
    zip.file(`${voucher.humanRef}-${voucher.redemptionCode.slice(-4)}.html`, html);
  }

  // Also include the single combined document inside the ZIP for convenience
  const combinedHtml = await generateCombinedVouchersHtml(vouchers);
  zip.file(`ALL_COMBINED_VOUCHERS_${vouchers.length}_UNITS.html`, combinedHtml);

  return await zip.generateAsync({ type: 'nodebuffer' });
}
