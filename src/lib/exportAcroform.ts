import { PDFDocument, PDFName, PDFDict, PDFRawStream, PDFBool } from "pdf-lib";
import type { Field, OverflowBehaviour, CheckboxStyle } from "../types/field";

export async function exportAcroform(
  originalBytes: ArrayBuffer,
  fields: Field[],
  pageDimensions: { width: number; height: number; scale: number }[]
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(originalBytes);
  const pages = pdfDoc.getPages();
  const form = pdfDoc.getForm();

  const checkboxStyles: { name: string; style: CheckboxStyle }[] = [];

  for (const field of fields) {
    const page = pages[field.page];
    const { width: canvasW, height: canvasH } = pageDimensions[field.page];
    const { width: pdfW, height: pdfH } = page.getSize();

    const scaleX = pdfW / canvasW;
    const scaleY = pdfH / canvasH;
    const x = field.x * scaleX;
    const w = field.width * scaleX;
    const h = field.height * scaleY;
    const y = pdfH - (field.y * scaleY) - h;

    const opts = { x, y, width: w, height: h, borderWidth: 0 };

    if (field.type === "text" || field.type === "date") {
      const tf = form.createTextField(field.name);
      tf.addToPage(page, opts);
      if ("defaultValue" in field && field.defaultValue) tf.setText(field.defaultValue);
      _applyFontAndOverflow(tf, field.fontSize, field.overflow ?? "shrink");
      if (field.required) tf.enableRequired();

    } else if (field.type === "multiline") {
      const tf = form.createTextField(field.name);
      tf.enableMultiline();
      tf.addToPage(page, opts);
      if (field.defaultValue) tf.setText(field.defaultValue);
      _applyFontAndOverflow(tf, field.fontSize, field.overflow ?? "shrink");
      if (field.required) tf.enableRequired();

    } else if (field.type === "checkbox") {
      const cb = form.createCheckBox(field.name);
      cb.addToPage(page, opts);
      if (field.defaultChecked) cb.check();
      checkboxStyles.push({ name: field.name, style: field.checkStyle });

    } else if (field.type === "radio") {
      let rg;
      try { rg = form.getRadioGroup(field.group); }
      catch { rg = form.createRadioGroup(field.group); }
      rg.addOptionToPage(field.value, page, opts);

    } else if (field.type === "dropdown") {
      const dd = form.createDropdown(field.name);
      if (field.options.length) dd.addOptions(field.options);
      if (field.defaultValue) dd.select(field.defaultValue);
      dd.addToPage(page, opts);
      if (field.required) dd.enableRequired();
      const ddSize = field.fontSize === 0 ? 0 : field.fontSize;
      dd.acroField.setDefaultAppearance(`/Helv ${ddSize} Tf 0 g`);
    }
  }

  // Generate base appearance streams before patching
  form.updateFieldAppearances();

  for (const { name, style } of checkboxStyles) {
    if (style === "check") continue;
    _applyCheckboxStyle(form.getCheckBox(name), style, pdfDoc);
  }

  // Tell viewers to use the pre-built AP streams, not regenerate from /DA
  form.acroForm.dict.set(PDFName.of("NeedAppearances"), PDFBool.False);

  return pdfDoc.save();
}

function _applyFontAndOverflow(
  tf: ReturnType<ReturnType<typeof PDFDocument.prototype.getForm>["createTextField"]>,
  fontSize: number,
  overflow: OverflowBehaviour
) {
  const size = overflow === "shrink" ? 0 : fontSize;
  tf.acroField.setDefaultAppearance(`/Helv ${size} Tf 0 g`);
}

function _applyCheckboxStyle(
  cb: ReturnType<ReturnType<typeof PDFDocument.prototype.getForm>["getCheckBox"]>,
  style: CheckboxStyle,
  pdfDoc: PDFDocument
) {
  for (const widget of cb.acroField.getWidgets()) {
    const { width: w, height: h } = widget.getRectangle();
    const content = _buildCheckContent(style, w, h);
    const bytes = new TextEncoder().encode(content);

    const streamDict = pdfDoc.context.obj({
      Type: "XObject",
      Subtype: "Form",
      BBox: [0, 0, w, h],
      Resources: {},
      Length: bytes.length,
    }) as PDFDict;

    const stream = PDFRawStream.of(streamDict, bytes);
    const ref = pdfDoc.context.register(stream);

    // Inject our stream as the "Yes" (on) state in the AP/N dict
    const widgetDict = widget.dict as PDFDict;
    const apVal = widgetDict.get(PDFName.of("AP"));
    if (!apVal) continue;
    const apDict = widgetDict.context.lookup(apVal) as PDFDict;
    const nVal = apDict.get(PDFName.of("N"));
    if (!nVal) continue;
    const nDict = widgetDict.context.lookup(nVal) as PDFDict;
    nDict.set(PDFName.of("Yes"), ref);
  }
}

function _buildCheckContent(style: CheckboxStyle, w: number, h: number): string {
  const m = Math.min(w, h) * 0.12;
  const iw = w - 2 * m;
  const ih = h - 2 * m;
  const f = (n: number) => n.toFixed(3);

  switch (style) {
    case "square":
      return `q 0 g ${f(m)} ${f(m)} ${f(iw)} ${f(ih)} re f Q`;

    case "cross": {
      const lw = Math.max(0.5, Math.min(w, h) * 0.1);
      return `q 0 g ${f(lw)} w ${f(m)} ${f(m)} m ${f(w - m)} ${f(h - m)} l S ${f(w - m)} ${f(m)} m ${f(m)} ${f(h - m)} l S Q`;
    }

    case "circle": {
      const cx = w / 2, cy = h / 2, rx = iw / 2, ry = ih / 2, k = 0.5523;
      return (
        `q 0 g ` +
        `${f(cx + rx)} ${f(cy)} m ` +
        `${f(cx + rx)} ${f(cy + ry * k)} ${f(cx + rx * k)} ${f(cy + ry)} ${f(cx)} ${f(cy + ry)} c ` +
        `${f(cx - rx * k)} ${f(cy + ry)} ${f(cx - rx)} ${f(cy + ry * k)} ${f(cx - rx)} ${f(cy)} c ` +
        `${f(cx - rx)} ${f(cy - ry * k)} ${f(cx - rx * k)} ${f(cy - ry)} ${f(cx)} ${f(cy - ry)} c ` +
        `${f(cx + rx * k)} ${f(cy - ry)} ${f(cx + rx)} ${f(cy - ry * k)} ${f(cx + rx)} ${f(cy)} c f Q`
      );
    }

    case "diamond": {
      const cx = w / 2, cy = h / 2;
      return `q 0 g ${f(cx)} ${f(m)} m ${f(w - m)} ${f(cy)} l ${f(cx)} ${f(h - m)} l ${f(m)} ${f(cy)} l f Q`;
    }

    case "star": {
      const cx = w / 2, cy = h / 2;
      const outer = Math.min(w, h) / 2 - m;
      const inner = outer * 0.382;
      const pts = Array.from({ length: 10 }, (_, i) => {
        const angle = (i * Math.PI) / 5 - Math.PI / 2;
        const r = i % 2 === 0 ? outer : inner;
        return `${f(cx + r * Math.cos(angle))} ${f(cy + r * Math.sin(angle))} ${i === 0 ? "m" : "l"}`;
      });
      return `q 0 g ${pts.join(" ")} h f Q`;
    }

    default:
      return "";
  }
}
