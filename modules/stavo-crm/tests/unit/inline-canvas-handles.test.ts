import { describe,expect,it } from 'vitest';
import { calculateCanvasSizing } from '@client/components/site-ai/editor/inlineCanvasHandles';

describe('PageNova touch/mouse canvas block interactions', () => {
  it('moves by dragging the selected block itself, without a move grip', () => {
    expect(calculateCanvasSizing({offsetX:10,offsetY:-5},240,120,35,-20,'move'))
      .toMatchObject({offsetX:45,offsetY:-25});
  });
  it('resizes width and height from the lower corner', () => {
    expect(calculateCanvasSizing({},300,180,-40,25,'se'))
      .toMatchObject({widthPx:260,heightPx:205});
  });
  it('resizes one dimension from the appropriate edge', () => {
    expect(calculateCanvasSizing({},300,180,55,45,'e')).toMatchObject({widthPx:355});
    expect(calculateCanvasSizing({},300,180,55,45,'s')).toMatchObject({heightPx:225});
    expect(calculateCanvasSizing({},300,180,55,45,'e').heightPx).toBeUndefined();
  });
  it('keeps geometry within safe mobile bounds', () => {
    expect(calculateCanvasSizing({},300,180,-1000,-1000,'se'))
      .toMatchObject({widthPx:64,heightPx:48});
    expect(calculateCanvasSizing({offsetX:395,offsetY:395},300,180,80,80,'move'))
      .toMatchObject({offsetX:400,offsetY:400});
  });
});
