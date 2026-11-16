-- PageNova AI / Motor Universal — delivery 05/15: evidence-aware diagnosis.
-- No raw error text, stack traces, prompts, URLs, images or arbitrary JSON.
-- Extends existing owner-scoped events, preserves historical NULL values.
ALTER TABLE public.builder_editor_learning_events
 ADD COLUMN IF NOT EXISTS diagnosis_source text,
 ADD COLUMN IF NOT EXISTS diagnosis_status text,
 ADD COLUMN IF NOT EXISTS diagnosis_stage text,
 ADD COLUMN IF NOT EXISTS diagnosis_code text,
 ADD COLUMN IF NOT EXISTS diagnosis_cause text,
 ADD COLUMN IF NOT EXISTS diagnosis_evidence text,
 ADD COLUMN IF NOT EXISTS diagnosis_confidence smallint;

ALTER TABLE public.builder_editor_learning_events
 ADD CONSTRAINT builder_editor_diagnosis_v1_chk CHECK (
  (
   diagnosis_source IS NULL AND diagnosis_status IS NULL
   AND diagnosis_stage IS NULL AND diagnosis_code IS NULL
   AND diagnosis_cause IS NULL AND diagnosis_evidence IS NULL
   AND diagnosis_confidence IS NULL
  )
  OR (
   execution_status='rejected'
   AND diagnosis_source='deterministic-v1'
   AND diagnosis_status IN ('observed','hypothesis','undiagnosed')
   AND diagnosis_stage IN (
    'interpretation','target-resolution','state-verification',
    'visual-verification','execution','persistence','network','unknown'
   )
   AND diagnosis_code IN (
    'parse','missing-target','no-change','unrequested-change',
    'postcondition','unsupported','unknown'
   )
   AND (
    diagnosis_cause IS NULL OR diagnosis_cause IN (
     'command-interpretation','target-resolution','mutation-no-op',
     'unexpected-mutation','unverified-postcondition','unsupported-operation'
    )
   )
   AND diagnosis_evidence IN (
    'state-postcondition','dom-section-absent','dom-color-mismatch',
    'dom-photo-absent','dom-layout-mismatch','no-state-delta',
    'preflight-missing-hex','strategy-label','none'
   )
   AND (
    (
     diagnosis_status='observed'
     AND diagnosis_confidence=90
     AND diagnosis_cause IS NULL
     AND (
      (diagnosis_evidence='state-postcondition' AND diagnosis_code='postcondition'
       AND diagnosis_stage='state-verification')
      OR (diagnosis_evidence='dom-section-absent' AND diagnosis_code='missing-target'
       AND diagnosis_stage='visual-verification')
      OR (diagnosis_evidence IN ('dom-color-mismatch','dom-photo-absent','dom-layout-mismatch')
       AND diagnosis_code='postcondition' AND diagnosis_stage='visual-verification')
      OR (diagnosis_evidence='no-state-delta' AND diagnosis_code='no-change'
       AND diagnosis_stage='state-verification')
      OR (diagnosis_evidence='preflight-missing-hex' AND diagnosis_code='parse'
       AND diagnosis_stage='interpretation')
     )
    )
    OR (
     diagnosis_status='hypothesis'
     AND diagnosis_confidence=35
     AND diagnosis_evidence='strategy-label'
     AND (
      (diagnosis_code='parse' AND diagnosis_cause='command-interpretation'
       AND diagnosis_stage='interpretation')
      OR (diagnosis_code='missing-target' AND diagnosis_cause='target-resolution'
       AND diagnosis_stage='target-resolution')
      OR (diagnosis_code='no-change' AND diagnosis_cause='mutation-no-op'
       AND diagnosis_stage='execution')
      OR (diagnosis_code='unrequested-change' AND diagnosis_cause='unexpected-mutation'
       AND diagnosis_stage='state-verification')
      OR (diagnosis_code='postcondition' AND diagnosis_cause='unverified-postcondition'
       AND diagnosis_stage='state-verification')
      OR (diagnosis_code='unsupported' AND diagnosis_cause='unsupported-operation'
       AND diagnosis_stage='execution')
     )
    )
    OR (
     diagnosis_status='undiagnosed'
     AND diagnosis_confidence=0
     AND diagnosis_code='unknown' AND diagnosis_cause IS NULL
     AND diagnosis_evidence='none'
    )
   )
  )
 );

-- Inherited RLS restricts access to (select auth.uid())=user_id.
-- Existing authenticated INSERT-only diagnosis fields cannot be rewritten.
-- User approval/rejection remains separate from technical observations.
