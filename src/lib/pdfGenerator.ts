import React from 'react';
import { Document, Page, View, Text, Image, StyleSheet, Font, renderToBuffer, pdf } from '@react-pdf/renderer';
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

try {
  Font.register({
    family: 'NotoSans',
    fonts: [
      { src: 'https://raw.githubusercontent.com/google/fonts/main/ofl/notosans/NotoSans%5Bwdth%2Cwght%5D.ttf' },
    ],
  });
} catch (e) {
  console.warn('Font registration error for ReactPDF:', e);
}

const styles = StyleSheet.create({
  page: {
    padding: 30,
    backgroundColor: '#F4F7F3',
    fontFamily: 'NotoSans',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#DCFCE7',
  },
  header: {
    backgroundColor: '#043927',
    paddingTop: 20,
    paddingBottom: 20,
    paddingLeft: 24,
    paddingRight: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  brandTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontFamily: 'NotoSans',
    fontWeight: 'bold',
    letterSpacing: 1.5,
  },
  brandSub: {
    color: '#86EFAC',
    fontSize: 8.5,
    fontFamily: 'NotoSans',
    fontWeight: 'bold',
    marginTop: 4,
    letterSpacing: 1.5,
  },
  badge: {
    backgroundColor: '#D97706',
    borderRadius: 15,
    paddingVertical: 5,
    paddingHorizontal: 12,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontFamily: 'NotoSans',
    fontWeight: 'bold',
  },
  body: {
    padding: 24,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottomWidth: 1,
    borderBottomColor: '#DCFCE7',
    borderBottomStyle: 'dashed',
    paddingBottom: 16,
    marginBottom: 16,
  },
  productTitle: {
    fontSize: 18,
    fontFamily: 'NotoSans',
    fontWeight: 'bold',
    color: '#022C22',
  },
  issuedFor: {
    fontSize: 9.5,
    color: '#16A34A',
    marginTop: 4,
  },
  companyName: {
    fontFamily: 'NotoSans',
    fontWeight: 'bold',
    color: '#022C22',
  },
  voucherValue: {
    fontSize: 26,
    fontFamily: 'NotoSans',
    fontWeight: 'bold',
    color: '#D97706',
  },
  codeBox: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1.5,
    borderColor: '#05A658',
    borderStyle: 'dashed',
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
    marginBottom: 16,
  },
  codeLabel: {
    fontSize: 8,
    fontFamily: 'NotoSans',
    fontWeight: 'bold',
    color: '#05A658',
    letterSpacing: 1,
    marginBottom: 4,
  },
  secretCode: {
    fontSize: 18,
    fontFamily: 'Courier',
    fontWeight: 'bold',
    color: '#022C22',
    letterSpacing: 3,
  },
  metaGrid: {
    backgroundColor: '#FAFBF9',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  metaCol: {
    flex: 1,
  },
  metaLabel: {
    fontSize: 7.5,
    fontFamily: 'NotoSans',
    fontWeight: 'bold',
    color: '#16A34A',
    marginBottom: 2,
  },
  metaValue: {
    fontSize: 10,
    fontFamily: 'NotoSans',
    fontWeight: 'bold',
    color: '#022C22',
  },
  metaDivider: {
    borderTopWidth: 1,
    borderTopColor: '#DCFCE7',
    paddingTop: 8,
    marginTop: 2,
  },
  gstValue: {
    fontSize: 9.5,
    fontFamily: 'Courier',
    fontWeight: 'bold',
    color: '#022C22',
  },
  assignedBox: {
    backgroundColor: '#DCFCE7',
    borderRadius: 8,
    padding: 10,
    marginBottom: 16,
  },
  assignedText: {
    fontSize: 9.5,
    color: '#022C22',
  },
  sectionTitle: {
    fontSize: 9,
    fontFamily: 'NotoSans',
    fontWeight: 'bold',
    color: '#022C22',
    letterSpacing: 0.5,
    marginBottom: 6,
    marginTop: 4,
  },
  list: {
    marginBottom: 12,
  },
  listItem: {
    fontSize: 9,
    color: '#045830',
    marginBottom: 3,
    lineHeight: 1.4,
  },
  footer: {
    backgroundColor: '#F4F7F3',
    borderTopWidth: 1,
    borderTopColor: '#DCFCE7',
    paddingTop: 16,
    paddingBottom: 16,
    paddingLeft: 24,
    paddingRight: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  instructions: {
    maxWidth: 360,
  },
  instructionsTitle: {
    fontSize: 9.5,
    fontFamily: 'NotoSans',
    fontWeight: 'bold',
    color: '#045830',
    marginBottom: 2,
  },
  instructionsText: {
    fontSize: 8.5,
    color: '#045830',
    lineHeight: 1.4,
  },
  link: {
    color: '#D97706',
    fontFamily: 'NotoSans',
    fontWeight: 'bold',
  },
  qrImg: {
    width: 64,
    height: 64,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#DCFCE7',
  },
});

function createVoucherPdfElement(data: VoucherPDFData, qrCodeDataUrl: string) {
  const formattedValue = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(data.voucherValue);

  return React.createElement(
    Document,
    null,
    React.createElement(
      Page,
      { size: 'A4', style: styles.page },
      React.createElement(
        View,
        { style: styles.card },
        // Header
        React.createElement(
          View,
          { style: styles.header },
          React.createElement(
            View,
            null,
            React.createElement(Text, { style: styles.brandTitle }, 'NISARGSHALA'),
            React.createElement(Text, { style: styles.brandSub }, 'CORPORATE EXPERIENCE GIFT VOUCHER')
          ),
          React.createElement(
            View,
            { style: styles.badge },
            React.createElement(Text, { style: styles.badgeText }, 'Valid Gift Certificate')
          )
        ),
        // Body
        React.createElement(
          View,
          { style: styles.body },
          // Title Row
          React.createElement(
            View,
            { style: styles.titleRow },
            React.createElement(
              View,
              null,
              React.createElement(Text, { style: styles.productTitle }, data.productTitle),
              React.createElement(
                Text,
                { style: styles.issuedFor },
                'Issued for: ',
                React.createElement(Text, { style: styles.companyName }, data.companyName)
              )
            ),
            React.createElement(Text, { style: styles.voucherValue }, formattedValue)
          ),
          // Code Box
          React.createElement(
            View,
            { style: styles.codeBox },
            React.createElement(Text, { style: styles.codeLabel }, 'SECRET REDEMPTION CODE (CONFIDENTIAL)'),
            React.createElement(Text, { style: styles.secretCode }, data.redemptionCode)
          ),
          // Meta Grid
          React.createElement(
            View,
            { style: styles.metaGrid },
            React.createElement(
              View,
              { style: styles.metaRow },
              React.createElement(
                View,
                { style: styles.metaCol },
                React.createElement(Text, { style: styles.metaLabel }, 'VOUCHER REF'),
                React.createElement(Text, { style: styles.metaValue }, data.humanRef)
              ),
              React.createElement(
                View,
                { style: styles.metaCol },
                React.createElement(Text, { style: styles.metaLabel }, 'ISSUE DATE'),
                React.createElement(Text, { style: styles.metaValue }, data.issueDate)
              ),
              React.createElement(
                View,
                { style: styles.metaCol },
                React.createElement(Text, { style: styles.metaLabel }, 'EXPIRY DATE'),
                React.createElement(Text, { style: styles.metaValue }, data.expiryDate)
              )
            ),
            React.createElement(
              View,
              { style: styles.metaDivider },
              React.createElement(Text, { style: styles.metaLabel }, 'SELLER GSTIN (NISARGSHALA)'),
              React.createElement(Text, { style: styles.gstValue }, '27ARHPV2783R1ZN')
            )
          ),
          // Assigned Employee Banner
          data.assignedEmployee
            ? React.createElement(
                View,
                { style: styles.assignedBox },
                React.createElement(
                  Text,
                  { style: styles.assignedText },
                  'Assigned Recipient: ',
                  React.createElement(Text, { style: { fontFamily: 'NotoSans', fontWeight: 'bold' } }, data.assignedEmployee)
                )
              )
            : null,
          // Eligible Experience Modules
          React.createElement(Text, { style: styles.sectionTitle }, 'ELIGIBLE EXPERIENCE MODULES'),
          React.createElement(
            View,
            { style: styles.list },
            ...data.eligibleExperiences.map((exp, idx) =>
              React.createElement(Text, { key: idx, style: styles.listItem }, `•  ${exp}`)
            )
          ),
          // Terms & Conditions
          React.createElement(Text, { style: styles.sectionTitle }, 'TERMS & CONDITIONS'),
          React.createElement(
            View,
            { style: styles.list },
            ...data.terms.map((t, idx) =>
              React.createElement(Text, { key: idx, style: styles.listItem }, `•  ${t}`)
            )
          )
        ),
        // Footer
        React.createElement(
          View,
          { style: styles.footer },
          React.createElement(
            View,
            { style: styles.instructions },
            React.createElement(Text, { style: styles.instructionsTitle }, 'How to Redeem:'),
            React.createElement(
              Text,
              { style: styles.instructionsText },
              'Visit the official Nisargshala retail website at ',
              React.createElement(Text, { style: styles.link }, 'https://nisargshala.in/redeem'),
              ', select your desired experience dates, and enter your secret code during checkout.'
            )
          ),
          qrCodeDataUrl ? React.createElement(Image, { src: qrCodeDataUrl, style: styles.qrImg }) : null
        )
      )
    )
  );
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

async function safeRenderToBuffer(doc: any): Promise<Buffer> {
  if (typeof renderToBuffer === 'function') {
    const res = await renderToBuffer(doc);
    return res as unknown as Buffer;
  }
  if (typeof pdf === 'function') {
    const res = await pdf(doc).toBuffer();
    return res as unknown as Buffer;
  }
  throw new Error('PDF rendering engine unavailable');
}

/**
 * Generates a styled vector PDF binary buffer for a voucher certificate using ReactPDF.
 */
export async function generateVoucherPdfBuffer(data: VoucherPDFData): Promise<Buffer> {
  const qrCodeDataUrl = await generateRedemptionQRCode();
  const doc = createVoucherPdfElement(data, qrCodeDataUrl);
  return await safeRenderToBuffer(doc);
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
