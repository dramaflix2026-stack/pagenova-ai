-- PageNova AI / Universal Editor — delivery 02 of 15
-- Sanitized original-request excerpts, in the EXISTING owner-scoped feedback table.
-- We do NOT store raw instructions, keys, emails, URLs, contacts or quoted copy.
-- Historic 59+ records remain NULL; omitted requests have an explicit status.
ALTER TABLE public.builder_editor_learning_events
  ADD COLUMN IF NOT EXISTS instruction_redacted text,
  ADD COLUMN IF NOT EXISTS instruction_redaction_version smallint,
  ADD COLUMN IF NOT EXISTS instruction_capture_status text;

ALTER TABLE public.builder_editor_learning_events
  ADD CONSTRAINT builder_learning_safe_instruction_chk CHECK (
    (
      instruction_capture_status IS NULL
      AND instruction_redaction_version IS NULL
      AND instruction_redacted IS NULL
    )
    OR (
      instruction_capture_status='omitted'
      AND instruction_redaction_version=1
      AND instruction_redacted IS NULL
    )
    OR (
      instruction_capture_status='stored'
      AND instruction_redaction_version=1
      AND instruction_redacted IS NOT NULL
      AND char_length(instruction_redacted) BETWEEN 3 AND 480
      AND octet_length(instruction_redacted)<=960
      AND instruction_redacted !~* '(https?://|www[.]|@|data:|[0-9]{7,}|sb_secret|bearer|password|senha|apikey|api[_ -]?key|authorization)'
    )
  );

-- Existing RLS, user ownership, column-update restrictions and exact feedback IDs
-- are unchanged. No raw prompt, automatic backfill, new security-definer
-- functions, credential/secret tables or customer-visible template changes.
