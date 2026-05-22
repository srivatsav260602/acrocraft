import { useState } from "react";
import type { Field, FieldType, OverflowBehaviour, CheckboxStyle } from "../types/field";
import styles from "./FieldDialog.module.css";

interface DrawRect { x: number; y: number; w: number; h: number }

interface Props {
  rect: DrawRect;
  page: number;
  existingNames: string[];
  onConfirm: (field: Field) => void;
  onCancel: () => void;
}

const FIELD_TYPES: { value: FieldType; label: string; description: string }[] = [
  { value: "text",      label: "Text",       description: "Single line input" },
  { value: "multiline", label: "Multiline",  description: "Multi-line text area" },
  { value: "checkbox",  label: "Checkbox",   description: "Tick box" },
  { value: "radio",     label: "Radio",      description: "One option from a group" },
  { value: "dropdown",  label: "Dropdown",   description: "Select from a list" },
  { value: "date",      label: "Date",       description: "Date input" },
];

const OVERFLOW_OPTIONS: { value: OverflowBehaviour; label: string; description: string }[] = [
  { value: "shrink",   label: "Shrink to fit", description: "Font shrinks so all text stays visible" },
  { value: "scroll",   label: "Scroll",        description: "Text scrolls horizontally" },
  { value: "truncate", label: "Truncate",       description: "Text is cut off at the edge" },
];

const CHECKBOX_STYLES: { value: CheckboxStyle; label: string; symbol: string }[] = [
  { value: "check",   label: "Checkmark", symbol: "✓" },
  { value: "cross",   label: "Cross (X)", symbol: "✗" },
  { value: "circle",  label: "Circle",    symbol: "●" },
  { value: "diamond", label: "Diamond",   symbol: "◆" },
  { value: "square",  label: "Square",    symbol: "■" },
  { value: "star",    label: "Star",      symbol: "★" },
];

export function FieldDialog({ rect, page, existingNames, onConfirm, onCancel }: Props) {
  const [type, setType] = useState<FieldType>("text");
  const [name, setName] = useState("");
  const [overflow, setOverflow] = useState<OverflowBehaviour>("shrink");
  const [checkStyle, setCheckStyle] = useState<CheckboxStyle>("check");
  const [required, setRequired] = useState(false);
  const [radioGroup, setRadioGroup] = useState("");
  const [radioValue, setRadioValue] = useState("");
  const [dropdownOptions, setDropdownOptions] = useState("");
  const [dateFormat, setDateFormat] = useState("DD-MM-YYYY");
  const [nameError, setNameError] = useState("");
  const [fontSizeAuto, setFontSizeAuto] = useState(true);
  const [fontSize, setFontSize] = useState(10);

  const needsOverflow = type === "text" || type === "multiline" || type === "date" || type === "dropdown";
  const needsCheckStyle = type === "checkbox" || type === "radio";

  const validate = () => {
    if (!name.trim()) { setNameError("Field name is required"); return false; }
    if (existingNames.includes(name.trim())) { setNameError("Name already used on this form"); return false; }
    if (!/^[a-zA-Z0-9_-]+$/.test(name.trim())) { setNameError("Only letters, numbers, _ and - allowed"); return false; }
    setNameError("");
    return true;
  };

  const handleConfirm = () => {
    if (!validate()) return;
    const base = { id: crypto.randomUUID(), name: name.trim(), page, x: rect.x, y: rect.y, width: rect.w, height: rect.h };
    let field: Field;
    switch (type) {
      case "text":
        field = { ...base, type: "text", overflow, multiline: false, required, defaultValue: "", fontSize: fontSizeAuto ? 0 : fontSize }; break;
      case "multiline":
        field = { ...base, type: "multiline", overflow, multiline: true, required, defaultValue: "", fontSize: fontSizeAuto ? 0 : fontSize }; break;
      case "checkbox":
        field = { ...base, type: "checkbox", checkStyle, defaultChecked: false, required }; break;
      case "radio":
        field = { ...base, type: "radio", group: radioGroup || name.trim(), value: radioValue || name.trim(), checkStyle }; break;
      case "dropdown":
        field = { ...base, type: "dropdown", options: dropdownOptions.split("\n").map(s => s.trim()).filter(Boolean), defaultValue: "", required, fontSize: fontSizeAuto ? 0 : fontSize }; break;
      case "date":
        field = { ...base, type: "date", format: dateFormat, overflow, required, fontSize: fontSizeAuto ? 0 : fontSize }; break;
    }
    onConfirm(field!);
  };

  return (
    <div className={styles.backdrop}>
      <div className={styles.dialog}>
        <h2>Configure field</h2>

        <label className={styles.label}>Field name
          <input
            className={`${styles.input} ${nameError ? styles.inputError : ""}`}
            placeholder="e.g. field_1_surname"
            value={name}
            onChange={(e) => { setName(e.target.value); setNameError(""); }}
            autoFocus
          />
          {nameError && <span className={styles.error}>{nameError}</span>}
        </label>

        <fieldset className={styles.fieldset}>
          <legend>Field type</legend>
          <div className={styles.typeGrid}>
            {FIELD_TYPES.map((t) => (
              <button
                key={t.value}
                className={`${styles.typeBtn} ${type === t.value ? styles.typeBtnActive : ""}`}
                onClick={() => setType(t.value)}
                type="button"
              >
                <strong>{t.label}</strong>
                <span>{t.description}</span>
              </button>
            ))}
          </div>
        </fieldset>

        {needsOverflow && (
          <fieldset className={styles.fieldset}>
            <legend>When text overflows</legend>
            <div className={styles.radioGroup}>
              {OVERFLOW_OPTIONS.map((o) => (
                <label key={o.value} className={styles.radioLabel}>
                  <input type="radio" name="overflow" value={o.value} checked={overflow === o.value} onChange={() => setOverflow(o.value)} />
                  <span><strong>{o.label}</strong> — {o.description}</span>
                </label>
              ))}
            </div>
          </fieldset>
        )}

        {needsOverflow && (
          <fieldset className={styles.fieldset}>
            <legend>Font size</legend>
            <div className={styles.radioGroup}>
              <label className={styles.radioLabel}>
                <input type="radio" name="fontsize" checked={fontSizeAuto} onChange={() => setFontSizeAuto(true)} />
                <span><strong>Auto</strong> — shrinks or fits based on overflow setting</span>
              </label>
              <label className={styles.radioLabel}>
                <input type="radio" name="fontsize" checked={!fontSizeAuto} onChange={() => setFontSizeAuto(false)} />
                <span>
                  <strong>Fixed</strong> —&nbsp;
                  <input
                    type="number"
                    className={styles.inlineNumber}
                    min={4} max={72} value={fontSize}
                    disabled={fontSizeAuto}
                    onChange={(e) => setFontSize(Number(e.target.value))}
                  />
                  &nbsp;pt
                </span>
              </label>
            </div>
          </fieldset>
        )}

        {needsCheckStyle && (
          <fieldset className={styles.fieldset}>
            <legend>Check mark style</legend>
            <div className={styles.checkGrid}>
              {CHECKBOX_STYLES.map((c) => (
                <button
                  key={c.value}
                  className={`${styles.checkBtn} ${checkStyle === c.value ? styles.checkBtnActive : ""}`}
                  onClick={() => setCheckStyle(c.value)}
                  type="button"
                  title={c.label}
                >
                  <span className={styles.symbol}>{c.symbol}</span>
                  <span>{c.label}</span>
                </button>
              ))}
            </div>
          </fieldset>
        )}

        {type === "radio" && (
          <fieldset className={styles.fieldset}>
            <legend>Radio options</legend>
            <label className={styles.label}>Group name
              <input className={styles.input} placeholder="e.g. sex" value={radioGroup} onChange={(e) => setRadioGroup(e.target.value)} />
            </label>
            <label className={styles.label}>This option's value
              <input className={styles.input} placeholder="e.g. male" value={radioValue} onChange={(e) => setRadioValue(e.target.value)} />
            </label>
          </fieldset>
        )}

        {type === "dropdown" && (
          <label className={styles.label}>Options (one per line)
            <textarea
              className={styles.textarea}
              rows={4}
              placeholder={"Option 1\nOption 2\nOption 3"}
              value={dropdownOptions}
              onChange={(e) => setDropdownOptions(e.target.value)}
            />
          </label>
        )}

        {type === "date" && (
          <label className={styles.label}>Date format
            <input className={styles.input} value={dateFormat} onChange={(e) => setDateFormat(e.target.value)} />
          </label>
        )}

        {(type === "text" || type === "multiline" || type === "dropdown" || type === "date") && (
          <label className={styles.checkboxLabel}>
            <input type="checkbox" checked={required} onChange={(e) => setRequired(e.target.checked)} />
            Required field
          </label>
        )}

        <div className={styles.actions}>
          <button className={styles.cancel} onClick={onCancel} type="button">Cancel</button>
          <button className={styles.confirm} onClick={handleConfirm} type="button">Add field</button>
        </div>
      </div>
    </div>
  );
}
