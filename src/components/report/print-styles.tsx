"use client";

/**
 * Comprehensive print stylesheet for the C-Suite report PDF.
 * Uses @page named pages, running headers/footers, orphan/widow control,
 * and break-inside avoidance. Best results in Chromium-based browsers.
 */
export function PrintStyles() {
  return (
    <style jsx global>{`
      /* ---------- Screen preview (visible while staging) ---------- */
      .report-doc {
        background: #f8fafc;
      }
      .report-doc .report-section-h3 {
        font-size: 14pt;
        font-weight: 600;
        color: #001278;
        margin: 0;
        padding-bottom: 4pt;
        border-bottom: 1px solid #e5e7eb;
        letter-spacing: -0.005em;
      }
      .report-doc .report-page {
        background: #ffffff;
        max-width: 8.5in;
        min-height: 11in;
        margin: 16px auto;
        padding: 0.7in;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
        border-radius: 6px;
        position: relative;
        box-sizing: border-box;
      }
      .report-doc .report-page.intro-page {
        display: flex;
        flex-direction: column;
      }
      .report-doc .intro-footer {
        margin-top: auto;
      }

      /* ---------- @page (print only) ---------- */
      @page {
        size: letter;
        margin: 0.7in 0.7in 0.9in 0.7in;
      }
      @page {
        @bottom-right {
          content: counter(page) " / " counter(pages);
          font-family: "DM Sans", system-ui, sans-serif;
          font-size: 9pt;
          color: #6b7280;
          padding-top: 12pt;
        }
        @bottom-left {
          content: "BlueAlly  ·  AI Solution Builder";
          font-family: "DM Sans", system-ui, sans-serif;
          font-size: 9pt;
          color: #6b7280;
          padding-top: 12pt;
        }
        @top-right {
          content: string(useCaseTitle);
          font-family: "DM Sans", system-ui, sans-serif;
          font-size: 9pt;
          color: #001278;
          padding-bottom: 12pt;
        }
      }
      @page landscape-diagram {
        size: letter landscape;
        margin: 0.5in;
      }

      /* ---------- Print media ---------- */
      @media print {
        html, body {
          background: #ffffff !important;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
          color-adjust: exact !important;
          font-family: "DM Sans", system-ui, -apple-system, sans-serif;
          font-size: 10.5pt;
          line-height: 1.45;
          color: #0a0e27;
        }

        /* Reset wrapper styles for clean print pagination */
        .report-doc {
          background: #ffffff !important;
        }
        .report-doc .report-page {
          max-width: none !important;
          margin: 0 !important;
          padding: 0 !important;
          box-shadow: none !important;
          border-radius: 0 !important;
          background: transparent !important;
        }

        /* Dark hero pages keep their navy background and need printable bleed.
           Counteract the @page margin so the navy fills the printable area. */
        .report-doc .report-page.dark-hero {
          background: #001278 !important;
          color: #ffffff !important;
          margin: -0.7in -0.7in -0.9in -0.7in !important;
          padding: 0.7in 0.7in 0.9in 0.7in !important;
        }

        /* Hide on-screen scaffolding */
        .no-print {
          display: none !important;
        }

        /* Page break primitives */
        .break-before {
          break-before: page;
          page-break-before: always;
        }
        .break-after {
          break-after: page;
          page-break-after: always;
        }
        .keep-with-next {
          break-after: avoid-page;
          page-break-after: avoid;
        }

        /* Avoid splitting these blocks across pages */
        .report-card,
        .diagram-frame,
        .scorecard-row,
        .kpi-card,
        figure,
        table,
        thead,
        tbody tr {
          break-inside: avoid;
          page-break-inside: avoid;
        }

        /* Heading rules */
        h1, h2, h3, h4 {
          break-after: avoid-page;
          page-break-after: avoid;
        }
        h2 {
          string-set: useCaseTitle content();
        }

        /* Body text orphan/widow control */
        p, li {
          orphans: 3;
          widows: 3;
        }

        /* Diagram SVGs always proportionally fit the column */
        .mermaid-diagram svg {
          max-width: 100% !important;
          height: auto !important;
          display: block;
          margin: 0 auto;
        }

        /* Landscape diagrams */
        .diagram-frame.landscape {
          page: landscape-diagram;
        }

        /* Strip link underlines/colors */
        a {
          color: inherit;
          text-decoration: none;
        }

        /* Intro page lays out flex top-to-bottom in print too */
        .report-page.intro-page {
          display: flex;
          flex-direction: column;
          min-height: auto;
        }
        .report-page.intro-page .intro-footer {
          margin-top: auto;
        }

        /* Force consistent table borders */
        table {
          border-collapse: collapse;
          width: 100%;
        }
        th, td {
          border: 1px solid #e5e7eb;
          padding: 6pt 8pt;
          text-align: left;
          vertical-align: top;
        }
        thead th {
          background: #f1f5f9 !important;
          color: #001278;
          font-weight: 600;
          font-size: 9.5pt;
        }

        /* Hide debug page boundary markers unless ?debug=1 */
        .page-debug-marker {
          display: none;
        }
      }

      /* Debug overlay (when ?debug=1 query param is set) */
      .report-doc.debug-pages .page-debug-marker {
        display: block;
        height: 10in;
        border-bottom: 2px dashed #ef4444;
        margin: 0;
        padding: 0;
        pointer-events: none;
        position: relative;
      }
      .report-doc.debug-pages .page-debug-marker::after {
        content: "↓ 10in page boundary";
        position: absolute;
        right: 0;
        bottom: 4px;
        font: 10px/1 monospace;
        color: #ef4444;
        background: #fff;
        padding: 2px 6px;
      }
    `}</style>
  );
}
