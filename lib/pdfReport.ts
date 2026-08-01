import { Platform } from "react-native";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";

export type PDFReportType = "yields" | "payouts" | "manager_summary" | "buyer_procurement" | "farmer_comprehensive";

interface GeneratePDFParams {
  title: string;
  reportType: PDFReportType;
  userName: string;
  userUniqueId?: string;
  periodLabel: string;
  items?: any[];
  yieldsItems?: any[];
  payoutsItems?: any[];
  ordersItems?: any[];
  paymentsItems?: any[];
  extraMetrics?: {
    farmersCount?: number;
    totalHarvestKg?: number;
    totalOrdersCount?: number;
    totalPaymentsKes?: number;
    totalPayoutsKes?: number;
  };
  webPreviewWindow?: Window | null;
}

export function openPdfPreviewWindow(title: string, message: string) {
  if (Platform.OS !== "web" || typeof window === "undefined") {
    return null;
  }

  const previewWindow = window.open("", "_blank");
  if (!previewWindow) {
    return null;
  }

  previewWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>${title}</title>
        <style>
          body {
            margin: 0;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            font-family: Arial, sans-serif;
            color: #125C3F;
            background: #FCF9F8;
          }
          div { text-align: center; }
          h1 { font-size: 20px; margin: 0 0 8px; }
          p { margin: 0; color: #4B5563; }
        </style>
      </head>
      <body>
        <div>
          <h1>${title}</h1>
          <p>${message}</p>
        </div>
      </body>
    </html>
  `);
  previewWindow.document.close();
  return previewWindow;
}

export async function generateAndSharePDF({
  title,
  reportType,
  userName,
  userUniqueId,
  periodLabel,
  items = [],
  yieldsItems = [],
  payoutsItems = [],
  ordersItems = [],
  paymentsItems = [],
  extraMetrics,
  webPreviewWindow,
}: GeneratePDFParams) {
  const generatedAt = new Date().toLocaleString();

  let summaryHtml = "";
  let customBodyContentHtml = "";
  let tableHeadersHtml = "";
  let tableRowsHtml = "";
  let totalRecordsCount = items.length;

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
  } else if (reportType === "farmer_comprehensive") {
    const yList = yieldsItems.length > 0 ? yieldsItems : items;
    const pList = payoutsItems;
    totalRecordsCount = yList.length + pList.length;

    const totalQty = yList.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
    const totalPaidAmount = pList.filter((i) => i.status === "Paid").reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
    const pendingAmount = pList.filter((i) => i.status !== "Paid").reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

    summaryHtml = `
      <div class="kpi-grid">
        <div class="kpi-card">
          <div class="kpi-title">HARVEST UPLOADS</div>
          <div class="kpi-value">${yList.length}</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-title">TOTAL HARVEST (KG)</div>
          <div class="kpi-value">${totalQty.toLocaleString()} kg</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-title">TOTAL PAID (KES)</div>
          <div class="kpi-value" style="color: #2A5C43;">KES ${totalPaidAmount.toLocaleString()}</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-title">PENDING PAYMENTS</div>
          <div class="kpi-value" style="color: #D97706;">KES ${pendingAmount.toLocaleString()}</div>
        </div>
      </div>
    `;

    const yieldsRowsHtml = yList.length > 0
      ? yList
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
          .join("")
      : `<tr><td colspan="7" style="text-align:center; padding: 15px; color: #9CA3AF;">No harvest uploads recorded for this period.</td></tr>`;

    const payoutsRowsHtml = pList.length > 0
      ? pList
          .map((item, index) => `
            <tr class="${index % 2 === 0 ? "even" : ""}">
              <td>${item.reference || `#${String(item.id).substring(0, 8)}`}</td>
              <td style="text-transform: uppercase;">${item.method || "M-PESA"}</td>
              <td style="font-weight: bold; color: #2A5C43;">KES ${Number(item.amount).toLocaleString()}</td>
              <td><span class="badge ${String(item.status).toLowerCase()}">${item.status || "Paid"}</span></td>
              <td>${new Date(item.created_at).toLocaleDateString()}</td>
            </tr>
          `)
          .join("")
      : `<tr><td colspan="5" style="text-align:center; padding: 15px; color: #9CA3AF;">No payout settlements recorded for this period.</td></tr>`;

    customBodyContentHtml = `
      <div style="margin-top: 16px; margin-bottom: 8px;">
        <h3 style="font-size: 14px; font-weight: 800; color: #2A5C43; margin-bottom: 8px; border-bottom: 1px solid #E5E7EB; padding-bottom: 4px;">
          1. HARVEST LOGS & DELIVERIES
        </h3>
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Season / Crop</th>
              <th>Variety</th>
              <th>Grade</th>
              <th>Quantity (kg)</th>
              <th>Status</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            ${yieldsRowsHtml}
          </tbody>
        </table>
      </div>

      <div style="margin-top: 24px; margin-bottom: 8px;">
        <h3 style="font-size: 14px; font-weight: 800; color: #2A5C43; margin-bottom: 8px; border-bottom: 1px solid #E5E7EB; padding-bottom: 4px;">
          2. PAYMENTS & DISBURSEMENTS
        </h3>
        <table>
          <thead>
            <tr>
              <th>Ref / ID</th>
              <th>Method</th>
              <th>Amount (KES)</th>
              <th>Status</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            ${payoutsRowsHtml}
          </tbody>
        </table>
      </div>
    `;
  } else if (reportType === "manager_summary") {
    const harvestList = items;
    const orderList = ordersItems;
    const paymentList = paymentsItems;
    totalRecordsCount = harvestList.length + orderList.length + paymentList.length;

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

    const harvestRowsHtml = harvestList.length > 0
      ? harvestList
          .map((item, index) => `
            <tr class="${index % 2 === 0 ? "even" : ""}">
              <td>#${String(item.id).substring(0, 8)}</td>
              <td><strong>${item.farmer || "Farmer"}</strong></td>
              <td>${item.variety || "Avocado"} (Grade ${item.grade || "A"})</td>
              <td style="font-weight: bold;">${Number(item.quantity || 0).toLocaleString()} kg</td>
              <td><span class="badge ${String(item.status).toLowerCase()}">${item.status || "Pending"}</span></td>
              <td>${new Date(item.created_at).toLocaleDateString()}</td>
            </tr>
          `)
          .join("")
      : `<tr><td colspan="6" style="text-align:center; padding: 15px; color: #9CA3AF;">No harvest records found for this period.</td></tr>`;

    const orderRowsHtml = orderList.length > 0
      ? orderList
          .map((item, index) => `
            <tr class="${index % 2 === 0 ? "even" : ""}">
              <td>#${String(item.id).substring(0, 8)}</td>
              <td><strong>${item.buyer || "Buyer"}</strong></td>
              <td>${item.produce || "Avocado"}</td>
              <td>${Number(item.quantity || 0).toLocaleString()} kg</td>
              <td style="font-weight: bold; color: #2A5C43;">KES ${Number(item.total_amount || 0).toLocaleString()}</td>
              <td><span class="badge ${String(item.status).toLowerCase()}">${item.status || "Processing"}</span></td>
              <td>${new Date(item.created_at).toLocaleDateString()}</td>
            </tr>
          `)
          .join("")
      : `<tr><td colspan="7" style="text-align:center; padding: 15px; color: #9CA3AF;">No buyer orders found for this period.</td></tr>`;

    const paymentRowsHtml = paymentList.length > 0
      ? paymentList
          .map((item, index) => `
            <tr class="${index % 2 === 0 ? "even" : ""}">
              <td>#${String(item.id).substring(0, 8)}</td>
              <td>${item.buyer || "Buyer"}</td>
              <td>${item.farmer || "Unassigned"}</td>
              <td style="font-weight: bold; color: #2A5C43;">KES ${Number(item.amount || 0).toLocaleString()}</td>
              <td><span class="badge ${String(item.status).toLowerCase()}">${item.status || "Pending"}</span></td>
              <td>${new Date(item.created_at).toLocaleDateString()}</td>
            </tr>
          `)
          .join("")
      : `<tr><td colspan="6" style="text-align:center; padding: 15px; color: #9CA3AF;">No payments found for this period.</td></tr>`;

    customBodyContentHtml = `
      <div style="margin-top: 16px; margin-bottom: 20px;">
        <h3 style="font-size: 13px; font-weight: 800; color: #2A5C43; margin-bottom: 8px; border-bottom: 1px solid #E5E7EB; padding-bottom: 4px; letter-spacing: 0.5px;">
          1. HARVEST OPERATIONS
        </h3>
        <table>
          <thead>
            <tr>
              <th>Harvest ID</th>
              <th>Farmer</th>
              <th>Variety / Grade</th>
              <th>Quantity</th>
              <th>Status</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>${harvestRowsHtml}</tbody>
        </table>
      </div>

      <div style="margin-top: 20px; margin-bottom: 20px;">
        <h3 style="font-size: 13px; font-weight: 800; color: #2A5C43; margin-bottom: 8px; border-bottom: 1px solid #E5E7EB; padding-bottom: 4px; letter-spacing: 0.5px;">
          2. BUYER ORDERS
        </h3>
        <table>
          <thead>
            <tr>
              <th>Order Ref</th>
              <th>Buyer</th>
              <th>Produce</th>
              <th>Quantity</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>${orderRowsHtml}</tbody>
        </table>
      </div>

      <div style="margin-top: 20px; margin-bottom: 8px;">
        <h3 style="font-size: 13px; font-weight: 800; color: #2A5C43; margin-bottom: 8px; border-bottom: 1px solid #E5E7EB; padding-bottom: 4px; letter-spacing: 0.5px;">
          3. PAYMENTS
        </h3>
        <table>
          <thead>
            <tr>
              <th>Payment Ref</th>
              <th>Buyer</th>
              <th>Farmer</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>${paymentRowsHtml}</tbody>
        </table>
      </div>
    `;
  } else if (reportType === "buyer_procurement") {
    const totalSpent = items.reduce((sum, item) => sum + (Number(item.total_amount) || 0), 0);
    const totalQty = items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
    const deliveredCount = items.filter((i) => i.status === "Delivered" || i.status === "Dispatched").length;
    const fulfillmentRate = items.length > 0 ? Math.round((deliveredCount / items.length) * 100) : 0;
    const avgPrice = totalQty > 0 ? Math.round(totalSpent / totalQty) : 160;

    const gradeStats: Record<string, { kg: number; kes: number }> = {
      A: { kg: 0, kes: 0 },
      B: { kg: 0, kes: 0 },
      C: { kg: 0, kes: 0 },
    };

    items.forEach((item) => {
      const gRaw = String(item.grade || item.produce || "A").toUpperCase();
      let gKey = "A";
      if (gRaw.includes("GRADE B") || gRaw === "B") gKey = "B";
      else if (gRaw.includes("GRADE C") || gRaw === "C") gKey = "C";

      const qty = Number(item.quantity) || 0;
      const amt = Number(item.total_amount) || (qty * (Number(item.unit_price) || 160));
      gradeStats[gKey].kg += qty;
      gradeStats[gKey].kes += amt;
    });

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
          <div class="kpi-title">FULFILLMENT RATE</div>
          <div class="kpi-value">${fulfillmentRate}% (${deliveredCount}/${items.length})</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-title">AVG PRICE / KG</div>
          <div class="kpi-value">KES ${avgPrice.toLocaleString()}</div>
        </div>
      </div>
    `;

    const gradeRowsHtml = ["A", "B", "C"].map((gKey, idx) => {
      const stat = gradeStats[gKey];
      const share = totalQty > 0 ? Math.round((stat.kg / totalQty) * 100) : 0;
      const gradeAvg = stat.kg > 0 ? Math.round(stat.kes / stat.kg) : (gKey === "A" ? 160 : gKey === "B" ? 110 : 80);
      return `
        <tr class="${idx % 2 === 0 ? "even" : ""}">
          <td><strong>Grade ${gKey} Produce</strong></td>
          <td>${stat.kg.toLocaleString()} kg</td>
          <td><strong>${share}%</strong></td>
          <td style="color: #2A5C43; font-weight: bold;">KES ${stat.kes.toLocaleString()}</td>
          <td>KES ${gradeAvg.toLocaleString()} / kg</td>
        </tr>
      `;
    }).join("");

    const orderRowsHtml = items.length > 0
      ? items
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
          .join("")
      : `<tr><td colspan="7" style="text-align:center; padding: 15px; color: #9CA3AF;">No order transactions recorded for this period.</td></tr>`;

    customBodyContentHtml = `
      <div style="margin-top: 16px; margin-bottom: 20px;">
        <h3 style="font-size: 13px; font-weight: 800; color: #2A5C43; margin-bottom: 8px; border-bottom: 1px solid #E5E7EB; padding-bottom: 4px; letter-spacing: 0.5px;">
          1. QUALITY & GRADE PROCUREMENT STATISTICAL ANALYTICS
        </h3>
        <table>
          <thead>
            <tr>
              <th>Grade Category</th>
              <th>Volume Purchased (kg)</th>
              <th>Volume Share (%)</th>
              <th>Total Expenditure (KES)</th>
              <th>Average Price / kg</th>
            </tr>
          </thead>
          <tbody>
            ${gradeRowsHtml}
          </tbody>
        </table>
      </div>

      <div style="margin-top: 20px; margin-bottom: 8px;">
        <h3 style="font-size: 13px; font-weight: 800; color: #2A5C43; margin-bottom: 8px; border-bottom: 1px solid #E5E7EB; padding-bottom: 4px; letter-spacing: 0.5px;">
          2. ITEMIZED ORDER TRANSACTION LOGS
        </h3>
        <table>
          <thead>
            <tr>
              <th>Order Ref</th>
              <th>Produce Item</th>
              <th>Volume (kg)</th>
              <th>Unit Price (KES)</th>
              <th>Total Amount</th>
              <th>Status</th>
              <th>Order Date</th>
            </tr>
          </thead>
          <tbody>
            ${orderRowsHtml}
          </tbody>
        </table>
      </div>
    `;
  }

  const defaultTableHtml = `
    <table>
      <thead>
        ${tableHeadersHtml}
      </thead>
      <tbody>
        ${items.length > 0 ? tableRowsHtml : `<tr><td colspan="7" style="text-align:center; padding: 20px; color: #9CA3AF;">No records found for this selected period.</td></tr>`}
      </tbody>
    </table>
  `;

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
          <div>Total Listed Records: <span>${totalRecordsCount}</span></div>
        </div>

        ${summaryHtml}

        ${customBodyContentHtml ? customBodyContentHtml : defaultTableHtml}

        <div class="footer">
          <div>Generated via CEMS System</div>
          <div>Page 1 of 1</div>
        </div>
      </body>
    </html>
  `;

  if (Platform.OS === "web") {
    try {
      const { uri } = await Print.printToFileAsync({ html });
      if (uri && webPreviewWindow && !webPreviewWindow.closed) {
        webPreviewWindow.location.href = uri;
        return;
      }
      if (uri && typeof window !== "undefined") {
        const opened = window.open(uri, "_blank");
        if (opened) return;
      }
      if (uri && typeof document !== "undefined") {
        const link = document.createElement("a");
        link.href = uri;
        const cleanTitle = title.replace(/[^a-zA-Z0-9]/g, "_");
        const dateStr = new Date().toISOString().split("T")[0];
        link.download = `${cleanTitle}_${dateStr}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        return;
      }
    } catch (e) {
      console.warn("Web PDF file generation failed, opening HTML report fallback:", e);
    }

    if (webPreviewWindow && !webPreviewWindow.closed) {
      webPreviewWindow.document.open();
      webPreviewWindow.document.write(html);
      webPreviewWindow.document.close();
      return;
    }

    if (typeof window !== "undefined") {
      const reportWindow = window.open("", "_blank");
      if (reportWindow) {
        reportWindow.document.write(html);
        reportWindow.document.close();
        return;
      }
    }

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
