import fs from 'fs';
import path from 'path';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

export interface InvoiceData {
  invoiceNumber: string; // NS/26-27/000123
  invoiceDate: string; // e.g. December 8, 2025
  dueDate: string; // e.g. December 10, 2025
  referenceNumber: string; // ORD-XXXX or OUTING-XXXX
  companyName: string;
  contactPerson: string;
  billingAddress: string;
  buyerGstin: string;
  items: {
    description: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }[];
  subtotal: number;
  gstRate: number;
  gstAmount: number;
  totalAmount: number;
  advanceReceived: number;
  totalDue: number;
}

/**
 * Generates official HTML Tax Invoice markup matching Nisargshala corporate invoice standard.
 */
export function generateTaxInvoiceHtml(data: InvoiceData): string {
  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(amount);

  const logoUrl = 'https://corp.nisargshala.in/images/nisargshala-logo.png';

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <title>Invoice - ${data.invoiceNumber}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #000000;
      background: #ffffff;
      margin: 0;
      padding: 50px 48px;
      font-size: 14px;
      line-height: 1.45;
    }
    .invoice-container {
      max-width: 760px;
      margin: 0 auto;
    }
    .header-row {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 28px;
    }
    .logo-box img {
      height: 85px;
      width: auto;
      object-fit: contain;
    }
    .invoice-title-block {
      text-align: right;
    }
    .invoice-title {
      font-size: 36px;
      font-weight: 700;
      color: #000000;
      margin: 0;
      letter-spacing: -0.5px;
    }
    .invoice-number-tag {
      font-size: 13px;
      font-weight: 600;
      color: #333333;
      margin-top: 4px;
    }
    .address-section {
      margin-bottom: 26px;
    }
    .address-block {
      margin-bottom: 18px;
      font-size: 13.5px;
      line-height: 1.45;
    }
    .address-block strong {
      font-weight: 700;
    }
    .address-line {
      margin-top: 1px;
      color: #000000;
    }
    .table-container {
      margin-bottom: 26px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      border: 1px solid #d1d5db;
    }
    th {
      border: 1px solid #d1d5db;
      padding: 9px 12px;
      text-align: left;
      font-size: 13px;
      font-weight: 700;
      color: #000000;
      background-color: #ffffff;
    }
    td {
      border: 1px solid #d1d5db;
      padding: 11px 12px;
      color: #000000;
      font-size: 13px;
    }
    .summary-section {
      margin-bottom: 26px;
      font-size: 14px;
      line-height: 1.5;
    }
    .summary-line {
      font-weight: 700;
      margin-bottom: 3px;
      color: #000000;
    }
    .total-due {
      font-size: 15px;
      font-weight: 700;
      margin-top: 6px;
      color: #000000;
    }
    .payment-box {
      margin-top: 26px;
      font-size: 13.5px;
      line-height: 1.45;
    }
    .payment-box strong {
      font-weight: 700;
      color: #000000;
    }
    .footer-note {
      margin-top: 45px;
      font-weight: 700;
      color: #000000;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div class="invoice-container">
    <!-- Header -->
    <div class="header-row">
      <div class="logo-box">
        <img src="${logoUrl}" alt="Nisargshala Logo" />
      </div>
      <div class="invoice-title-block">
        <h1 class="invoice-title">Invoice</h1>
        <div class="invoice-number-tag">Invoice No: ${data.invoiceNumber}</div>
      </div>
    </div>

    <!-- From & To Section -->
    <div class="address-section">
      <div class="address-block">
        <div><strong>From:</strong></div>
        <div class="address-line">Nisargshala</div>
        <div class="address-line">89, Babuji Bungalow,</div>
        <div class="address-line">Pune - 412115</div>
        <div class="address-line">Email: hemantvavale@gmail.com</div>
        <div class="address-line"><strong>Seller GSTIN:</strong> 27ARHPV2783R1ZN</div>
      </div>

      <div class="address-block">
        <div><strong>To:</strong></div>
        <div class="address-line">${data.companyName}</div>
        <div class="address-line"><strong>Buyer GSTIN:</strong> ${data.buyerGstin || 'Unregistered'}</div>
        <div class="address-line">Attn: ${data.contactPerson || 'Finance / HR'}</div>
        <div class="address-line">Address: ${data.billingAddress || 'Pune, Maharashtra'}</div>
        <div class="address-line"><strong>Date Issued:</strong> ${data.invoiceDate}</div>
        <div class="address-line"><strong>Due Date:</strong> ${data.dueDate}</div>
      </div>
    </div>

    <!-- Items Table -->
    <div class="table-container">
      <table>
        <thead>
          <tr>
            <th style="width: 50%;">Description</th>
            <th style="width: 14%; text-align: center;">Quantity</th>
            <th style="width: 18%; text-align: right;">Unit Price (INR)</th>
            <th style="width: 18%; text-align: right;">Total (INR)</th>
          </tr>
        </thead>
        <tbody>
          ${data.items.map(item => `
            <tr>
              <td>${item.description}</td>
              <td style="text-align: center;">${item.quantity}</td>
              <td style="text-align: right;">${formatCurrency(item.unitPrice)}</td>
              <td style="text-align: right;">${formatCurrency(item.totalPrice)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>

    <!-- Totals Summary -->
    <div class="summary-section">
      <div class="summary-line">Subtotal: ${formatCurrency(data.subtotal)}</div>
      <div class="summary-line">GST Tax (${data.gstRate}%): ${formatCurrency(data.gstAmount)}</div>
      <div class="summary-line">Total Amount: ${formatCurrency(data.totalAmount)}</div>
      ${data.advanceReceived > 0 ? `<div class="summary-line">Less: Advance Payment Received: ${formatCurrency(data.advanceReceived)}</div>` : ''}
      <div class="total-due">TOTAL DUE: ${formatCurrency(data.totalDue)}/-</div>
    </div>

    <!-- Payment Instructions -->
    <div class="payment-box">
      <div><strong>PAYMENT INSTRUCTIONS</strong></div>
      <div class="address-line">Bank Name: HDFC Bank</div>
      <div class="address-line">Account Name: NISARGSHALA</div>
      <div class="address-line">Account Number: 50200097103825</div>
      <div class="address-line">IFSC: HDFC0002493</div>
      <div class="address-line">Payment Reference: ${data.referenceNumber}</div>
    </div>

    <!-- Footer Note -->
    <div class="footer-note">
      We look forward to more such ventures...
    </div>
  </div>
</body>
</html>
  `;
}

/**
 * Generates an official visual PDF binary buffer for the Tax Invoice document identical to the design template.
 */
export async function generateTaxInvoicePdfBuffer(data: InvoiceData): Promise<Buffer> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 841.89]); // A4 dimensions
  const { width, height } = page.getSize();

  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(amount);

  const leftMargin = 48;
  const rightMargin = 48;
  const contentWidth = width - leftMargin - rightMargin; // ~499.28 pt

  // 1. Embed Nisargshala Official Logo
  try {
    const logoPath = path.join(process.cwd(), 'public', 'images', 'nisargshala-logo.png');
    if (fs.existsSync(logoPath)) {
      const logoBytes = fs.readFileSync(logoPath);
      const logoImage = await pdfDoc.embedPng(logoBytes);
      page.drawImage(logoImage, {
        x: leftMargin,
        y: height - 128,
        width: 80,
        height: 80,
      });
    }
  } catch (e) {
    console.warn('Could not embed logo in PDF:', e);
  }

  // 2. Large Bold Title "Invoice" & Invoice Number (Upper-Right)
  page.drawText('Invoice', {
    x: width - rightMargin - 150,
    y: height - 76,
    size: 34,
    font: fontBold,
    color: rgb(0, 0, 0),
  });

  page.drawText(`Invoice No: ${data.invoiceNumber}`, {
    x: width - rightMargin - 150,
    y: height - 94,
    size: 9.5,
    font: fontBold,
    color: rgb(0.2, 0.2, 0.2),
  });

  // 3. "From:" section
  let currentY = height - 152;
  page.drawText('From:', { x: leftMargin, y: currentY, size: 9.5, font: fontBold, color: rgb(0, 0, 0) });
  currentY -= 13;
  page.drawText('Nisargshala', { x: leftMargin, y: currentY, size: 9, font: fontRegular, color: rgb(0, 0, 0) });
  currentY -= 12;
  page.drawText('89, Babuji Bungalow,', { x: leftMargin, y: currentY, size: 9, font: fontRegular, color: rgb(0, 0, 0) });
  currentY -= 12;
  page.drawText('Pune - 412115', { x: leftMargin, y: currentY, size: 9, font: fontRegular, color: rgb(0, 0, 0) });
  currentY -= 12;
  page.drawText('Email: hemantvavale@gmail.com', { x: leftMargin, y: currentY, size: 9, font: fontRegular, color: rgb(0, 0, 0) });
  currentY -= 12;
  page.drawText('Seller GSTIN: ', { x: leftMargin, y: currentY, size: 9, font: fontBold, color: rgb(0, 0, 0) });
  page.drawText('27ARHPV2783R1ZN', { x: leftMargin + 65, y: currentY, size: 9, font: fontBold, color: rgb(0, 0, 0) });

  // 4. "To:" section
  currentY -= 20;
  page.drawText('To:', { x: leftMargin, y: currentY, size: 9.5, font: fontBold, color: rgb(0, 0, 0) });
  currentY -= 13;
  page.drawText(data.companyName.slice(0, 75), { x: leftMargin, y: currentY, size: 9, font: fontRegular, color: rgb(0, 0, 0) });
  currentY -= 12;
  page.drawText('Buyer GSTIN: ', { x: leftMargin, y: currentY, size: 9, font: fontBold, color: rgb(0, 0, 0) });
  page.drawText((data.buyerGstin || 'Unregistered').slice(0, 45), { x: leftMargin + 65, y: currentY, size: 9, font: fontBold, color: rgb(0, 0, 0) });
  currentY -= 12;
  page.drawText(`Attn: ${data.contactPerson || 'Management'}`.slice(0, 75), { x: leftMargin, y: currentY, size: 9, font: fontRegular, color: rgb(0, 0, 0) });
  currentY -= 12;
  page.drawText(`Address: ${data.billingAddress || 'Pune, Maharashtra'}`.slice(0, 75), { x: leftMargin, y: currentY, size: 9, font: fontRegular, color: rgb(0, 0, 0) });
  currentY -= 12;
  page.drawText('Date Issued: ', { x: leftMargin, y: currentY, size: 9, font: fontBold, color: rgb(0, 0, 0) });
  page.drawText(data.invoiceDate, { x: leftMargin + 65, y: currentY, size: 9, font: fontRegular, color: rgb(0, 0, 0) });
  currentY -= 12;
  page.drawText('Due Date: ', { x: leftMargin, y: currentY, size: 9, font: fontBold, color: rgb(0, 0, 0) });
  page.drawText(data.dueDate, { x: leftMargin + 50, y: currentY, size: 9, font: fontRegular, color: rgb(0, 0, 0) });

  // 5. Line Items Table
  currentY -= 24;
  const col1W = 245; // Description
  const col2W = 55;  // Quantity
  const col3W = 100; // Unit Price
  const col4W = contentWidth - col1W - col2W - col3W; // ~99.28 Total

  const headerHeight = 22;
  const tableTopY = currentY;

  // Header Box
  page.drawRectangle({
    x: leftMargin,
    y: tableTopY - headerHeight,
    width: contentWidth,
    height: headerHeight,
    borderColor: rgb(0.82, 0.82, 0.82),
    borderWidth: 1,
    color: rgb(1, 1, 1),
  });

  // Vertical Dividers in Header
  page.drawLine({
    start: { x: leftMargin + col1W, y: tableTopY },
    end: { x: leftMargin + col1W, y: tableTopY - headerHeight },
    thickness: 1,
    color: rgb(0.82, 0.82, 0.82),
  });
  page.drawLine({
    start: { x: leftMargin + col1W + col2W, y: tableTopY },
    end: { x: leftMargin + col1W + col2W, y: tableTopY - headerHeight },
    thickness: 1,
    color: rgb(0.82, 0.82, 0.82),
  });
  page.drawLine({
    start: { x: leftMargin + col1W + col2W + col3W, y: tableTopY },
    end: { x: leftMargin + col1W + col2W + col3W, y: tableTopY - headerHeight },
    thickness: 1,
    color: rgb(0.82, 0.82, 0.82),
  });

  // Header Titles
  page.drawText('Description', { x: leftMargin + 8, y: tableTopY - 15, size: 8.5, font: fontBold, color: rgb(0, 0, 0) });
  page.drawText('Quantity', { x: leftMargin + col1W + 8, y: tableTopY - 15, size: 8.5, font: fontBold, color: rgb(0, 0, 0) });
  page.drawText('Unit Price (INR)', { x: leftMargin + col1W + col2W + 8, y: tableTopY - 15, size: 8.5, font: fontBold, color: rgb(0, 0, 0) });
  page.drawText('Total (INR)', { x: leftMargin + col1W + col2W + col3W + 8, y: tableTopY - 15, size: 8.5, font: fontBold, color: rgb(0, 0, 0) });

  let rowTopY = tableTopY - headerHeight;

  for (const item of data.items) {
    const rowHeight = 34;
    page.drawRectangle({
      x: leftMargin,
      y: rowTopY - rowHeight,
      width: contentWidth,
      height: rowHeight,
      borderColor: rgb(0.82, 0.82, 0.82),
      borderWidth: 1,
      color: rgb(1, 1, 1),
    });

    page.drawLine({
      start: { x: leftMargin + col1W, y: rowTopY },
      end: { x: leftMargin + col1W, y: rowTopY - rowHeight },
      thickness: 1,
      color: rgb(0.82, 0.82, 0.82),
    });
    page.drawLine({
      start: { x: leftMargin + col1W + col2W, y: rowTopY },
      end: { x: leftMargin + col1W + col2W, y: rowTopY - rowHeight },
      thickness: 1,
      color: rgb(0.82, 0.82, 0.82),
    });
    page.drawLine({
      start: { x: leftMargin + col1W + col2W + col3W, y: rowTopY },
      end: { x: leftMargin + col1W + col2W + col3W, y: rowTopY - rowHeight },
      thickness: 1,
      color: rgb(0.82, 0.82, 0.82),
    });

    page.drawText(item.description.slice(0, 48), { x: leftMargin + 8, y: rowTopY - 19, size: 8.5, font: fontRegular, color: rgb(0, 0, 0) });
    
    // Centered / aligned quantity
    page.drawText(String(item.quantity), { x: leftMargin + col1W + 18, y: rowTopY - 19, size: 8.5, font: fontRegular, color: rgb(0, 0, 0) });
    
    // Right-aligned unit price & total
    const unitStr = formatCurrency(item.unitPrice);
    const unitW = fontRegular.widthOfTextAtSize(unitStr, 8.5);
    page.drawText(unitStr, { x: leftMargin + col1W + col2W + col3W - unitW - 10, y: rowTopY - 19, size: 8.5, font: fontRegular, color: rgb(0, 0, 0) });

    const totalStr = formatCurrency(item.totalPrice);
    const totalW = fontRegular.widthOfTextAtSize(totalStr, 8.5);
    page.drawText(totalStr, { x: leftMargin + contentWidth - totalW - 10, y: rowTopY - 19, size: 8.5, font: fontRegular, color: rgb(0, 0, 0) });

    rowTopY -= rowHeight;
  }

  // 6. Financial Summary (Left-Aligned below table)
  currentY = rowTopY - 24;
  page.drawText(`Subtotal: ${formatCurrency(data.subtotal)}`, { x: leftMargin, y: currentY, size: 9.5, font: fontBold, color: rgb(0, 0, 0) });
  currentY -= 14;
  page.drawText(`GST Tax (${data.gstRate}%): ${formatCurrency(data.gstAmount)}`, { x: leftMargin, y: currentY, size: 9.5, font: fontBold, color: rgb(0, 0, 0) });
  currentY -= 14;
  page.drawText(`Total Amount: ${formatCurrency(data.totalAmount)}`, { x: leftMargin, y: currentY, size: 10, font: fontBold, color: rgb(0, 0, 0) });
  currentY -= 14;
  if (data.advanceReceived > 0) {
    page.drawText(`Less: Advance Payment Received: ${formatCurrency(data.advanceReceived)}`, { x: leftMargin, y: currentY, size: 9.5, font: fontBold, color: rgb(0, 0, 0) });
    currentY -= 14;
  }
  page.drawText(`TOTAL DUE: ${formatCurrency(data.totalDue)}/-`, { x: leftMargin, y: currentY, size: 11, font: fontBold, color: rgb(0, 0, 0) });

  // 7. Payment Instructions
  currentY -= 22;
  page.drawText('PAYMENT INSTRUCTIONS', { x: leftMargin, y: currentY, size: 9.5, font: fontBold, color: rgb(0, 0, 0) });
  currentY -= 13;
  page.drawText('Bank Name: HDFC Bank', { x: leftMargin, y: currentY, size: 9, font: fontRegular, color: rgb(0, 0, 0) });
  currentY -= 12;
  page.drawText('Account Name: NISARGSHALA', { x: leftMargin, y: currentY, size: 9, font: fontRegular, color: rgb(0, 0, 0) });
  currentY -= 12;
  page.drawText('Account Number: 50200097103825', { x: leftMargin, y: currentY, size: 9, font: fontRegular, color: rgb(0, 0, 0) });
  currentY -= 12;
  page.drawText('IFSC: HDFC0002493', { x: leftMargin, y: currentY, size: 9, font: fontRegular, color: rgb(0, 0, 0) });
  currentY -= 12;
  page.drawText(`Payment Reference: ${data.referenceNumber}`, { x: leftMargin, y: currentY, size: 9, font: fontRegular, color: rgb(0, 0, 0) });

  // 8. Footer Note
  currentY -= 32;
  page.drawText('We look forward to more such ventures...', { x: leftMargin, y: currentY, size: 9.5, font: fontBold, color: rgb(0, 0, 0) });

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}
