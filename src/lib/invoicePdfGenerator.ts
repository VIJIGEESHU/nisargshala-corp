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
 * Generates a clean PDF binary buffer for the Tax Invoice document.
 */
export function generateTaxInvoicePdfBuffer(data: InvoiceData): Buffer {
  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(amount);

  const itemLines = data.items
    .map(
      (item) =>
        `0 -15 Td (${item.description.replace(/[()]/g, '')} | Qty: ${item.quantity} | Unit: INR ${formatCurrency(item.unitPrice)} | Total: INR ${formatCurrency(item.totalPrice)}) Tj`
    )
    .join('\n');

  const pdfText = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /MediaBox [0 0 595 842] /Contents 6 0 R >>
endobj
4 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>
endobj
5 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
6 0 obj
<< /Length 850 >>
stream
BT
/F1 22 Tf 50 790 Td (TAX INVOICE) Tj
/F2 12 Tf 350 0 Td (No: ${data.invoiceNumber}) Tj
/F2 10 Tf -350 -30 Td (FROM: Nisargshala | 89, Babuji Bungalow, Pune - 412115 | Email: hemantvavale@gmail.com) Tj
/F1 10 Tf 0 -15 Td (Seller GSTIN: 27ARHPV2783R1ZN) Tj
/F2 10 Tf 0 -25 Td (TO: ${data.companyName.replace(/[()]/g, '')} | Attn: ${data.contactPerson.replace(/[()]/g, '')}) Tj
/F1 10 Tf 0 -15 Td (Buyer GSTIN: ${data.buyerGstin}) Tj
/F2 10 Tf 0 -15 Td (Address: ${data.billingAddress.replace(/[()]/g, '')}) Tj
/F2 10 Tf 0 -15 Td (Date Issued: ${data.invoiceDate}   |   Due Date: ${data.dueDate}) Tj
/F1 12 Tf 0 -30 Td (INVOICE ITEMS) Tj
/F2 10 Tf
${itemLines}
/F1 11 Tf 0 -30 Td (Subtotal: INR ${formatCurrency(data.subtotal)}) Tj
/F1 11 Tf 0 -15 Td (GST Tax (${data.gstRate}%): INR ${formatCurrency(data.gstAmount)}) Tj
/F1 13 Tf 0 -18 Td (Total Amount: INR ${formatCurrency(data.totalAmount)}) Tj
/F2 10 Tf 0 -15 Td (Less: Advance Received: INR ${formatCurrency(data.advanceReceived)}) Tj
/F1 14 Tf 0 -20 Td (TOTAL DUE: INR ${formatCurrency(data.totalDue)}/-) Tj
/F1 11 Tf 0 -35 Td (PAYMENT INSTRUCTIONS) Tj
/F2 10 Tf 0 -15 Td (Bank Name: HDFC Bank   |   Account Name: NISARGSHALA) Tj
/F2 10 Tf 0 -15 Td (Account Number: 5020097103825   |   IFSC: HDFC0002493) Tj
/F2 10 Tf 0 -15 Td (Payment Reference: ${data.referenceNumber}) Tj
ET
endstream
endobj
xref
0 7
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000245 00000 n 
0000000320 00000 n 
0000000390 00000 n 
trailer
<< /Size 7 /Root 1 0 R >>
startxref
1290
%%EOF`;

  return Buffer.from(pdfText);
}
