import PDFDocument from 'pdfkit';
import ExcelJS from 'exceljs';

// ══════════════════════════════════════════════════
//  PDF GENERATION
// ══════════════════════════════════════════════════
export function generatePDF(title, columns, rows, dateRange) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 40, size: 'A4', layout: 'landscape' });
      const chunks = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Header
      doc.fontSize(20).font('Helvetica-Bold').text('Fund Mate', { align: 'center' });
      doc.moveDown(0.3);
      doc.fontSize(14).font('Helvetica').text(title, { align: 'center' });
      doc.moveDown(0.3);
      doc.fontSize(9).fillColor('#666666')
        .text(`Generated: ${new Date().toLocaleDateString('en-ZA', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`, { align: 'center' });
      if (dateRange) {
        doc.text(`Period: ${dateRange.start} to ${dateRange.end}`, { align: 'center' });
      }
      doc.moveDown(0.5);

      // Summary
      doc.fontSize(10).fillColor('#333333').text(`Total Records: ${rows.length}`, { align: 'left' });
      doc.moveDown(0.5);

      // Table
      const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
      const colWidth = pageWidth / columns.length;
      const startX = doc.page.margins.left;
      let y = doc.y;

      // Table header
      doc.rect(startX, y, pageWidth, 22).fill('#1a5632');
      columns.forEach((col, i) => {
        doc.fontSize(8).font('Helvetica-Bold').fillColor('#ffffff')
          .text(col.header, startX + i * colWidth + 4, y + 6, { width: colWidth - 8, align: 'left' });
      });
      y += 22;

      // Table rows
      rows.forEach((row, rowIndex) => {
        // Check if we need a new page
        if (y > doc.page.height - 60) {
          doc.addPage();
          y = doc.page.margins.top;
          // Repeat header on new page
          doc.rect(startX, y, pageWidth, 22).fill('#1a5632');
          columns.forEach((col, i) => {
            doc.fontSize(8).font('Helvetica-Bold').fillColor('#ffffff')
              .text(col.header, startX + i * colWidth + 4, y + 6, { width: colWidth - 8, align: 'left' });
          });
          y += 22;
        }

        const bgColor = rowIndex % 2 === 0 ? '#f9f9f9' : '#ffffff';
        doc.rect(startX, y, pageWidth, 20).fill(bgColor);

        columns.forEach((col, i) => {
          const value = row[col.key] != null ? String(row[col.key]) : '';
          doc.fontSize(7).font('Helvetica').fillColor('#333333')
            .text(value, startX + i * colWidth + 4, y + 5, { width: colWidth - 8, align: 'left' });
        });
        y += 20;
      });

      // Border around table
      const tableHeight = y - (doc.y - (rows.length * 20 + 22));
      doc.strokeColor('#cccccc').lineWidth(0.5);

      // Footer
      doc.moveDown(2);
      doc.fontSize(8).fillColor('#999999')
        .text('This report was generated automatically by Fund Mate System.', startX, doc.page.height - 40, { align: 'center' });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

// ══════════════════════════════════════════════════
//  EXCEL GENERATION
// ══════════════════════════════════════════════════
export async function generateExcel(title, columns, rows, dateRange) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Fund Mate';
  workbook.created = new Date();

  const sheet = workbook.addWorksheet(title.substring(0, 31));

  // Title row
  sheet.mergeCells(1, 1, 1, columns.length);
  const titleCell = sheet.getCell('A1');
  titleCell.value = `Fund Mate - ${title}`;
  titleCell.font = { size: 14, bold: true, color: { argb: 'FF1a5632' } };
  titleCell.alignment = { horizontal: 'center' };

  // Date row
  sheet.mergeCells(2, 1, 2, columns.length);
  const dateCell = sheet.getCell('A2');
  dateCell.value = dateRange
    ? `Period: ${dateRange.start} to ${dateRange.end} | Generated: ${new Date().toLocaleDateString('en-ZA')}`
    : `Generated: ${new Date().toLocaleDateString('en-ZA')}`;
  dateCell.font = { size: 10, italic: true, color: { argb: 'FF666666' } };
  dateCell.alignment = { horizontal: 'center' };

  // Empty row
  sheet.addRow([]);

  // Header row (row 4)
  const headerRow = sheet.addRow(columns.map(c => c.header));
  headerRow.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 10 };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1a5632' } };
    cell.alignment = { horizontal: 'left', vertical: 'middle' };
    cell.border = {
      top: { style: 'thin' }, bottom: { style: 'thin' },
      left: { style: 'thin' }, right: { style: 'thin' },
    };
  });

  // Data rows
  rows.forEach((row, idx) => {
    const dataRow = sheet.addRow(columns.map(c => row[c.key] != null ? row[c.key] : ''));
    dataRow.eachCell((cell) => {
      cell.border = {
        top: { style: 'thin' }, bottom: { style: 'thin' },
        left: { style: 'thin' }, right: { style: 'thin' },
      };
      if (idx % 2 === 0) {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF5F5F5' } };
      }
    });
  });

  // Auto-fit columns
  columns.forEach((col, i) => {
    const maxLen = Math.max(
      col.header.length,
      ...rows.map(r => String(r[col.key] || '').length)
    );
    sheet.getColumn(i + 1).width = Math.min(Math.max(maxLen + 2, 10), 35);
  });

  // Summary row
  sheet.addRow([]);
  const summaryRow = sheet.addRow([`Total Records: ${rows.length}`]);
  summaryRow.getCell(1).font = { bold: true, size: 10 };

  return await workbook.xlsx.writeBuffer();
}

// ══════════════════════════════════════════════════
//  CSV GENERATION
// ══════════════════════════════════════════════════
export function generateCSV(columns, rows) {
  const headers = columns.map(c => `"${c.header}"`).join(',');
  const dataRows = rows.map(row =>
    columns.map(c => {
      const val = row[c.key] != null ? String(row[c.key]) : '';
      // Escape quotes and wrap in quotes
      return `"${val.replace(/"/g, '""')}"`;
    }).join(',')
  );
  return [headers, ...dataRows].join('\n');
}

// ══════════════════════════════════════════════════
//  COLUMN DEFINITIONS
// ══════════════════════════════════════════════════
export const REPORT_COLUMNS = {
  contributions: [
    { key: 'id', header: 'ID' },
    { key: 'full_name', header: 'Member' },
    { key: 'stokvel_name', header: 'Stokvel' },
    { key: 'amount', header: 'Amount (R)' },
    { key: 'status', header: 'Status' },
    { key: 'payment_method', header: 'Payment Method' },
    { key: 'reference', header: 'Reference' },
    { key: 'created_at', header: 'Date' },
  ],
  loans: [
    { key: 'id', header: 'ID' },
    { key: 'full_name', header: 'Member' },
    { key: 'stokvel_name', header: 'Stokvel' },
    { key: 'amount', header: 'Principal (R)' },
    { key: 'interest', header: 'Interest (R)' },
    { key: 'total_repayable', header: 'Total (R)' },
    { key: 'status', header: 'Status' },
    { key: 'borrowed_date', header: 'Borrowed Date' },
    { key: 'due_date', header: 'Due Date' },
    { key: 'repaid_date', header: 'Repaid Date' },
  ],
  users: [
    { key: 'id', header: 'ID' },
    { key: 'full_name', header: 'Full Name' },
    { key: 'email', header: 'Email' },
    { key: 'phone', header: 'Phone' },
    { key: 'status', header: 'Status' },
    { key: 'role', header: 'Role' },
    { key: 'created_at', header: 'Registered' },
  ],
  stokvels: [
    { key: 'id', header: 'ID' },
    { key: 'name', header: 'Name' },
    { key: 'type', header: 'Type' },
    { key: 'target_amount', header: 'Target (R)' },
    { key: 'member_count', header: 'Members' },
    { key: 'total_contributions', header: 'Total Contributions (R)' },
    { key: 'cycle', header: 'Cycle' },
    { key: 'status', header: 'Status' },
  ],
  payments: [
    { key: 'id', header: 'ID' },
    { key: 'full_name', header: 'Member' },
    { key: 'stokvel_name', header: 'Stokvel' },
    { key: 'amount', header: 'Amount (R)' },
    { key: 'payment_method', header: 'Method' },
    { key: 'reference', header: 'Reference' },
    { key: 'status', header: 'Status' },
    { key: 'created_at', header: 'Date' },
  ],
  financial: [
    { key: 'metric', header: 'Metric' },
    { key: 'value', header: 'Value' },
  ],
  deleted: [
    { key: 'id', header: 'ID' },
    { key: 'full_name', header: 'Full Name' },
    { key: 'email', header: 'Email' },
    { key: 'phone', header: 'Phone' },
    { key: 'delete_reason', header: 'Reason' },
    { key: 'deleted_by_name', header: 'Deleted By' },
    { key: 'deleted_at', header: 'Deleted At' },
  ],
};

// Format date for display
function formatDate(val) {
  if (!val) return '';
  try {
    return new Date(val).toLocaleDateString('en-ZA', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch { return String(val); }
}

// Format monetary amounts
function formatAmount(val) {
  if (val == null) return '';
  const num = parseFloat(val);
  return isNaN(num) ? String(val) : num.toFixed(2);
}

// Clean up row data for display
export function formatRowData(rows, reportType) {
  return rows.map(row => {
    const formatted = { ...row };
    // Format dates
    ['created_at', 'borrowed_date', 'due_date', 'repaid_date', 'deleted_at', 'confirmed_at', 'last_active', 'joined_date'].forEach(key => {
      if (formatted[key]) formatted[key] = formatDate(formatted[key]);
    });
    // Format amounts
    ['amount', 'interest', 'total_repayable', 'target_amount', 'total_contributions'].forEach(key => {
      if (formatted[key] != null) formatted[key] = formatAmount(formatted[key]);
    });
    return formatted;
  });
}
