import { Platform } from "react-native";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";

export type PDFReportType = "yields" | "payouts" | "manager_summary" | "buyer_procurement";

interface GeneratePDFParams {
  title: string;
  reportType: PDFReportType;
  userName: string;
  userUniqueId?: string;
  periodLabel: string;
  items: any[];
  extraMetrics?: {
    farmersCount?: number;
    totalHarvestKg?: number;
    totalOrdersCount?: number;
    totalPaymentsKes?: number;
    totalPayoutsKes?: number;
  };
}

export async function generateAndSharePDF({
  title,
  reportType,
  userName,
  userUniqueId,
  periodLabel,
  items,
  extraMetrics,
}: GeneratePDFParams) {
  const generatedAt = new Date().toLocaleString();

  let summaryHtml = "";
  let tableHeadersHtml = "";
  let tableRowsHtml = "";

  if (reportType === "yields") {
    const totalQty = items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
    const verifiedCount = items.filter((i) => i.status === "Verified" || i.status === "Approved").length;

    summaryHtml = `
      <div class="kpi-grid">
        <div class="kpi-card">
          <div class="kpi-title">TOTAL UPLOADS</div>
          <div class="kpi-value">${items.length}</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-title">TOTAL QUANTITY</div>
          <div class="kpi-value">${totalQty.toLocaleString()} kg</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-title">VERIFIED HARVESTS</div>
          <div class="kpi-value">${verifiedCount}</div>
        </div>
      </div>
    `;

    tableHeadersHtml = `
      <tr>
        <th>ID</th>
        <th>Season / Crop</th>
        <th>Variety</th>
        <th>Grade</th>
        <th>Quantity (kg)</th>
        <th>Status</th>
        <th>Date</th>
      </tr>
    `;

    tableRowsHtml = items
      .map((item, index) => `
        <tr class="${index % 2 === 0 ? "even" : ""}">
          <td>#${String(item.id).substring(0, 8)}</td>
          <td>${item.crop_season || "N/A"}</td>
          <td>${item.variety || "Avocado"}</td>
          <td>Grade ${item.grade || "A"}</td>
          <td style="font-weight: bold;">${Number(item.quantity).toLocaleString()} kg</td>
          <td><span class="badge ${String(item.status).toLowerCase()}">${item.status || "Logged"}</span></td>
          <td>${new Date(item.created_at).toLocaleDateString()}</td>
        </tr>
      `)
      .join("");
  } else if (reportType === "payouts") {
    const totalAmount = items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
    const paidCount = items.filter((i) => i.status === "Paid" || i.status === "Verified").length;
    const processingCount = items.filter((i) => i.status === "Processing" || i.status === "Pending").length;

    summaryHtml = `
      <div class="kpi-grid">
        <div class="kpi-card">
          <div class="kpi-title">TOTAL DISBURSED</div>
          <div class="kpi-value" style="color: #2A5C43;">KES ${totalAmount.toLocaleString()}</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-title">PAID TRANSACTIONS</div>
          <div class="kpi-value">${paidCount}</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-title">PENDING / PROCESSING</div>
          <div class="kpi-value">${processingCount}</div>
        </div>
      </div>
    `;

    tableHeadersHtml = `
      <tr>
        <th>Ref / ID</th>
        <th>Recipient</th>
        <th>Method</th>
        <th>Amount (KES)</th>
        <th>Status</th>
        <th>Date</th>
      </tr>
    `;

    tableRowsHtml = items
      .map((item, index) => `
        <tr class="${index % 2 === 0 ? "even" : ""}">
          <td>${item.reference || `#${String(item.id).substring(0, 8)}`}</td>
          <td>${item.farmer || item.recipient || userName}</td>
          <td style="text-transform: uppercase;">${item.method || "M-PESA"}</td>
          <td style="font-weight: bold; color: #2A5C43;">KES ${Number(item.amount).toLocaleString()}</td>
          <td><span class="badge ${String(item.status).toLowerCase()}">${item.status || "Paid"}</span></td>
          <td>${new Date(item.created_at).toLocaleDateString()}</td>
        </tr>
      `)
      .join("");
  } else if (reportType === "manager_summary") {
    const farmersCount = extraMetrics?.farmersCount || 0;
    const totalHarvestKg = extraMetrics?.totalHarvestKg || 0;
    const totalOrdersCount = extraMetrics?.totalOrdersCount || 0;
    const totalPaymentsKes = extraMetrics?.totalPaymentsKes || 0;

    summaryHtml = `
      <div class="kpi-grid">
        <div class="kpi-card">
          <div class="kpi-title">ACTIVE FARMERS</div>
          <div class="kpi-value">${farmersCount}</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-title">HARVEST VOLUME</div>
          <div class="kpi-value">${totalHarvestKg.toLocaleString()} kg</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-title">BUYER ORDERS</div>
          <div class="kpi-value">${totalOrdersCount}</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-title">GROSS REVENUE</div>
          <div class="kpi-value" style="color: #2A5C43;">KES ${totalPaymentsKes.toLocaleString()}</div>
        </div>
      </div>
    `;

    tableHeadersHtml = `
      <tr>
        <th>Harvest ID</th>
        <th>Farmer Name</th>
        <th>Variety / Grade</th>
        <th>Quantity (kg)</th>
        <th>Status</th>
        <th>Submitted Date</th>
      </tr>
    `;

    tableRowsHtml = items
      .map((item, index) => `
        <tr class="${index % 2 === 0 ? "even" : ""}">
          <td>#${String(item.id).substring(0, 8)}</td>
          <td><strong>${item.farmer || "Farmer"}</strong></td>
          <td>${item.variety || "Avocado"} (Grade ${item.grade || "A"})</td>
          <td style="font-weight: bold;">${Number(item.quantity).toLocaleString()} kg</td>
          <td><span class="badge ${String(item.status).toLowerCase()}">${item.status || "Pending"}</span></td>
          <td>${new Date(item.created_at).toLocaleDateString()}</td>
        </tr>
      `)
      .join("");
  } else if (reportType === "buyer_procurement") {
    const totalSpent = items.reduce((sum, item) => sum + (Number(item.total_amount) || 0), 0);
    const totalQty = items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
    const deliveredCount = items.filter((i) => i.status === "Delivered" || i.status === "Dispatched").length;

    summaryHtml = `
      <div class="kpi-grid">
        <div class="kpi-card">
          <div class="kpi-title">TOTAL EXPENDITURE</div>
          <div class="kpi-value" style="color: #2A5C43;">KES ${totalSpent.toLocaleString()}</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-title">PRODUCE PURCHASED</div>
          <div class="kpi-value">${totalQty.toLocaleString()} kg</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-title">FULFILLED ORDERS</div>
          <div class="kpi-value">${deliveredCount}</div>
        </div>
      </div>
    `;

    tableHeadersHtml = `
      <tr>
        <th>Order Ref</th>
        <th>Produce Item</th>
        <th>Volume (kg)</th>
        <th>Unit Price (KES)</th>
        <th>Total Amount</th>
        <th>Status</th>
        <th>Order Date</th>
      </tr>
    `;

    tableRowsHtml = items
      .map((item, index) => `
        <tr class="${index % 2 === 0 ? "even" : ""}">
          <td>#${String(item.id).substring(0, 8)}</td>
          <td><strong>${item.produce || "Avocado (Hass)"}</strong></td>
          <td>${Number(item.quantity).toLocaleString()} kg</td>
          <td>KES ${Number(item.unit_price || 160).toLocaleString()} / kg</td>
          <td style="font-weight: bold; color: #2A5C43;">KES ${Number(item.total_amount).toLocaleString()}</td>
          <td><span class="badge ${String(item.status).toLowerCase()}">${item.status || "Processing"}</span></td>
          <td>${new Date(item.created_at).toLocaleDateString()}</td>
        </tr>
      `)
      .join("");
  }

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>${title}</title>
        <style>
          body {
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            padding: 24px;
            color: #1F2937;
            background-color: #FFFFFF;
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 2px solid #2A5C43;
            padding-bottom: 16px;
            margin-bottom: 20px;
          }
          .brand-title {
            font-size: 22px;
            font-weight: 900;
            color: #2A5C43;
            letter-spacing: 0.5px;
          }
          .brand-sub {
            font-size: 12px;
            color: #6B7280;
            margin-top: 2px;
          }
          .report-meta {
            text-align: right;
            font-size: 11px;
            color: #4B5563;
          }
          .meta-title {
            font-size: 16px;
            font-weight: 800;
            color: #111827;
            margin-bottom: 4px;
          }
          .user-card {
            background-color: #F9FAFB;
            border: 1px solid #E5E7EB;
            border-radius: 8px;
            padding: 12px 16px;
            margin-bottom: 20px;
            display: flex;
            justify-content: space-between;
            font-size: 12px;
          }
          .user-card span {
            font-weight: 700;
            color: #111827;
          }
          .kpi-grid {
            display: flex;
            gap: 12px;
            margin-bottom: 24px;
          }
          .kpi-card {
            flex: 1;
            background-color: #F3F4F6;
            border-radius: 8px;
            padding: 12px;
            border-left: 4px solid #2A5C43;
          }
          .kpi-title {
            font-size: 10px;
            font-weight: 800;
            color: #6B7280;
            letter-spacing: 0.5px;
            margin-bottom: 4px;
          }
          .kpi-value {
            font-size: 18px;
            font-weight: 900;
            color: #111827;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            font-size: 12px;
            margin-top: 8px;
          }
          th {
            background-color: #2A5C43;
            color: #FFFFFF;
            font-weight: 700;
            text-align: left;
            padding: 10px 12px;
          }
          td {
            padding: 10px 12px;
            border-bottom: 1px solid #E5E7EB;
          }
          tr.even {
            background-color: #F9FAFB;
          }
          .badge {
            padding: 4px 8px;
            border-radius: 12px;
            font-size: 10px;
            font-weight: 800;
            text-transform: uppercase;
            display: inline-block;
          }
          .badge.logged, .badge.processing { background-color: #E0F2FE; color: #0369A1; }
          .badge.verified, .badge.paid, .badge.approved, .badge.delivered { background-color: #DCFCE7; color: #15803D; }
          .badge.pending, .badge.scheduled, .badge.dispatched { background-color: #FEF3C7; color: #B45309; }
          .badge.rejected { background-color: #FEE2E2; color: #991B1B; }
          .footer {
            margin-top: 32px;
            border-top: 1px solid #E5E7EB;
            padding-top: 12px;
            font-size: 10px;
            color: #9CA3AF;
            display: flex;
            justify-content: space-between;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="brand-title">CEMS PRODUCE SYSTEM</div>
            <div class="brand-sub">Official Activity & Financial Statement</div>
          </div>
          <div class="report-meta">
            <div class="meta-title">${title}</div>
            <div>Period: <strong>${periodLabel}</strong></div>
            <div>Generated: ${generatedAt}</div>
          </div>
        </div>

        <div class="user-card">
          <div>Report Prepared For: <span>${userName}</span> ${userUniqueId ? `(ID: <span>${userUniqueId}</span>)` : ""}</div>
          <div>Total Listed Records: <span>${items.length}</span></div>
        </div>

        ${summaryHtml}

        <table>
          <thead>
            ${tableHeadersHtml}
          </thead>
          <tbody>
            ${items.length > 0 ? tableRowsHtml : `<tr><td colspan="7" style="text-align:center; padding: 20px; color: #9CA3AF;">No records found for this selected period.</td></tr>`}
          </tbody>
        </table>

        <div class="footer">
          <div>Generated via CEMS System</div>
          <div>Page 1 of 1</div>
        </div>
      </body>
    </html>
  `;

  if (Platform.OS === "web") {
    await Print.printAsync({ html });
    return;
  }

  const { uri } = await Print.printToFileAsync({ html });
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, {
      UTI: ".pdf",
      mimeType: "application/pdf",
      dialogTitle: `Share ${title}`,
    });
  }
}
