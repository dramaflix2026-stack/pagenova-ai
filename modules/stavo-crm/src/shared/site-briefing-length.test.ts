import { describe, expect, it } from 'vitest';
import { siteBriefingSchema } from './schemas';

describe('site generator conversational briefing', () => {
  it('preserves long instructions and audience descriptions without character truncation', () => {
    const instructions = 'Desenvolva um site com estas orientações. '.repeat(400);
    const audience = 'Público-alvo detalhado. '.repeat(400);
    const description = 'Descrição fornecida pelo cliente. '.repeat(300);

    const parsed = siteBriefingSchema.parse({
      business: {
        name: 'Clínica Aurora',
        audience,
        description,
      },
      objective: { goal: 'QUOTE_REQUESTS' },
      style: {
        theme: 'AI_DECIDES',
        density: 'BALANCED',
        motionLevel: 'BALANCED',
      },
      freeformInstructions: instructions,
    });

    expect(parsed.freeformInstructions).toBe(instructions.trim());
    expect(parsed.business.audience).toBe(audience.trim());
    expect(parsed.business.description).toBe(description.trim());
  });
});
