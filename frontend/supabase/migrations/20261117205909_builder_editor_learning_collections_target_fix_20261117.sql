-- PageNova AI — production migration 20261117205909.
-- Fix schema/client taxonomy mismatch discovered in TP6 Floricultura M01 Test 02.
-- The TypeScript classifier emits target='collections', which the old CHECK
-- rejected (23514); no prior failures or approvals are changed by this migration.
-- Keep owner RLS, exact reviews and solution/reuse tables untouched.
ALTER TABLE public.builder_editor_learning_events
  DROP CONSTRAINT IF EXISTS builder_editor_learning_events_target_check,
  ADD CONSTRAINT builder_editor_learning_events_target_check
  CHECK (target IN (
    'buttons','testimonials','hero','services','collections','differences',
    'gallery','faq','contact','footer','sections','unspecified'
  ));
-- Never backfill a successful operation without its original user/DOM evidence.
