import { describe, expect, it } from 'vitest';
import { detectMime } from '@builder/publishing/image-processing';

describe('Browser/phone image upload formats', () => {
  it('detects files using bytes, regardless of the extension', () => {
    expect(detectMime(Buffer.from([0xff,0xd8,0xff,...Array(12).fill(0)]) )).toEqual({ok:true,mime:'image/jpeg'});
    expect(detectMime(Buffer.from('GIF89a\0\0\0\0\0\0'))).toEqual({ok:true,mime:'image/gif'});
    expect(detectMime(Buffer.from('BM'+'0'.repeat(24)))).toEqual({ok:true,mime:'image/bmp'});
    const heic=Buffer.concat([Buffer.from([0,0,0,24]),Buffer.from('ftypheic'),Buffer.alloc(16)]);
    const avif=Buffer.concat([Buffer.from([0,0,0,24]),Buffer.from('ftypavif'),Buffer.alloc(16)]);
    expect(detectMime(heic)).toEqual({ok:true,mime:'image/heic'});
    expect(detectMime(avif)).toEqual({ok:true,mime:'image/avif'});
  });
  it('refuses active-content files disguised as photos', () => {
    expect(detectMime(Buffer.from('<svg onload="alert(1)"></svg>')).ok).toBe(false);
    expect(detectMime(Buffer.from('<html><script>evil()</script></html>')).ok).toBe(false);
  });
});
