export type FieldType =
  | "text"
  | "multiline"
  | "checkbox"
  | "radio"
  | "dropdown"
  | "date";

export type OverflowBehaviour = "shrink" | "scroll" | "truncate";

export type CheckboxStyle = "check" | "cross" | "circle" | "diamond" | "square" | "star";

export interface FieldBase {
  id: string;
  name: string;
  page: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface TextField extends FieldBase {
  type: "text";
  overflow: OverflowBehaviour;
  multiline: false;
  required: boolean;
  defaultValue: string;
  fontSize: number; // 0 = auto-shrink
}

export interface MultilineField extends FieldBase {
  type: "multiline";
  overflow: OverflowBehaviour;
  multiline: true;
  required: boolean;
  defaultValue: string;
  fontSize: number;
}

export interface CheckboxField extends FieldBase {
  type: "checkbox";
  checkStyle: CheckboxStyle;
  defaultChecked: boolean;
  required: boolean;
}

export interface RadioField extends FieldBase {
  type: "radio";
  group: string;
  value: string;
  checkStyle: CheckboxStyle;
}

export interface DropdownField extends FieldBase {
  type: "dropdown";
  options: string[];
  defaultValue: string;
  required: boolean;
  fontSize: number; // 0 = auto-shrink
}

export interface DateField extends FieldBase {
  type: "date";
  format: string;
  overflow: OverflowBehaviour;
  required: boolean;
  fontSize: number;
}

export type Field =
  | TextField
  | MultilineField
  | CheckboxField
  | RadioField
  | DropdownField
  | DateField;
