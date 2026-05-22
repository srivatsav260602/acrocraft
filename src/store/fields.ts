import { create } from "zustand";
import type { Field } from "../types/field";

interface AcroStore {
  // PDF state
  pdfFile: File | null;
  pdfBytes: ArrayBuffer | null;
  pageCount: number;
  currentPage: number;

  // Fields
  fields: Field[];
  selectedId: string | null;

  // Zoom
  zoom: number;

  // Actions
  loadPdf: (file: File, bytes: ArrayBuffer, pageCount: number, initialFields?: Field[]) => void;
  setCurrentPage: (page: number) => void;
  addField: (field: Field) => void;
  updateField: (id: string, updates: Partial<Field>) => void;
  deleteField: (id: string) => void;
  selectField: (id: string | null) => void;
  setZoom: (zoom: number) => void;
}

export const useStore = create<AcroStore>((set) => ({
  pdfFile: null,
  pdfBytes: null,
  pageCount: 0,
  currentPage: 0,
  fields: [],
  selectedId: null,
  zoom: 1,

  setZoom: (zoom) => set({ zoom: Math.max(0.25, Math.min(4, zoom)) }),

  loadPdf: (file, bytes, pageCount, initialFields = []) =>
    set({ pdfFile: file, pdfBytes: bytes, pageCount, currentPage: 0, fields: initialFields, selectedId: null }),

  setCurrentPage: (page) => set({ currentPage: page, selectedId: null }),

  addField: (field) => set((s) => ({ fields: [...s.fields, field] })),

  updateField: (id, updates) =>
    set((s) => ({
      fields: s.fields.map((f) => (f.id === id ? ({ ...f, ...updates } as Field) : f)),
    })),

  deleteField: (id) =>
    set((s) => ({
      fields: s.fields.filter((f) => f.id !== id),
      selectedId: s.selectedId === id ? null : s.selectedId,
    })),

  selectField: (id) => set({ selectedId: id }),
}));
