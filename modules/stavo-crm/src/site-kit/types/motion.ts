/**
 * Preset de movimento, visto pela camada de tipos.
 *
 * A lista de verdade vive em `interactions/motion.ts`, junto das
 * especificacoes que o runtime consome. Aqui ela so e reexportada com o nome
 * que o resto da arquitetura usa (`MotionPreset`), para nao existirem duas
 * listas capazes de divergir.
 */
export { MOTION_PRESETS, presetsForLevel, type MotionPresetId } from '@site-kit/interactions/motion';

export type { MotionPresetId as MotionPreset } from '@site-kit/interactions/motion';

/**
 * Niveis de movimento do briefing. Reexportados de `types/site-ai.ts`, onde
 * ja eram definidos: duas listas iguais so servem para divergir depois.
 */
export { MOTION_LEVELS, type MotionLevel } from '@site-kit/types/site-ai';
