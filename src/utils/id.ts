import { nanoid } from "nanoid";

export function createId(prefix: string) {
  return `${prefix}_${nanoid(8)}`;
}

export function slugId(prefix: string, value: string) {
  return `${prefix}_${value
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")}`;
}
