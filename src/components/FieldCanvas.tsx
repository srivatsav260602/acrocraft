import { useEffect, useRef, useState, useCallback } from "react";
import { Stage, Layer, Rect, Text } from "react-konva";
import type { KonvaEventObject } from "konva/lib/Node";
import { renderPage, loadPdf } from "../lib/pdfRenderer";
import { useStore } from "../store/fields";
import type { Field } from "../types/field";

const FIELD_COLOURS: Record<string, string> = {
  text: "#4A90E2",
  multiline: "#7B68EE",
  checkbox: "#50C878",
  radio: "#FF8C42",
  dropdown: "#FFD700",
  date: "#FF6B9D",
};

interface DrawRect { x: number; y: number; w: number; h: number }

interface Props {
  onDrawComplete: (rect: DrawRect) => void;
}

export function FieldCanvas({ onDrawComplete }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dims, setDims] = useState({ width: 0, height: 0 });
  const [drawing, setDrawing] = useState<DrawRect | null>(null);
  const startRef = useRef<{ x: number; y: number } | null>(null);

  const pdfBytes = useStore((s) => s.pdfBytes);
  const currentPage = useStore((s) => s.currentPage);
  const fields = useStore((s) => s.fields);
  const selectedId = useStore((s) => s.selectedId);
  const selectField = useStore((s) => s.selectField);
  const updateField = useStore((s) => s.updateField);
  const zoom = useStore((s) => s.zoom);
  const pdfRef = useRef<any>(null);

  // Render PDF page onto canvas
  useEffect(() => {
    if (!pdfBytes || !canvasRef.current) return;
    (async () => {
      try {
        if (!pdfRef.current) pdfRef.current = await loadPdf(pdfBytes.slice(0));
        const { width, height } = await renderPage(pdfRef.current, currentPage, canvasRef.current!);
        setDims({ width, height });
      } catch (err) {
        console.error("renderPage failed:", err);
      }
    })();
  }, [pdfBytes, currentPage]);

  const pageFields = fields.filter((f) => f.page === currentPage);

  const onMouseDown = useCallback((e: KonvaEventObject<MouseEvent>) => {
    // Only start drawing if clicking on empty canvas (not a field)
    if ((e.target as any).name() === "field") return;
    selectField(null);
    const pos = e.target.getStage()!.getPointerPosition()!;
    startRef.current = { x: pos.x, y: pos.y };
    setDrawing({ x: pos.x, y: pos.y, w: 0, h: 0 });
  }, [selectField]);

  const onMouseMove = useCallback((e: KonvaEventObject<MouseEvent>) => {
    if (!startRef.current) return;
    const pos = e.target.getStage()!.getPointerPosition()!;
    setDrawing({
      x: Math.min(startRef.current.x, pos.x),
      y: Math.min(startRef.current.y, pos.y),
      w: Math.abs(pos.x - startRef.current.x),
      h: Math.abs(pos.y - startRef.current.y),
    });
  }, []);

  const onMouseUp = useCallback(() => {
    if (!drawing || drawing.w < 3 || drawing.h < 3) {
      setDrawing(null);
      startRef.current = null;
      return;
    }
    onDrawComplete({ ...drawing });
    setDrawing(null);
    startRef.current = null;
  }, [drawing, onDrawComplete]);

  return (
    <div style={{ position: "relative", display: "inline-block", transform: `scale(${zoom})`, transformOrigin: "top left" }}>
      <canvas ref={canvasRef} style={{ display: "block" }} />
      {dims.width > 0 && (
        <div style={{ position: "absolute", top: 0, left: 0 }}>
          <Stage
            width={dims.width}
            height={dims.height}
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
            style={{ cursor: "crosshair" }}
          >
            <Layer>
              {pageFields.map((field) => (
                <FieldRect
                  key={field.id}
                  field={field}
                  selected={field.id === selectedId}
                  onSelect={() => selectField(field.id)}
                  onChange={(updates) => updateField(field.id, updates)}
                />
              ))}
              {drawing && drawing.w > 0 && (
                <Rect
                  x={drawing.x} y={drawing.y}
                  width={drawing.w} height={drawing.h}
                  fill="rgba(74,144,226,0.15)"
                  stroke="#4A90E2"
                  strokeWidth={1.5}
                  dash={[4, 3]}
                />
              )}
            </Layer>
          </Stage>
        </div>
      )}
    </div>
  );
}

function FieldRect({
  field, selected, onSelect, onChange,
}: {
  field: Field;
  selected: boolean;
  onSelect: () => void;
  onChange: (u: Partial<Field>) => void;
}) {
  const colour = FIELD_COLOURS[field.type] ?? "#aaa";
  return (
    <>
      <Rect
        name="field"
        x={field.x} y={field.y}
        width={field.width} height={field.height}
        fill={`${colour}22`}
        stroke={selected ? colour : `${colour}99`}
        strokeWidth={selected ? 2 : 1}
        draggable
        onClick={onSelect}
        onTap={onSelect}
        onDragEnd={(e) => onChange({ x: e.target.x(), y: e.target.y() })}
        onTransformEnd={(e) => {
          const node = e.target;
          onChange({
            x: node.x(), y: node.y(),
            width: Math.max(10, node.width() * node.scaleX()),
            height: Math.max(8, node.height() * node.scaleY()),
          });
          node.scaleX(1);
          node.scaleY(1);
        }}
      />
      <Text
        x={field.x + 3} y={field.y + 2}
        text={field.name || field.type}
        fontSize={9}
        fill={colour}
        listening={false}
      />
    </>
  );
}
