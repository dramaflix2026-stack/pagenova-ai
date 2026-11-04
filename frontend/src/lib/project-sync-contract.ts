/** Wire format is deliberately independent of templates and renderer internals. */
export type BackupKind = "studio" | "indexeddb";
export type BackupPayload = Record<string, unknown>;
export type CloudBackup = {
  project_id: string; revision: string; payload: BackupPayload;
  kind: BackupKind; title: string; created_at: string; conflict?: boolean;
};
function jsonCompatible(value:unknown,ancestors=new Set<object>()):boolean {
  if(value===null||value===undefined||typeof value==="string"||typeof value==="boolean")return true;
  if(typeof value==="number")return Number.isFinite(value);
  if(typeof value!=="object"||ancestors.has(value))return false;
  if(!Array.isArray(value)&&Object.getPrototypeOf(value)!==Object.prototype&&Object.getPrototypeOf(value)!==null)return false;
  ancestors.add(value);
  const valid=Object.values(value).every(v=>jsonCompatible(v,ancestors));
  ancestors.delete(value);return valid;
}
export function validBackupPayload(value: unknown, kind: BackupKind): value is BackupPayload {
  if(!jsonCompatible(value))return false;
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const p = value as BackupPayload;
  if (kind === "studio") return typeof p.title === "string" && typeof p.background === "string" &&
    Array.isArray(p.blocks) && p.blocks.length > 0 && p.blocks.length <= 2000 &&
    p.blocks.every(b => !!b && typeof b === "object" && typeof b.type === "string");
  return Object.keys(p).length > 1 && (typeof p.html === "string" && p.html.trim().length > 0 ||
    typeof p.visualHtml === "string" && p.visualHtml.trim().length > 0 ||
    p.kind === "booking-workspace" && Array.isArray(p.services) && Array.isArray(p.reservations) ||
    typeof p.generatedHtml === "string" && p.generatedHtml.trim().length > 0 ||
    Array.isArray(p.blocks) && p.blocks.length > 0 || !!p.pages && typeof p.pages === "object" && Object.keys(p.pages).length > 0);
}
export function stableJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`;
  if (value && typeof value === "object") return `{${Object.entries(value).filter(([,v])=>v!==undefined)
    .sort(([a],[b])=>a.localeCompare(b)).map(([k,v])=>`${JSON.stringify(k)}:${stableJson(v)}`).join(",")}}`;
  return JSON.stringify(value) ?? "null";
}
export async function backupDigest(payload: unknown): Promise<string> {
  const bytes = new TextEncoder().encode(stableJson(payload));
  return Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", bytes)), b=>b.toString(16).padStart(2,"0")).join("");
}
