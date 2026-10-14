import { describe, expect, it } from 'vitest';
import { frigologReferenceData, validateUniversalSiteData } from './frigolog-template-data.generated';

function withHeroImage(src: string) {
  return {
    ...frigologReferenceData,
    hero: { ...frigologReferenceData.hero, image: { ...frigologReferenceData.hero.image, src } },
  };
}

describe('FRIGOLOG preview image validation', () => {
  it('accepts authenticated photos embedded as raster data URLs', () => {
    for (const mime of ['webp', 'png', 'jpeg']) {
      const config = withHeroImage(`data:image/${mime};base64,aGVsbG8=`);
      expect(validateUniversalSiteData(config)).toEqual([]);
    }
  });

  it('keeps denying script-capable URLs', () => {
    for (const src of ['javascript:alert(1)', 'data:text/html;base64,aGVsbG8=', 'data:image/svg+xml;base64,aGVsbG8=']) {
      expect(validateUniversalSiteData(withHeroImage(src))).toContain('Invalid hero image');
    }
  });

  it('retains compatibility with empty and relative sources', () => {
    expect(validateUniversalSiteData(withHeroImage(''))).toEqual([]);
    expect(validateUniversalSiteData(withHeroImage('/assets/test.webp'))).toEqual([]);
  });
});
