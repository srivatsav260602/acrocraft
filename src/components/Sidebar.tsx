import { useStore } from "../store/fields";
import type { Field } from "../types/field";
import styles from "./Sidebar.module.css";

const TYPE_LABELS: Record<string, string> = {
  text: "Text", multiline: "Multiline", checkbox: "Checkbox",
  radio: "Radio", dropdown: "Dropdown", date: "Date",
};

const TYPE_COLOURS: Record<string, string> = {
  text: "#4A90E2", multiline: "#7B68EE", checkbox: "#50C878",
  radio: "#FF8C42", dropdown: "#FFD700", date: "#FF6B9D",
};

export function Sidebar() {
  const fields = useStore((s) => s.fields);
  const selectedId = useStore((s) => s.selectedId);
  const selectField = useStore((s) => s.selectField);
  const deleteField = useStore((s) => s.deleteField);
  const pageCount = useStore((s) => s.pageCount);
  const currentPage = useStore((s) => s.currentPage);
  const setCurrentPage = useStore((s) => s.setCurrentPage);
  const pdfBytes = useStore((s) => s.pdfBytes);
  const zoom = useStore((s) => s.zoom);
  const setZoom = useStore((s) => s.setZoom);

  const handleExport = async () => {
    if (!pdfBytes) return;
    const { exportAcroform } = await import("../lib/exportAcroform");
    // Collect page dimensions from rendered canvases
    const canvases = document.querySelectorAll<HTMLCanvasElement>("canvas");
    // We only have current page rendered; use a best-effort approach
    const dims = Array.from({ length: pageCount }, () => ({
      width: canvases[0]?.width ?? 892,
      height: canvases[0]?.height ?? 1262,
      scale: 1.5,
    }));
    const bytes = await exportAcroform(pdfBytes, fields, dims);
    const blob = new Blob([bytes.buffer as ArrayBuffer], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "acrocraft-output.pdf";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <aside className={styles.sidebar}>
      <div className={styles.header}>
        <span className={styles.logo}>acrocraft</span>
        <span className={styles.tagline}>pdf to form</span>
      </div>

      {pdfBytes && (
        <>
          <div className={styles.section}>
            <div className={styles.sectionTitle}>Pages</div>
            <div className={styles.pageList}>
              {Array.from({ length: pageCount }, (_, i) => (
                <button
                  key={i}
                  className={`${styles.pageBtn} ${currentPage === i ? styles.pageBtnActive : ""}`}
                  onClick={() => setCurrentPage(i)}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.section}>
            <div className={styles.sectionTitle}>
              Fields
              <span className={styles.count}>{fields.length}</span>
            </div>
            {fields.length === 0 ? (
              <p className={styles.empty}>Draw a rectangle on the PDF to add a field</p>
            ) : (
              <div className={styles.fieldList}>
                {fields.map((f) => (
                  <FieldRow
                    key={f.id}
                    field={f}
                    selected={f.id === selectedId}
                    onSelect={() => selectField(f.id === selectedId ? null : f.id)}
                    onDelete={() => deleteField(f.id)}
                  />
                ))}
              </div>
            )}
          </div>

          <div className={styles.section}>
            <div className={styles.sectionTitle}>Zoom</div>
            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              <button className={styles.pageBtn} onClick={() => setZoom(zoom - 0.25)}>−</button>
              <span style={{ flex: 1, textAlign: "center", fontSize: 13, color: "#aaa" }}>{Math.round(zoom * 100)}%</span>
              <button className={styles.pageBtn} onClick={() => setZoom(zoom + 0.25)}>+</button>
              <button className={styles.pageBtn} onClick={() => setZoom(1)} title="Reset">1:1</button>
            </div>
          </div>

          <div className={styles.exportSection}>
            <button className={styles.exportBtn} onClick={handleExport} disabled={fields.length === 0}>
              Export AcroForm PDF
            </button>
          </div>
        </>
      )}
    </aside>
  );
}

function FieldRow({ field, selected, onSelect, onDelete }: {
  field: Field; selected: boolean;
  onSelect: () => void; onDelete: () => void;
}) {
  const colour = TYPE_COLOURS[field.type];
  return (
    <div
      className={`${styles.fieldRow} ${selected ? styles.fieldRowSelected : ""}`}
      onClick={onSelect}
    >
      <span className={styles.fieldType} style={{ background: `${colour}22`, color: colour }}>
        {TYPE_LABELS[field.type]}
      </span>
      <span className={styles.fieldName}>{field.name}</span>
      <span className={styles.fieldPage}>p{field.page + 1}</span>
      <button
        className={styles.deleteBtn}
        onClick={(e) => { e.stopPropagation(); onDelete(); }}
        title="Delete"
      >✕</button>
    </div>
  );
}
