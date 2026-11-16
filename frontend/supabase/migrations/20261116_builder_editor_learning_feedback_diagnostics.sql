-- Applied to PageNova AI Production on 2026-11-16.
-- Preserve all user feedback, RLS policies and existing approval decisions.
-- The frontend emits remove-section, layout and buttons; old constraints rejected them.
alter table public.builder_editor_learning_events
 drop constraint if exists builder_editor_learning_events_intent_check,
 add constraint builder_editor_learning_events_intent_check
 check (intent in ('image','add-section','remove-section','layout','style','copy','other'));
alter table public.builder_editor_learning_events
 drop constraint if exists builder_editor_learning_events_target_check,
 add constraint builder_editor_learning_events_target_check
 check (target in ('buttons','testimonials','hero','services','differences','gallery','faq','contact','footer','sections','unspecified'));
alter table public.builder_editor_learning_events
 add column if not exists section_key text,
 add column if not exists failure_code text;
alter table public.builder_editor_learning_events
 drop constraint if exists builder_editor_learning_events_section_key_check,
 add constraint builder_editor_learning_events_section_key_check
 check (section_key is null or char_length(section_key) between 1 and 100);
alter table public.builder_editor_learning_events
 drop constraint if exists builder_editor_learning_events_failure_code_check,
 add constraint builder_editor_learning_events_failure_code_check
 check (failure_code is null or failure_code in ('parse','missing-target','no-change','unrequested-change','postcondition','unsupported','unknown'));
