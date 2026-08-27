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

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <title>Tax Invoice - ${data.invoiceNumber}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
    body {
      font-family: 'Inter', Arial, sans-serif;
      color: #1c1c19;
      background: #ffffff;
      margin: 0;
      padding: 40px;
      font-size: 14px;
      line-height: 1.5;
    }
    .invoice-container {
      max-w: 800px;
      margin: 0 auto;
    }
    .header-row {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 30px;
    }
    .logo-box img {
      height: 70px;
      width: auto;
      object-fit: contain;
    }
    .invoice-title {
      font-size: 32px;
      font-weight: 700;
      color: #000000;
      margin: 0;
      text-align: right;
    }
    .invoice-num {
      font-size: 14px;
      color: #555555;
      margin-top: 4px;
      text-align: right;
    }
    .address-section {
      margin-bottom: 30px;
    }
    .address-block {
      margin-bottom: 20px;
    }
    .address-block strong {
      font-size: 15px;
      color: #000000;
    }
    .address-line {
      margin-top: 2px;
      color: #333333;
    }
    .table-container {
      margin-bottom: 30px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      border: 1px solid #cccccc;
    }
    th {
      background-color: #f9f9f9;
      border: 1px solid #cccccc;
      padding: 10px 12px;
      text-align: left;
      font-size: 12px;
      font-weight: 700;
      color: #333333;
    }
    td {
      border: 1px solid #cccccc;
      padding: 12px;
      color: #333333;
    }
    .summary-section {
      margin-bottom: 30px;
    }
    .summary-line {
      font-size: 15px;
      margin-bottom: 4px;
    }
    .summary-line strong {
      color: #000000;
    }
    .total-due {
      font-size: 16px;
      font-weight: 700;
      margin-top: 8px;
      color: #000000;
    }
    .payment-box {
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #eeeeee;
    }
    .payment-box strong {
      font-size: 15px;
      color: #000000;
    }
    .footer-note {
      margin-top: 40px;
      font-weight: 600;
      color: #333333;
    }
  </style>
</head>
<body>
  <div class="invoice-container">
    <!-- Header -->
    <div class="header-row">
      <div class="logo-box">
        <img src="https://lh3.googleusercontent.com/aida/AEtjO1Wo5cE3j5ldDaBxn7DbRwf_3dx_qN03Uhtod9ib84Bqqa7jj-hRdQn-iKqgO19CwqxF0GD9_ZaVNpgSPnBijEAW5xXpvwmyGt6T211W9GB8Xx4mPb-FKpew9BpU4ryU-fQNY-Aqklf7RWKruJldUpEhlKwjOT0HQKvUo3xTyFtavOxCg9SxnardMxlI5VEYGoU1d_Rajw-N9Fp6I9FnjYO96HoITrd6I6I-cWf_YN-aYWaxznqXsUTnoEA" alt="Nisargshala Logo" />
      </div>
      <div>
        <h1 class="invoice-title">Invoice</h1>
        <div class="invoice-num">No: ${data.invoiceNumber}</div>
      </div>
    </div>

    <!-- Seller & Buyer Address -->
    <div class="address-section">
      <div class="address-block">
        <strong>From:</strong><br/>
        <div class="address-line">Nisargshala</div>
        <div class="address-line">89, Babuji Bungalow,</div>
        <div class="address-line">Pune - 412115</div>
        <div class="address-line">Email: hemantvavale@gmail.com</div>
        <div class="address-line">Gst No. <strong>27ARHPV2783R1ZN</strong></div>
      </div>

      <div class="address-block">
        <strong>To:</strong><br/>
        <div class="address-line"><strong>${data.companyName}</strong> (GST no : <strong>${data.buyerGstin}</strong>)</div>
        <div class="address-line">Attn: ${data.contactPerson}</div>
        <div class="address-line">${data.billingAddress || 'Corporate Headquarters'}</div>
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
            <th style="width: 15%; text-align: center;">Quantity</th>
            <th style="width: 17.5%; text-align: right;">Unit Price (INR)</th>
            <th style="width: 17.5%; text-align: right;">Total (INR)</th>
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
      <div class="summary-line"><strong>Subtotal:</strong> ${formatCurrency(data.subtotal)}</div>
      <div class="summary-line"><strong>Tax (${data.gstRate}%):</strong> ${formatCurrency(data.gstAmount)}</div>
      <div class="summary-line"><strong>Total:</strong> ${formatCurrency(data.totalAmount)}</div>
      ${data.advanceReceived > 0 ? `<div class="summary-line"><strong>Less: Advance Payment Received:</strong> ${formatCurrency(data.advanceReceived)}</div>` : ''}
      <div class="total-due"><strong>Total Due:</strong> ${formatCurrency(data.totalDue)}/-</div>
    </div>

    <!-- Payment Instructions -->
    <div class="payment-box">
      <strong>Payment Instructions:</strong><br/>
      <div class="address-line">Bank Name: HDFC Bank</div>
      <div class="address-line">Account Name: NISARGSHALA</div>
      <div class="address-line">IFSC: HDFC0002493</div>
      <div class="address-line">Account Number: 5020097103825</div>
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
