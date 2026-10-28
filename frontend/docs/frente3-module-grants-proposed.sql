-- Frente 3 / PROPOSAL ONLY. Do not execute against production without approval.
-- Existing family grants remain valid; add fine-grained codes to both constraints.
-- This file is an implementation proposal, not an applied migration.
BEGIN;

ALTER TABLE public.pagenova_commercial_module_grants
  DROP CONSTRAINT IF EXISTS pagenova_commercial_module_grants_module_code_check;
ALTER TABLE public.pagenova_commercial_module_grants
  ADD CONSTRAINT pagenova_commercial_module_grants_module_code_check
  CHECK (module_code IN (
    'crm','studio','apps',
    'studio.sites','studio.landing','studio.cloner','studio.forms',
    'studio.quizzes','studio.ebooks',
    'crm.search','crm.leads','crm.operations'
  ));

ALTER TABLE public.pagenova_commercial_plan_modules
  DROP CONSTRAINT IF EXISTS pagenova_commercial_plan_modules_module_code_check;
ALTER TABLE public.pagenova_commercial_plan_modules
  ADD CONSTRAINT pagenova_commercial_plan_modules_module_code_check
  CHECK (module_code IN (
    'crm','studio','apps',
    'studio.sites','studio.landing','studio.cloner','studio.forms',
    'studio.quizzes','studio.ebooks',
    'crm.search','crm.leads','crm.operations'
  ));

COMMIT;
