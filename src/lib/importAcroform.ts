import { PDFDocument, PDFTextField, PDFCheckBox, PDFRadioGroup, PDFDropdown } from "pdf-lib";
import type { Field } from "../types/field";

const RENDER_SCALE = 1.5;

export async function importAcroform(bytes: ArrayBuffer): Promise<Field[]> {
  const pdfDoc = await PDFDocument.load(bytes, { ignoreEncryption: true });
  const pages = pdfDoc.getPages();
  const form = pdfDoc.getForm();
  const fields: Field[] = [];

  // Build a map from page ref string → page index for widget placement
  const pageRefMap = new Map<string, number>();
  pages.forEach((p, i) => pageRefMap.set(p.ref.toString(), i));

  for (const pdfField of form.getFields()) {
    const name = pdfField.getName();

    if (pdfField instanceof PDFTextField) {
      for (const widget of pdfField.acroField.getWidgets()) {
        const pageIdx = _widgetPageIndex(widget, pageRefMap);
        if (pageIdx === -1) continue;
        const { width: pdfW, height: pdfH } = pages[pageIdx].getSize();
        const rect = widget.getRectangle();
        fields.push({
          id: crypto.randomUUID(),
          name,
          page: pageIdx,
          ...pdfToCanvas(rect, pdfH),
          type: pdfField.isMultiline() ? "multiline" : "text",
          overflow: "shrink",
          multiline: pdfField.isMultiline() as any,
          required: false,
          defaultValue: pdfField.getText() ?? "",
          fontSize: 0,
          // suppress TS — pdfW used only to confirm scale, not needed in coords
          ...(pdfW, {}),
        });
      }

    } else if (pdfField instanceof PDFCheckBox) {
      for (const widget of pdfField.acroField.getWidgets()) {
        const pageIdx = _widgetPageIndex(widget, pageRefMap);
        if (pageIdx === -1) continue;
        const { height: pdfH } = pages[pageIdx].getSize();
        const rect = widget.getRectangle();
        fields.push({
          id: crypto.randomUUID(),
          name,
          page: pageIdx,
          ...pdfToCanvas(rect, pdfH),
          type: "checkbox",
          checkStyle: "check",
          defaultChecked: pdfField.isChecked(),
          required: false,
        });
      }

    } else if (pdfField instanceof PDFRadioGroup) {
      const options = pdfField.getOptions();
      const widgets = pdfField.acroField.getWidgets();
      widgets.forEach((widget, i) => {
        const pageIdx = _widgetPageIndex(widget, pageRefMap);
        if (pageIdx === -1) return;
        const { height: pdfH } = pages[pageIdx].getSize();
        const rect = widget.getRectangle();
        fields.push({
          id: crypto.randomUUID(),
          name: `${name}_${options[i] ?? i}`,
          page: pageIdx,
          ...pdfToCanvas(rect, pdfH),
          type: "radio",
          group: name,
          value: options[i] ?? String(i),
          checkStyle: "check",
        });
      });

    } else if (pdfField instanceof PDFDropdown) {
      for (const widget of pdfField.acroField.getWidgets()) {
        const pageIdx = _widgetPageIndex(widget, pageRefMap);
        if (pageIdx === -1) continue;
        const { height: pdfH } = pages[pageIdx].getSize();
        const rect = widget.getRectangle();
        fields.push({
          id: crypto.randomUUID(),
          name,
          page: pageIdx,
          ...pdfToCanvas(rect, pdfH),
          type: "dropdown",
          options: pdfField.getOptions(),
          defaultValue: pdfField.getSelected()[0] ?? "",
          required: false,
          fontSize: 0,
        });
      }
    }
  }

  return fields;
}

function pdfToCanvas(rect: { x: number; y: number; width: number; height: number }, pdfH: number) {
  return {
    x: rect.x * RENDER_SCALE,
    y: (pdfH - rect.y - rect.height) * RENDER_SCALE,
    width: rect.width * RENDER_SCALE,
    height: rect.height * RENDER_SCALE,
  };
}

function _widgetPageIndex(widget: any, pageRefMap: Map<string, number>): number {
  try {
    const pRef = widget.P();
    return pageRefMap.get(pRef?.toString() ?? "") ?? -1;
  } catch {
    return -1;
  }
}
