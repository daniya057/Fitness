import { api } from "../auth/api";

export function cleanBarcode(value) {
  return String(value || "").replace(/\D/g, "").slice(0, 14);
}

export async function lookupBarcode(code) {
  const clean = cleanBarcode(code);
  if (clean.length < 8) {
    throw new Error("Код — 8–14 цифр");
  }
  const data = await api(`/barcode/${clean}`);
  return data.food;
}
