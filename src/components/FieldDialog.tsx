import { useState, useRef, useEffect } from "react";
import type { Field, FieldType, OverflowBehaviour, CheckboxStyle, TextField, MultilineField, CheckboxField, RadioField, DropdownField, DateField } from "../types/field";
import styles from "./FieldDialog.module.css";

interface DrawRect { x: number; y: number; w: number; h: number }

interface Props {
  rect?: DrawRect;
  page?: number;
  existingNames: string[];
  onConfirm: (field: Field) => void;
  onCancel: () => void;
  editingField?: Field;
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

export function FieldDialog({ rect, page, existingNames, onConfirm, onCancel, editingField }: Props) {
  const isEditing = !!editingField;
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const dragRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current) return;
      setOffset({
        x: e.clientX - dragStartRef.current.x,
        y: e.clientY - dragStartRef.current.y,
      });
    };

    const handleMouseUp = () => {
      isDraggingRef.current = false;
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel();
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onCancel]);

  const handleMouseDown = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'BUTTON') return;
    isDraggingRef.current = true;
    dragStartRef.current = {
      x: e.clientX - offset.x,
      y: e.clientY - offset.y,
    };
  };

  const [type, setType] = useState<FieldType>(editingField?.type || "text");
  const [name, setName] = useState(editingField?.name || "");
  const [overflow, setOverflow] = useState<OverflowBehaviour>(
    (editingField && "overflow" in editingField) ? editingField.overflow : "shrink"
  );
  const [checkStyle, setCheckStyle] = useState<CheckboxStyle>(
    (editingField && "checkStyle" in editingField) ? editingField.checkStyle : "check"
  );
  const [required, setRequired] = useState(
    (editingField && "required" in editingField) ? editingField.required : false
  );
  const [radioGroup, setRadioGroup] = useState(
    (editingField && editingField.type === "radio") ? editingField.group : ""
  );
  const [radioValue, setRadioValue] = useState(
    (editingField && editingField.type === "radio") ? editingField.value : ""
  );
  const [dropdownOptions, setDropdownOptions] = useState(
    (editingField && editingField.type === "dropdown") ? editingField.options.join("\n") : ""
  );
  const [dateFormat, setDateFormat] = useState(
    (editingField && editingField.type === "date") ? editingField.format : "DD-MM-YYYY"
  );
  const [nameError, setNameError] = useState("");
  const [fontSizeAuto, setFontSizeAuto] = useState(
    !editingField || !("fontSize" in editingField) || editingField.fontSize === 0
  );
  const [fontSize, setFontSize] = useState(
    (editingField && "fontSize" in editingField && editingField.fontSize > 0) ? editingField.fontSize : 10
  );

  const needsOverflow = type === "text" || type === "multiline" || type === "date" || type === "dropdown";
  const needsCheckStyle = type === "checkbox" || type === "radio";

  const validate = () => {
    if (!name.trim()) { setNameError("Field name is required"); return false; }
    const otherNames = existingNames.filter(n => n !== editingField?.name);
    if (otherNames.includes(name.trim())) { setNameError("Name already used on this form"); return false; }
    if (!/^[a-zA-Z0-9_-]+$/.test(name.trim())) { setNameError("Only letters, numbers, _ and - allowed"); return false; }
    setNameError("");
    return true;
  };

  const handleConfirm = () => {
    if (!validate()) return;

    const baseFields = {
      id: editingField?.id || crypto.randomUUID(),
      name: name.trim(),
      page: editingField?.page || page!,
      x: editingField?.x || rect!.x,
      y: editingField?.y || rect!.y,
      width: editingField?.width || rect!.w,
      height: editingField?.height || rect!.h,
    };

    let field: Field;
    switch (type) {
      case "text":
        field = { ...baseFields, type: "text", overflow, multiline: false, required, defaultValue: (editingField?.type === "text" && "defaultValue" in editingField) ? editingField.defaultValue : "", fontSize: fontSizeAuto ? 0 : fontSize } as TextField; break;
      case "multiline":
        field = { ...baseFields, type: "multiline", overflow, multiline: true, required, defaultValue: (editingField?.type === "multiline" && "defaultValue" in editingField) ? editingField.defaultValue : "", fontSize: fontSizeAuto ? 0 : fontSize } as MultilineField; break;
      case "checkbox":
        field = { ...baseFields, type: "checkbox", checkStyle, defaultChecked: (editingField?.type === "checkbox" && "defaultChecked" in editingField) ? editingField.defaultChecked : false, required } as CheckboxField; break;
      case "radio":
        field = { ...baseFields, type: "radio", group: radioGroup || name.trim(), value: radioValue || name.trim(), checkStyle } as RadioField; break;
      case "dropdown":
        field = { ...baseFields, type: "dropdown", options: dropdownOptions.split("\n").map(s => s.trim()).filter(Boolean), defaultValue: (editingField?.type === "dropdown" && "defaultValue" in editingField) ? editingField.defaultValue : "", required, fontSize: fontSizeAuto ? 0 : fontSize } as DropdownField; break;
      case "date":
        field = { ...baseFields, type: "date", format: dateFormat, overflow, required, fontSize: fontSizeAuto ? 0 : fontSize } as DateField; break;
    }
    onConfirm(field!);
  };

  return (
    <div className={styles.backdrop}>
      <div
        ref={dragRef}
        className={styles.dialog}
        style={{ transform: `translate(${offset.x}px, ${offset.y}px)` }}
        onMouseDown={handleMouseDown}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <h2 style={{ cursor: 'grab', userSelect: 'none', margin: 0, flex: 1 }}>
            {isEditing ? "Edit field" : "Configure field"}
          </h2>
          <button
            onClick={onCancel}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#888',
              fontSize: '24px',
              cursor: 'pointer',
              padding: '0 4px',
              lineHeight: 1,
              transition: 'color 0.2s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#ccc')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#888')}
            title="Close (Esc)"
          >
            ✕
          </button>
        </div>

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

        <fieldset className={styles.fieldset} disabled={isEditing}>
          <legend>Field type {isEditing && "(cannot change)"}</legend>
          <div className={styles.typeGrid}>
            {FIELD_TYPES.map((t) => (
              <button
                key={t.value}
                className={`${styles.typeBtn} ${type === t.value ? styles.typeBtnActive : ""}`}
                onClick={() => !isEditing && setType(t.value)}
                type="button"
                disabled={isEditing}
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
          <button className={styles.confirm} onClick={handleConfirm} type="button">{isEditing ? "Update field" : "Add field"}</button>
        </div>
      </div>
    </div>
  );
}
