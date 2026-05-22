import { useCallback } from "react";
import { loadPdf } from "../lib/pdfRenderer";
import { importAcroform } from "../lib/importAcroform";
import { useStore } from "../store/fields";
import styles from "./DropZone.module.css";

export function DropZone() {
  const loadPdfStore = useStore((s) => s.loadPdf);

  const handleFile = useCallback(async (file: File) => {
    const bytes = await file.arrayBuffer();
    const [pdf, existingFields] = await Promise.all([
      loadPdf(bytes.slice(0)),
      importAcroform(bytes.slice(0)),
    ]);
    loadPdfStore(file, bytes, pdf.numPages, existingFields);
  }, [loadPdfStore]);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file?.type === "application/pdf") handleFile(file);
  }, [handleFile]);

  const onInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }, [handleFile]);

  return (
    <div className={styles.zone} onDrop={onDrop} onDragOver={(e) => e.preventDefault()}>
      <div className={styles.inner}>
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
          <line x1="12" y1="18" x2="12" y2="12"/>
          <line x1="9" y1="15" x2="15" y2="15"/>
        </svg>
        <p>Drop a PDF here</p>
        <span>or</span>
        <label className={styles.btn}>
          Browse file
          <input type="file" accept="application/pdf" onChange={onInput} hidden />
        </label>
      </div>
    </div>
  );
}
