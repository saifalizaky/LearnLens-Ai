import { readFileSync } from "node:fs";
import { join } from "node:path";

let pdfParseModulePromise: Promise<typeof import("pdf-parse")> | null = null;
let isWorkerConfigured = false;

export async function extractPdfDocument(buffer: Buffer) {
  const { PDFParse } = await loadPdfParse();
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

async function loadPdfParse() {
  installPdfDomPolyfills();

  pdfParseModulePromise ??= import("pdf-parse");

  const pdfParseModule = await pdfParseModulePromise;

  configurePdfWorker(pdfParseModule.PDFParse);

  return pdfParseModule;
}

function configurePdfWorker(PDFParse: typeof import("pdf-parse").PDFParse) {
  if (isWorkerConfigured) {
    return;
  }

  try {
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
    isWorkerConfigured = true;
  } catch (error) {
    console.error("PDF worker configuration failed", error);
  }
}

function installPdfDomPolyfills() {
  const scope = globalThis as Record<string, unknown>;

  if (!scope.DOMMatrix) {
    scope.DOMMatrix = class ServerDOMMatrix {
      a = 1;
      b = 0;
      c = 0;
      d = 1;
      e = 0;
      f = 0;

      constructor(init?: number[] | string) {
        if (Array.isArray(init) && init.length >= 6) {
          [this.a, this.b, this.c, this.d, this.e, this.f] = init;
        }
      }

      multiplySelf() {
        return this;
      }

      preMultiplySelf() {
        return this;
      }

      translateSelf() {
        return this;
      }

      scaleSelf() {
        return this;
      }

      rotateSelf() {
        return this;
      }

      invertSelf() {
        return this;
      }

      transformPoint(point: unknown) {
        return point;
      }
    };
  }

  if (!scope.ImageData) {
    scope.ImageData = class ServerImageData {
      constructor(
        public data: Uint8ClampedArray,
        public width: number,
        public height: number,
      ) {}
    };
  }

  if (!scope.Path2D) {
    scope.Path2D = class ServerPath2D {};
  }
}
