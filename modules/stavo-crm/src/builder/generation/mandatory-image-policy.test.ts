import { describe, expect, it } from 'vitest';
import { choosePrimaryHeroImage, imageGenerationKeyPresent, requiredIllustrationSlots } from './mandatory-image-policy';

type Image = { assetId: string; source: string; description: string; width: number; height: number };
const google = (assetId: string, width = 1200, height = 800): Image =>
  ({ assetId, source: 'GOOGLE_PLACES', description: 'Verified business photograph', width, height });
const upload = (assetId: string): Image =>
  ({ assetId, source: 'UPLOAD', description: 'Uploaded photo', width: 1200, height: 800 });
const illustration = (assetId: string, slot = 'hero'): Image =>
  ({ assetId, source: 'AI_GENERATED', description: `[${slot}] Illustrative image`, width: 1536, height: 1024 });

describe('CRM image slot policy', () => {
  it('uses synthetic images only for missing slots', () => {
    expect(requiredIllustrationSlots(0)).toEqual(['hero', 'about', 'supplement']);
    expect(requiredIllustrationSlots(1)).toEqual(['about', 'supplement']);
    expect(requiredIllustrationSlots(2)).toEqual(['supplement']);
    expect(requiredIllustrationSlots(3)).toEqual([]);
    expect(requiredIllustrationSlots(8)).toEqual([]);
  });

  it('safely handles invalid image counts and absent provider key', () => {
    expect(requiredIllustrationSlots(Number.NaN)).toEqual(['hero', 'about', 'supplement']);
    expect(requiredIllustrationSlots(-1)).toEqual(['hero', 'about', 'supplement']);
    expect(imageGenerationKeyPresent(' ')).toBe(false);
    expect(imageGenerationKeyPresent('test-key')).toBe(true);
  });

  it('puts an actual Google Places image before even a generated AI hero', () => {
    const hero = choosePrimaryHeroImage([illustration('synthetic'),google('business-photo')]);
    expect(hero?.assetId).toBe('business-photo');
  });

  it('places a unique landscape Google photo in the hero and reserves portraits for About', () => {
    const hero = choosePrimaryHeroImage([
      illustration('synthetic'), google('portrait', 450, 900), google('landscape', 1600, 900),
    ], 'portrait');
    expect(hero?.assetId).toBe('landscape');
  });

  it('uses the sole real portrait in the hero rather than replacing it with AI', () => {
    expect(choosePrimaryHeroImage([illustration('synthetic'),google('portrait', 450, 900)])?.assetId)
      .toBe('portrait');
  });

  it('uses a user-owned image when Google has no candidate', () => {
    expect(choosePrimaryHeroImage([illustration('synthetic'),upload('client-photo')])?.assetId)
      .toBe('client-photo');
  });

  it('retains AI hero fallback when no verified business photo exists', () => {
    expect(choosePrimaryHeroImage([illustration('about','about'),illustration('hero')])?.assetId)
      .toBe('hero');
  });
});
