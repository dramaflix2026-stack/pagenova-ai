/**
 * Anchor navigation inside the live preview must not load the Builder URL
 * in its srcdoc iframe. Leave external/document links untouched.
 */
export function interceptPreviewFragmentNavigation(event:MouseEvent, doc:Document):boolean {
  const target=event.target as Element|null;
  const anchor=target?.closest?.("a[href]") as HTMLAnchorElement|null;
  if(!anchor)return false;
  const raw=anchor.getAttribute("href")?.trim()||"";
  if(!raw.startsWith("#"))return false;
  // Hash navigation in about:srcdoc may resolve against the parent Builder URL.
  // Cancel it even if the destination is absent, rather than load a new page.
  event.preventDefault();
  if(raw==="#")return true;
  let sectionId=raw.slice(1);
  try{sectionId=decodeURIComponent(sectionId);}catch{}
  const section=doc.getElementById(sectionId);
  if(!section)return true;
  const win=doc.defaultView;
  if(!win)return true;
  const offset=Number.parseFloat(win.getComputedStyle(section).scrollMarginTop||"0")||0;
  const scrollElement=doc.scrollingElement||doc.documentElement;
  const current=scrollElement?.scrollTop||win.scrollY||0;
  const nextTop=Math.max(0,current+section.getBoundingClientRect().top-offset);
  const reduced=win.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches||false;
  win.scrollTo({top:nextTop,behavior:reduced?"instant":"smooth"});
  return true;
}
