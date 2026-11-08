import { describe, expect, it } from 'vitest';
import { imageGenerationKeyPresent, requiredIllustrationSlots, selectVerifiedGoogleCover } from '@builder/generation/mandatory-image-policy';

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

describe('CRM Google Places verified cover priority', () => {
  const item=(assetId:string,source:string,width:number,height:number)=>({assetId,source,width,height});
  it('prefers an authentic landscape image over any generated Hero illustration', () => {
    const assets=[item('ai','AI_GENERATED',1920,1080),item('portrait','GOOGLE_PLACES',600,900),item('storefront','GOOGLE_PLACES',1600,1000)];
    expect(selectVerifiedGoogleCover(assets)?.assetId).toBe('storefront');
  });
  it('uses a portrait Google image if it is the only verified photo', () => {
    expect(selectVerifiedGoogleCover([item('ai','AI_GENERATED',1920,1080),item('only','GOOGLE_PLACES',700,1100)])?.assetId).toBe('only');
  });
  it('keeps the editorial hero fallback when Google did not provide real photos', () => {
    expect(selectVerifiedGoogleCover([item('ai','AI_GENERATED',1920,1080)])).toBeUndefined();
  });
});
