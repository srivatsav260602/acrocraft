import { useState, useCallback } from "react";
import { DropZone } from "./components/DropZone";
import { FieldCanvas } from "./components/FieldCanvas";
import { FieldDialog } from "./components/FieldDialog";
import { Sidebar } from "./components/Sidebar";
import { useStore } from "./store/fields";
import type { Field } from "./types/field";
import "./App.css";

interface PendingRect { x: number; y: number; w: number; h: number }

export default function App() {
  const pdfBytes = useStore((s) => s.pdfBytes);
  const fields = useStore((s) => s.fields);
  const currentPage = useStore((s) => s.currentPage);
  const addField = useStore((s) => s.addField);

  const [pendingRect, setPendingRect] = useState<PendingRect | null>(null);

  const handleDrawComplete = useCallback((rect: PendingRect) => {
    setPendingRect(rect);
  }, []);

  const handleDialogConfirm = useCallback((field: Field) => {
    addField(field);
    setPendingRect(null);
  }, [addField]);

  return (
    <div className="app">
      <Sidebar />
      <main className="canvas-area">
        {!pdfBytes ? (
          <DropZone />
        ) : (
          <div className="scroll-area">
            <FieldCanvas onDrawComplete={handleDrawComplete} />
          </div>
        )}
      </main>

      {pendingRect && (
        <FieldDialog
          rect={pendingRect}
          page={currentPage}
          existingNames={fields.map((f) => f.name)}
          onConfirm={handleDialogConfirm}
          onCancel={() => setPendingRect(null)}
        />
      )}
    </div>
  );
}
