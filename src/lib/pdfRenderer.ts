import * as pdfjsLib from "pdfjs-dist";

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.mjs",
  import.meta.url
).toString();

export async function loadPdf(bytes: ArrayBuffer) {
  return pdfjsLib.getDocument({ data: bytes }).promise;
}

export async function renderPage(
  pdf: pdfjsLib.PDFDocumentProxy,
  pageIndex: number,
  canvas: HTMLCanvasElement,
  scale = 1.5
) {
  const page = await pdf.getPage(pageIndex + 1);
  const viewport = page.getViewport({ scale });
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  // pdfjs-dist v5: pass canvas directly
  await (page.render as any)({ canvas, viewport }).promise;
  return { width: viewport.width, height: viewport.height, scale };
}
