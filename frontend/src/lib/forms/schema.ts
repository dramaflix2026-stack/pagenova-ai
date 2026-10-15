export type FormKind = "leads" | "quiz" | "application" | "survey";
export type FormQuestionType = "text" | "email" | "tel" | "textarea" | "select";
export type FormQuestion = {
  id: string;
  label: string;
  type: FormQuestionType;
  required: boolean;
  options: string[];
  imageUrl?: string;
};
export type PageNovaForm = {
  id: string;
  title: string;
  description: string;
  kind: FormKind;
  intent: string;
  whatsapp: string;
  fields: FormQuestion[];
  coverImageUrl?: string;
  backgroundImageUrl?: string;
  visualTheme?: "emerald"|"rose"|"midnight";
  motion?: boolean;
  updatedAt: string;
  publishedAt: string | null;
};
export type FormInput = Pick<PageNovaForm, "title" | "description" | "kind" | "intent" | "whatsapp" | "fields" | "coverImageUrl" | "backgroundImageUrl" | "visualTheme" | "motion">;
export type PublicForm = Pick<PageNovaForm, "id" | "title" | "description" | "kind" | "fields" | "publishedAt" | "coverImageUrl" | "backgroundImageUrl" | "visualTheme" | "motion">;
export type FormSubmission = {
  id: string;
  formId: string;
  submittedAt: string;
  consentedAt?: string;
  answers: Array<{ questionId: string; label: string; value: string }>;
};

const VALID_KINDS: FormKind[] = ["leads", "quiz", "application", "survey"];
const VALID_TYPES: FormQuestionType[] = ["text", "email", "tel", "textarea", "select"];
export const isFormId = (id: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
function safeMedia(value:unknown):string{if(typeof value!=="string")return "";try{const url=new URL(value);return url.protocol==="https:"&&!url.username&&!url.password&&value.length<=2000?url.toString():"";}catch{return "";}}
export function normalizeForm(value: unknown): FormInput {
  if (!value || typeof value !== "object") throw new Error("Formulário inválido.");
  const raw = value as Record<string, unknown>;
  const title = String(raw.title || "").trim().slice(0, 100);
  if (title.length < 3) throw new Error("Informe um título de pelo menos 3 caracteres.");
  const description = String(raw.description || "").trim().slice(0, 350);
  const kind: FormKind = VALID_KINDS.includes(raw.kind as FormKind) ? raw.kind as FormKind : "leads";
  const intent = String(raw.intent || "").trim().slice(0, 50000);
  const whatsapp = String(raw.whatsapp || "").replace(/\D/g, "").slice(0, 15);
  if (!Array.isArray(raw.fields) || !raw.fields.length || raw.fields.length > 20) {
    throw new Error("Adicione de 1 a 20 perguntas.");
  }
  const fields: FormQuestion[] = raw.fields.map((item, index) => {
    if (!item || typeof item !== "object") throw new Error("Pergunta inválida.");
    const q = item as Record<string, unknown>;
    const label = String(q.label || "").trim().slice(0, 180);
    if (label.length < 3) throw new Error("Revise o texto da pergunta " + (index + 1) + ".");
    const type: FormQuestionType = VALID_TYPES.includes(q.type as FormQuestionType) ? q.type as FormQuestionType : "text";
    const options = type === "select" && Array.isArray(q.options)
      ? q.options.map(x => String(x).trim().slice(0, 100)).filter(Boolean).slice(0, 12)
      : [];
    if (type === "select" && options.length < 2) throw new Error("A pergunta " + (index + 1) + " precisa de pelo menos duas opções.");
    return {
      id: typeof q.id === "string" && /^[\w-]{1,70}$/.test(q.id) ? q.id : "pergunta-" + index,
      label, type, required: q.required !== false, options, imageUrl:safeMedia(q.imageUrl),
    };
  });
  if (new Set(fields.map(f => f.id)).size !== fields.length) {
    throw new Error("Há perguntas duplicadas. Revise o formulário.");
  }
  return { title, description, kind, intent, whatsapp, fields,
    coverImageUrl:safeMedia(raw.coverImageUrl), backgroundImageUrl:safeMedia(raw.backgroundImageUrl),
    visualTheme:raw.visualTheme==="rose"?"rose":raw.visualTheme==="midnight"?"midnight":"emerald", motion:raw.motion!==false };
}
