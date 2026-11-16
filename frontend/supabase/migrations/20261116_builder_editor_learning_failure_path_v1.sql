-- PageNova AI Motor Universal: delivery 04/15 — visible failure path coverage.
-- This is a workflow label, not a diagnosis or a raw error message.
-- Reuse the existing per-user event stream and its RLS/feedback UUIDs.
ALTER TABLE public.builder_editor_learning_events
 ADD COLUMN IF NOT EXISTS failure_path text;

ALTER TABLE public.builder_editor_learning_events
 ADD CONSTRAINT builder_editor_failure_path_v1_chk CHECK (
  failure_path IS NULL OR (
   execution_status='rejected' AND
   failure_path IN (
    'preflight','reference-image','real-estate-gallery',
    'image-restore','banner-copy','immersive-section',
    'immersive-gallery','immersive-image','institutional-image',
    'image-generation','generation-images','generation-attachments',
    'persistence','ai-editor','site-generation'
   )
  )
 );
-- No guessed backfill, no new learning table, no UPDATE rights, no RLS changes.
