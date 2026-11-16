-- PageNova AI: delivery 03/15 — interpretation evidence for existing feedback.
-- Records what a PRIVACY-SAFE rules classifier identified, NOT what the AI
-- definitively understood nor what the browser visually rendered.
-- Historic records remain NULL; no reclassification or invented evidence.
ALTER TABLE public.builder_editor_learning_events
 ADD COLUMN IF NOT EXISTS interpretation_source text,
 ADD COLUMN IF NOT EXISTS interpretation_status text,
 ADD COLUMN IF NOT EXISTS interpreted_element text,
 ADD COLUMN IF NOT EXISTS interpreted_property text,
 ADD COLUMN IF NOT EXISTS requested_value_kind text,
 ADD COLUMN IF NOT EXISTS requested_value text,
 ADD COLUMN IF NOT EXISTS family_id smallint,
 ADD COLUMN IF NOT EXISTS template_id text;

ALTER TABLE public.builder_editor_learning_events
 ADD CONSTRAINT builder_editor_interpretation_v1_chk CHECK (
  (
    interpretation_source IS NULL AND interpretation_status IS NULL
    AND interpreted_element IS NULL AND interpreted_property IS NULL
    AND requested_value_kind IS NULL AND requested_value IS NULL
    AND family_id IS NULL AND template_id IS NULL
  )
  OR (
    interpretation_source='rules-v1'
    AND interpretation_status IN ('explicit','partial','unavailable')
    AND (interpreted_element IS NULL OR interpreted_element IN
      ('section','heading','paragraph','button','image','card'))
    AND (interpreted_property IS NULL OR interpreted_property IN
      ('backgroundColor','color','text','src','align','order','presence','count'))
    AND (family_id IS NULL OR family_id BETWEEN 1 AND 10)
    AND (template_id IS NULL OR template_id IN
      ('institutional-complete','minimalist-sophisticated','prompt-adaptive'))
    AND (
      (requested_value_kind IS NULL AND requested_value IS NULL)
      OR (requested_value_kind='hex' AND requested_value ~ '^#[0-9A-F]{6}$'
        AND interpreted_property IN ('backgroundColor','color'))
      OR (requested_value_kind='named-color' AND requested_value IN
        ('azul','verde','vermelho','preto','branco','cinza','grafite',
         'laranja','amarelo','dourado','roxo','rosa','bege','marrom')
        AND interpreted_property IN ('backgroundColor','color'))
      OR (requested_value_kind='alignment' AND requested_value IN
        ('left','center','right') AND interpreted_property='align')
      OR (requested_value_kind='count' AND requested_value ~ '^([1-9]|[1-9][0-9])$'
        AND interpreted_property IN ('presence','count'))
    )
    AND (
      interpretation_status<>'unavailable'
      OR (interpreted_element IS NULL AND interpreted_property IS NULL
          AND requested_value_kind IS NULL AND requested_value IS NULL)
    )
    AND (
      interpretation_status<>'explicit'
      OR (interpreted_element IS NOT NULL AND interpreted_property IS NOT NULL)
    )
  )
);

-- Existing event ownership RLS, review-only column permissions, solution
-- memories and reuse attribution remain unchanged. No new public APIs, no
-- unrestricted UPDATE grants, and no content-specific private metadata.
