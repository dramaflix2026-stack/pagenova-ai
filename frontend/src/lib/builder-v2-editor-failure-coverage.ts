/**
 * PageNova Universal Editor — delivery 04/15: failure-path coverage.
 *
 * The path is the editor workflow where a visible failure was observed,
 * never a root-cause diagnosis. No raw error messages or private content
 * are persisted. Real causes and confidence are delivery 05.
 */
export const EDITOR_FAILURE_PATHS=[
 "preflight",
 "reference-image",
 "real-estate-gallery",
 "image-restore",
 "banner-copy",
 "immersive-section",
 "immersive-gallery",
 "immersive-image",
 "institutional-image",
 "image-generation",
 "generation-images",
 "generation-attachments",
 "persistence",
 "ai-editor",
 "site-generation"
] as const;
export type EditorFailurePath=typeof EDITOR_FAILURE_PATHS[number];
const allowed=new Set<string>(EDITOR_FAILURE_PATHS);
export function isEditorFailurePath(path:unknown):path is EditorFailurePath{
 return typeof path==="string"&&allowed.has(path);
}
export function shouldCaptureEditorFailure(
 path:unknown,prompt:unknown,alreadyRecorded:boolean
):path is EditorFailurePath{
 return isEditorFailurePath(path)&&
  typeof prompt==="string"&&prompt.trim().length>0&&!alreadyRecorded;
}
