-- Step 1/9: harden exact user-reviewed feedback in PageNova AI.
-- Safe for existing 56+ events: changes policy and permissions only; no historical rows are rewritten.
-- User review and automatic execution status are intentionally independent.
ALTER TABLE public.builder_editor_learning_events ENABLE ROW LEVEL SECURITY;

-- PostgREST users must not rewrite an event's immutable classification, strategy,
-- execution result, ownership, creation time, or other learning metadata.
REVOKE UPDATE, TRUNCATE, TRIGGER, REFERENCES
  ON TABLE public.builder_editor_learning_events FROM authenticated;
GRANT UPDATE (review_status, reviewed_at)
  ON TABLE public.builder_editor_learning_events TO authenticated;

DROP POLICY IF EXISTS "Users can review own editor learning events"
  ON public.builder_editor_learning_events;
CREATE POLICY "Users can review own editor learning events"
  ON public.builder_editor_learning_events FOR UPDATE TO authenticated
  USING ((select auth.uid()) = user_id AND review_status = 'pending')
  WITH CHECK (
    (select auth.uid()) = user_id
    AND review_status IN ('approved','rejected')
    AND reviewed_at IS NOT NULL
  );
