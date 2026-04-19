import { REPORT_EXPORT_FORMATS } from "../constants/report.js";
import { ApiError } from "./ApiError.js";
import { formatDateTime } from "./report-date.js";

function stringifyValue(value) {
  if (value === null || value === undefined || value === "") {
    return "";
  }

  if (value instanceof Date) {
    return formatDateTime(value);
  }

  if (typeof value === "object") {
    return JSON.stringify(value);
  }

  return String(value);
}

function sanitizeFileNamePart(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function csvEscape(value) {
  const stringValue = stringifyValue(value);

  if (/[",\n]/.test(stringValue)) {
    return `"${stringValue.replace(/"/g, "\"\"")}"`;
  }

  return stringValue;
}

function xmlEscape(value) {
  return stringifyValue(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function escapePdfText(value) {
  return stringifyValue(value)
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)");
}

function normalizeSections(report) {
  return Array.isArray(report.data?.sections) ? report.data.sections : [];
}

function buildSectionTextLines(report) {
  const lines = [
    report.title,
    `Type: ${report.type}`,
    `Generated At: ${formatDateTime(report.createdAt)}`,
    `Period: ${formatDateTime(report.periodStart)} to ${formatDateTime(report.periodEnd)}`
  ];

  for (const section of normalizeSections(report)) {
    lines.push("");
    lines.push(section.title);

    if (section.kind === "kv") {
      for (const row of section.rows ?? []) {
        lines.push(`${row.label}: ${stringifyValue(row.value)}`);
      }
    }

    if (section.kind === "table") {
      lines.push((section.columns ?? []).join(" | "));

      for (const row of section.rows ?? []) {
        const values = Array.isArray(row)
          ? row
          : (section.columns ?? []).map((column) => row?.[column] ?? "");

        lines.push(values.map((value) => stringifyValue(value)).join(" | "));
      }
    }
  }

  return lines;
}

function wrapTextLine(line, maxLength = 95) {
  if (line.length <= maxLength) {
    return [line];
  }

  const wrapped = [];
  let remaining = line;

  while (remaining.length > maxLength) {
    const slice = remaining.slice(0, maxLength + 1);
    const breakIndex = Math.max(slice.lastIndexOf(" "), 0);
    const endIndex = breakIndex > 0 ? breakIndex : maxLength;
    wrapped.push(remaining.slice(0, endIndex).trim());
    remaining = remaining.slice(endIndex).trim();
  }

  if (remaining) {
    wrapped.push(remaining);
  }

  return wrapped;
}

function buildPdfBuffer(title, lines) {
  const pageHeight = 842;
  const startX = 48;
  const startY = pageHeight - 52;
  const lineHeight = 14;
  const maxLinesPerPage = 50;
  const wrappedLines = lines.flatMap((line) => wrapTextLine(line));
  const pages = [];

  for (let index = 0; index < wrappedLines.length; index += maxLinesPerPage) {
    pages.push(wrappedLines.slice(index, index + maxLinesPerPage));
  }

  const pageIds = [];
  const contentIds = [];
  let nextId = 4;

  for (let index = 0; index < pages.length; index += 1) {
    pageIds.push(nextId);
    contentIds.push(nextId + 1);
    nextId += 2;
  }

  const objects = new Map();

  objects.set(1, "<< /Type /Catalog /Pages 2 0 R >>");
  objects.set(
    2,
    `<< /Type /Pages /Count ${pages.length} /Kids [${pageIds
      .map((pageId) => `${pageId} 0 R`)
      .join(" ")}] >>`
  );
  objects.set(3, "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");

  pages.forEach((pageLines, index) => {
    const content = [
      "BT",
      "/F1 11 Tf",
      `${lineHeight} TL`,
      `1 0 0 1 ${startX} ${startY} Tm`,
      `(${escapePdfText(title)}) Tj`,
      "T*"
    ];

    pageLines.forEach((line) => {
      content.push(`(${escapePdfText(line)}) Tj`);
      content.push("T*");
    });

    content.push("ET");

    const contentString = content.join("\n");
    const contentId = contentIds[index];
    const pageId = pageIds[index];

    objects.set(
      contentId,
      `<< /Length ${Buffer.byteLength(contentString, "utf8")} >>\nstream\n${contentString}\nendstream`
    );
    objects.set(
      pageId,
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 3 0 R >> >> /Contents ${contentId} 0 R >>`
    );
  });

  let pdf = "%PDF-1.4\n";
  const offsets = [0];

  for (let id = 1; id < nextId; id += 1) {
    offsets[id] = Buffer.byteLength(pdf, "utf8");
    pdf += `${id} 0 obj\n${objects.get(id)}\nendobj\n`;
  }

  const xrefOffset = Buffer.byteLength(pdf, "utf8");
  pdf += `xref\n0 ${nextId}\n0000000000 65535 f \n`;

  for (let id = 1; id < nextId; id += 1) {
    pdf += `${String(offsets[id]).padStart(10, "0")} 00000 n \n`;
  }

  pdf += `trailer\n<< /Size ${nextId} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  return Buffer.from(pdf, "utf8");
}

function buildCsvBuffer(report) {
  const lines = [
    [report.title],
    [`Type`, report.type],
    [`Generated At`, formatDateTime(report.createdAt)],
    [`Period Start`, formatDateTime(report.periodStart)],
    [`Period End`, formatDateTime(report.periodEnd)],
    []
  ];

  for (const section of normalizeSections(report)) {
    lines.push([section.title]);

    if (section.kind === "kv") {
      lines.push(["Label", "Value"]);

      for (const row of section.rows ?? []) {
        lines.push([row.label, row.value]);
      }
    }

    if (section.kind === "table") {
      lines.push(section.columns ?? []);

      for (const row of section.rows ?? []) {
        lines.push(Array.isArray(row) ? row : (section.columns ?? []).map((column) => row?.[column]));
      }
    }

    lines.push([]);
  }

  return Buffer.from(lines.map((line) => line.map(csvEscape).join(",")).join("\n"), "utf8");
}

function buildExcelBuffer(report) {
  const rows = [];

  rows.push(`<Row><Cell ss:StyleID="header"><Data ss:Type="String">${xmlEscape(report.title)}</Data></Cell></Row>`);
  rows.push(`<Row><Cell><Data ss:Type="String">Type</Data></Cell><Cell><Data ss:Type="String">${xmlEscape(report.type)}</Data></Cell></Row>`);
  rows.push(`<Row><Cell><Data ss:Type="String">Generated At</Data></Cell><Cell><Data ss:Type="String">${xmlEscape(formatDateTime(report.createdAt))}</Data></Cell></Row>`);
  rows.push(`<Row><Cell><Data ss:Type="String">Period Start</Data></Cell><Cell><Data ss:Type="String">${xmlEscape(formatDateTime(report.periodStart))}</Data></Cell></Row>`);
  rows.push(`<Row><Cell><Data ss:Type="String">Period End</Data></Cell><Cell><Data ss:Type="String">${xmlEscape(formatDateTime(report.periodEnd))}</Data></Cell></Row>`);
  rows.push("<Row />");

  for (const section of normalizeSections(report)) {
    rows.push(`<Row><Cell ss:StyleID="header"><Data ss:Type="String">${xmlEscape(section.title)}</Data></Cell></Row>`);

    if (section.kind === "kv") {
      rows.push("<Row><Cell ss:StyleID=\"subheader\"><Data ss:Type=\"String\">Label</Data></Cell><Cell ss:StyleID=\"subheader\"><Data ss:Type=\"String\">Value</Data></Cell></Row>");

      for (const row of section.rows ?? []) {
        rows.push(
          `<Row><Cell><Data ss:Type="String">${xmlEscape(row.label)}</Data></Cell><Cell><Data ss:Type="String">${xmlEscape(row.value)}</Data></Cell></Row>`
        );
      }
    }

    if (section.kind === "table") {
      rows.push(
        `<Row>${(section.columns ?? [])
          .map(
            (column) =>
              `<Cell ss:StyleID="subheader"><Data ss:Type="String">${xmlEscape(column)}</Data></Cell>`
          )
          .join("")}</Row>`
      );

      for (const row of section.rows ?? []) {
        const values = Array.isArray(row)
          ? row
          : (section.columns ?? []).map((column) => row?.[column]);

        rows.push(
          `<Row>${values
            .map(
              (value) =>
                `<Cell><Data ss:Type="String">${xmlEscape(stringifyValue(value))}</Data></Cell>`
            )
            .join("")}</Row>`
        );
      }
    }

    rows.push("<Row />");
  }

  const xml = `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
  <Styles>
    <Style ss:ID="header"><Font ss:Bold="1" ss:Size="13" /></Style>
    <Style ss:ID="subheader"><Font ss:Bold="1" /></Style>
  </Styles>
  <Worksheet ss:Name="Report">
    <Table>
      ${rows.join("\n")}
    </Table>
  </Worksheet>
</Workbook>`;

  return Buffer.from(xml, "utf8");
}

export function buildReportExport(report, format) {
  const fileNameBase = sanitizeFileNamePart(`${report.type}-${report.title}`) || "report";

  switch (format) {
    case REPORT_EXPORT_FORMATS.CSV:
      return {
        buffer: buildCsvBuffer(report),
        contentType: "text/csv; charset=utf-8",
        extension: "csv",
        fileName: `${fileNameBase}.csv`
      };
    case REPORT_EXPORT_FORMATS.EXCEL:
      return {
        buffer: buildExcelBuffer(report),
        contentType: "application/vnd.ms-excel",
        extension: "xls",
        fileName: `${fileNameBase}.xls`
      };
    case REPORT_EXPORT_FORMATS.PDF:
      return {
        buffer: buildPdfBuffer(report.title, buildSectionTextLines(report)),
        contentType: "application/pdf",
        extension: "pdf",
        fileName: `${fileNameBase}.pdf`
      };
    default:
      throw ApiError.badRequest("Unsupported export format");
  }
}
