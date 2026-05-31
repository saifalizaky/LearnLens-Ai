import { readFileSync } from "node:fs";
import { join } from "node:path";
import { PDFParse } from "pdf-parse";

configurePdfWorker();

export async function extractPdfDocument(buffer: Buffer) {
  const parser = new PDFParse({ data: buffer });

  try {
    const info = await parser.getInfo();
    const result = await parser.getText();

    return {
      text: normalizePdfText(result.text),
      pages: info.total,
    };
  } finally {
    await parser.destroy();
  }
}

function normalizePdfText(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function configurePdfWorker() {
  const workerPath = join(
    process.cwd(),
    "node_modules",
    "pdf-parse",
    "dist",
    "worker",
    "pdf.worker.mjs",
  );
  const workerData = readFileSync(workerPath).toString("base64");

  PDFParse.setWorker(`data:text/javascript;base64,${workerData}`);
}
