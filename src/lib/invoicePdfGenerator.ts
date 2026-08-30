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
      padding: 50px 45px;
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
      margin-bottom: 25px;
    }
    .logo-box img {
      height: 90px;
      width: auto;
      object-fit: contain;
    }
    .invoice-title {
      font-size: 38px;
      font-weight: 700;
      color: #000000;
      margin: 0;
      text-align: right;
      letter-spacing: -0.5px;
    }
    .address-section {
      margin-bottom: 25px;
    }
    .address-block {
      margin-bottom: 18px;
      font-size: 14px;
      line-height: 1.45;
    }
    .address-block strong {
      font-weight: 600;
    }
    .address-line {
      margin-top: 1px;
      color: #000000;
    }
    .table-container {
      margin-bottom: 25px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      border: 1px solid #d1d5db;
    }
    th {
      border: 1px solid #d1d5db;
      padding: 8px 12px;
      text-align: left;
      font-size: 13px;
      font-weight: 700;
      color: #000000;
      background-color: #ffffff;
    }
    td {
      border: 1px solid #d1d5db;
      padding: 10px 12px;
      color: #000000;
      font-size: 13px;
    }
    .summary-section {
      margin-bottom: 25px;
      font-size: 14px;
      line-height: 1.5;
    }
    .summary-line {
      font-weight: 600;
      margin-bottom: 3px;
      color: #000000;
    }
    .total-due {
      font-size: 15px;
      font-weight: 700;
      margin-top: 5px;
      color: #000000;
    }
    .payment-box {
      margin-top: 25px;
      font-size: 14px;
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
      <div>
        <h1 class="invoice-title">Invoice</h1>
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
        <div class="address-line">Gst No. 27ARHPV2783R1ZN</div>
      </div>

      <div class="address-block">
        <div><strong>To:</strong></div>
        <div class="address-line">${data.companyName} (GST no : ${data.buyerGstin || 'Unregistered'})</div>
        <div class="address-line">Attn: ${data.contactPerson || 'Finance / HR'}</div>
        <div class="address-line">${data.billingAddress || 'Maharashtra, India'}</div>
        <div class="address-line">Date Issued: ${data.invoiceDate}</div>
        <div class="address-line">Due Date: ${data.dueDate}</div>
      </div>
    </div>

    <!-- Items Table -->
    <div class="table-container">
      <table>
        <thead>
          <tr>
            <th style="width: 52%;">Description</th>
            <th style="width: 14%;">Quantity</th>
            <th style="width: 17%;">Unit Price (INR)</th>
            <th style="width: 17%;">Total (INR)</th>
          </tr>
        </thead>
        <tbody>
          ${data.items.map(item => `
            <tr>
              <td>${item.description}</td>
              <td>${item.quantity}</td>
              <td>${formatCurrency(item.unitPrice)}</td>
              <td>${formatCurrency(item.totalPrice)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>

    <!-- Totals Summary -->
    <div class="summary-section">
      <div class="summary-line">Subtotal:${formatCurrency(data.subtotal)}</div>
      <div class="summary-line">Tax (${data.gstRate}%): ${formatCurrency(data.gstAmount)}</div>
      <div class="summary-line">Total: ${formatCurrency(data.totalAmount)}</div>
      ${data.advanceReceived > 0 ? `<div class="summary-line">Less: Advance Payment Received: ${formatCurrency(data.advanceReceived)}</div>` : ''}
      <div class="total-due">Total Due: ${formatCurrency(data.totalDue)}/-</div>
    </div>

    <!-- Payment Instructions -->
    <div class="payment-box">
      <div><strong>Payment Instructions:</strong></div>
      <div class="address-line">Bank Name: HDFC Bank</div>
      <div class="address-line">Account Name: NISARGSHALA</div>
      <div class="address-line">IFSC: HDFC0002493</div>
      <div class="address-line">Account Number: 50200097103825</div>
      <div class="address-line">Reference: ${data.referenceNumber}</div>
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

  // 1. Embed Nisargshala Official Logo
  try {
    const logoPath = path.join(process.cwd(), 'public', 'images', 'nisargshala-logo.png');
    if (fs.existsSync(logoPath)) {
      const logoBytes = fs.readFileSync(logoPath);
      const logoImage = await pdfDoc.embedPng(logoBytes);
      page.drawImage(logoImage, {
        x: 50,
        y: height - 120,
        width: 75,
        height: 75,
      });
    }
  } catch (e) {
    console.warn('Could not embed logo in PDF:', e);
  }

  // 2. Large Bold Title "Invoice"
  page.drawText('Invoice', {
    x: width - 150,
    y: height - 80,
    size: 32,
    font: fontBold,
    color: rgb(0, 0, 0),
  });

  // 3. "From:" section
  let currentY = height - 155;
  page.drawText('From:', { x: 50, y: currentY, size: 9.5, font: fontBold, color: rgb(0, 0, 0) });
  currentY -= 13;
  page.drawText('Nisargshala', { x: 50, y: currentY, size: 9, font: fontRegular, color: rgb(0, 0, 0) });
  currentY -= 12;
  page.drawText('89, Babuji Bungalow,', { x: 50, y: currentY, size: 9, font: fontRegular, color: rgb(0, 0, 0) });
  currentY -= 12;
  page.drawText('Pune - 412115', { x: 50, y: currentY, size: 9, font: fontRegular, color: rgb(0, 0, 0) });
  currentY -= 12;
  page.drawText('Email: hemantvavale@gmail.com', { x: 50, y: currentY, size: 9, font: fontRegular, color: rgb(0, 0, 0) });
  currentY -= 12;
  page.drawText('Gst No. 27ARHPV2783R1ZN', { x: 50, y: currentY, size: 9, font: fontRegular, color: rgb(0, 0, 0) });

  // 4. "To:" section
  currentY -= 20;
  page.drawText('To:', { x: 50, y: currentY, size: 9.5, font: fontBold, color: rgb(0, 0, 0) });
  currentY -= 13;
  const companyGstText = `${data.companyName} (GST no : ${data.buyerGstin || 'Unregistered'})`;
  page.drawText(companyGstText.slice(0, 75), { x: 50, y: currentY, size: 9, font: fontRegular, color: rgb(0, 0, 0) });
  currentY -= 12;
  page.drawText(`Attn: ${data.contactPerson || 'Management'}`.slice(0, 75), { x: 50, y: currentY, size: 9, font: fontRegular, color: rgb(0, 0, 0) });
  currentY -= 12;
  page.drawText((data.billingAddress || 'Maharashtra, India').slice(0, 75), { x: 50, y: currentY, size: 9, font: fontRegular, color: rgb(0, 0, 0) });
  currentY -= 12;
  page.drawText(`Date Issued: ${data.invoiceDate}`, { x: 50, y: currentY, size: 9, font: fontBold, color: rgb(0, 0, 0) });
  currentY -= 12;
  page.drawText(`Due Date: ${data.dueDate}`, { x: 50, y: currentY, size: 9, font: fontBold, color: rgb(0, 0, 0) });

  // 5. Table Section
  currentY -= 24;
  const tableX = 50;
  const tableWidth = width - 100; // 495.28 pt
  const col1W = 235;
  const col2W = 60;
  const col3W = 100;
  const col4W = 100.28;

  const headerHeight = 22;
  const tableTopY = currentY;

  // Header Box & Lines
  page.drawRectangle({
    x: tableX,
    y: tableTopY - headerHeight,
    width: tableWidth,
    height: headerHeight,
    borderColor: rgb(0.8, 0.8, 0.8),
    borderWidth: 1,
    color: rgb(1, 1, 1),
  });

  page.drawLine({
    start: { x: tableX + col1W, y: tableTopY },
    end: { x: tableX + col1W, y: tableTopY - headerHeight },
    thickness: 1,
    color: rgb(0.8, 0.8, 0.8),
  });
  page.drawLine({
    start: { x: tableX + col1W + col2W, y: tableTopY },
    end: { x: tableX + col1W + col2W, y: tableTopY - headerHeight },
    thickness: 1,
    color: rgb(0.8, 0.8, 0.8),
  });
  page.drawLine({
    start: { x: tableX + col1W + col2W + col3W, y: tableTopY },
    end: { x: tableX + col1W + col2W + col3W, y: tableTopY - headerHeight },
    thickness: 1,
    color: rgb(0.8, 0.8, 0.8),
  });

  // Header Titles
  page.drawText('Description', { x: tableX + 8, y: tableTopY - 15, size: 8, font: fontBold, color: rgb(0, 0, 0) });
  page.drawText('Quantity', { x: tableX + col1W + 8, y: tableTopY - 15, size: 8, font: fontBold, color: rgb(0, 0, 0) });
  page.drawText('Unit Price (INR)', { x: tableX + col1W + col2W + 8, y: tableTopY - 15, size: 8, font: fontBold, color: rgb(0, 0, 0) });
  page.drawText('Total (INR)', { x: tableX + col1W + col2W + col3W + 8, y: tableTopY - 15, size: 8, font: fontBold, color: rgb(0, 0, 0) });

  let rowTopY = tableTopY - headerHeight;

  for (const item of data.items) {
    const rowHeight = 32;
    page.drawRectangle({
      x: tableX,
      y: rowTopY - rowHeight,
      width: tableWidth,
      height: rowHeight,
      borderColor: rgb(0.8, 0.8, 0.8),
      borderWidth: 1,
      color: rgb(1, 1, 1),
    });

    page.drawLine({
      start: { x: tableX + col1W, y: rowTopY },
      end: { x: tableX + col1W, y: rowTopY - rowHeight },
      thickness: 1,
      color: rgb(0.8, 0.8, 0.8),
    });
    page.drawLine({
      start: { x: tableX + col1W + col2W, y: rowTopY },
      end: { x: tableX + col1W + col2W, y: rowTopY - rowHeight },
      thickness: 1,
      color: rgb(0.8, 0.8, 0.8),
    });
    page.drawLine({
      start: { x: tableX + col1W + col2W + col3W, y: rowTopY },
      end: { x: tableX + col1W + col2W + col3W, y: rowTopY - rowHeight },
      thickness: 1,
      color: rgb(0.8, 0.8, 0.8),
    });

    page.drawText(item.description.slice(0, 48), { x: tableX + 8, y: rowTopY - 18, size: 8, font: fontRegular, color: rgb(0, 0, 0) });
    page.drawText(String(item.quantity), { x: tableX + col1W + 8, y: rowTopY - 18, size: 8, font: fontRegular, color: rgb(0, 0, 0) });
    page.drawText(formatCurrency(item.unitPrice), { x: tableX + col1W + col2W + 8, y: rowTopY - 18, size: 8, font: fontRegular, color: rgb(0, 0, 0) });
    page.drawText(formatCurrency(item.totalPrice), { x: tableX + col1W + col2W + col3W + 8, y: rowTopY - 18, size: 8, font: fontRegular, color: rgb(0, 0, 0) });

    rowTopY -= rowHeight;
  }

  // 6. Totals Section
  currentY = rowTopY - 24;
  page.drawText(`Subtotal:${formatCurrency(data.subtotal)}`, { x: 50, y: currentY, size: 9.5, font: fontBold, color: rgb(0, 0, 0) });
  currentY -= 14;
  page.drawText(`Tax (${data.gstRate}%): ${formatCurrency(data.gstAmount)}`, { x: 50, y: currentY, size: 9.5, font: fontBold, color: rgb(0, 0, 0) });
  currentY -= 14;
  page.drawText(`Total: ${formatCurrency(data.totalAmount)}`, { x: 50, y: currentY, size: 9.5, font: fontBold, color: rgb(0, 0, 0) });
  currentY -= 14;
  if (data.advanceReceived > 0) {
    page.drawText(`Less: Advance Payment Received: ${formatCurrency(data.advanceReceived)}`, { x: 50, y: currentY, size: 9.5, font: fontBold, color: rgb(0, 0, 0) });
    currentY -= 14;
  }
  page.drawText(`Total Due: ${formatCurrency(data.totalDue)}/-`, { x: 50, y: currentY, size: 9.5, font: fontBold, color: rgb(0, 0, 0) });

  // 7. Payment Instructions
  currentY -= 22;
  page.drawText('Payment Instructions:', { x: 50, y: currentY, size: 9.5, font: fontBold, color: rgb(0, 0, 0) });
  currentY -= 13;
  page.drawText('Bank Name: HDFC Bank', { x: 50, y: currentY, size: 9, font: fontRegular, color: rgb(0, 0, 0) });
  currentY -= 12;
  page.drawText('Account Name: NISARGSHALA', { x: 50, y: currentY, size: 9, font: fontRegular, color: rgb(0, 0, 0) });
  currentY -= 12;
  page.drawText('IFSC: HDFC0002493', { x: 50, y: currentY, size: 9, font: fontRegular, color: rgb(0, 0, 0) });
  currentY -= 12;
  page.drawText('Account Number: 50200097103825', { x: 50, y: currentY, size: 9, font: fontRegular, color: rgb(0, 0, 0) });
  currentY -= 12;
  page.drawText(`Reference: ${data.referenceNumber}`, { x: 50, y: currentY, size: 9, font: fontRegular, color: rgb(0, 0, 0) });

  // 8. Footer Note
  currentY -= 32;
  page.drawText('We look forward to more such ventures...', { x: 50, y: currentY, size: 9.5, font: fontBold, color: rgb(0, 0, 0) });

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}
