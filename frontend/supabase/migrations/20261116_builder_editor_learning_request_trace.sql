-- PageNova AI / Motor Universal — delivery 01 of 15.
-- Extend the existing event stream with request-level trace metadata.
-- Historical rows remain NULL: they must not receive invented request IDs.
ALTER TABLE public.builder_editor_learning_events
  ADD COLUMN IF NOT EXISTS request_id uuid,
  ADD COLUMN IF NOT EXISTS project_id text,
  ADD COLUMN IF NOT EXISTS operation_index integer,
  ADD COLUMN IF NOT EXISTS submitted_at timestamptz;

ALTER TABLE public.builder_editor_learning_events
  ADD CONSTRAINT builder_learning_trace_complete_chk CHECK (
    (request_id IS NULL AND operation_index IS NULL AND submitted_at IS NULL AND project_id IS NULL)
    OR
    (request_id IS NOT NULL AND operation_index BETWEEN 1 AND 64 AND submitted_at IS NOT NULL
      AND (project_id IS NULL OR (char_length(project_id) BETWEEN 1 AND 128)))
  );

CREATE INDEX IF NOT EXISTS builder_editor_learning_events_request_trace_idx
  ON public.builder_editor_learning_events(user_id, request_id, operation_index)
  WHERE request_id IS NOT NULL;

-- No RLS changes, UPDATE grants, prompt storage, or historical backfill.
