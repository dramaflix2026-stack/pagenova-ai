import { describe, expect, it } from 'vitest';
import { imageGenerationKeyPresent, requiredIllustrationSlots } from '@builder/generation/mandatory-image-policy';

describe('PageNova mandatory site images', () => {
  it('requires a real API credential but no extra obsolete opt-in flag', () => {
    expect(imageGenerationKeyPresent('sk-test')).toBe(true);
    expect(imageGenerationKeyPresent('')).toBe(false);
    expect(imageGenerationKeyPresent('  ')).toBe(false);
    expect(imageGenerationKeyPresent(undefined)).toBe(false);
  });
  it('requires all three illustrations without real photos', () => {
    expect(requiredIllustrationSlots(0)).toEqual(['hero', 'about', 'supplement']);
  });
  it('reserves a real photo for About and generates a distinct process illustration', () => {
    expect(requiredIllustrationSlots(1)).toEqual(['hero', 'supplement']);
  });
  it('requires only hero when enough distinct real photos exist', () => {
    expect(requiredIllustrationSlots(2)).toEqual(['hero']);
    expect(requiredIllustrationSlots(4)).toEqual(['hero']);
  });
  it('treats invalid negative counts as zero', () => {
    expect(requiredIllustrationSlots(NaN)).toEqual(['hero', 'about', 'supplement']);
    expect(requiredIllustrationSlots(-1)).toEqual(['hero', 'about', 'supplement']);
  });
});
