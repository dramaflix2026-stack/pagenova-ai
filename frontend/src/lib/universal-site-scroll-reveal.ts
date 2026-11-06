/**
 * PageNova universal scroll-reveal layer.
 *
 * Runs on the actual rendered site (including isolated Builder iframe) rather
 * than the editor toolbar. Preserves the existing template-specific motion
 * system, interactive transforms, and explicit per-site motion opt-outs.
 */
import type { SiteMotion, MotionEffect, MotionRule } from "./site-builder-animation";

const CANDIDATE_SELECTOR = "h2,h3,p,article,figure,blockquote,img";
const SECTION_SELECTOR = "section,[data-universal-section]";
const EXISTING_ANIMATION_SELECTOR =
  ".pn-motion-site,.pn-motion-target,.pn-wellness-reveal,.pn-food-scroll-reveal,.pn-scroll-reveal";

const isOneOf = (element: HTMLElement, selector: string) => element.matches(selector);

function canAnimate(element: HTMLElement, view: Window): boolean {
  if (!element.isConnected || element.closest(EXISTING_ANIMATION_SELECTOR)) return false;
  if (element.closest("header,nav,dialog,details:not([open]),[hidden],[aria-hidden='true']")) return false;
  if (isOneOf(element,"script,style,iframe,video,svg,button,input,textarea,select")) return false;
  if (isOneOf(element,"h2,h3,p") && element.closest("article,figure,blockquote")) return false;
  if (isOneOf(element,"img") && element.closest("article,figure,a,picture,button")) return false;
  if (element.hasAttribute("data-pn-global-scroll-reveal")) return false;
  // Avoid changing the position of 3D/tilt controls or custom floating UI.
  if (element.style.transform && element.style.transform !== "none") return false;
  if (element.style.opacity && element.style.opacity !== "1") return false;
  const style = view.getComputedStyle?.(element);
  if (style && (
    style.display === "none" || style.visibility === "hidden" || style.opacity === "0" ||
    (style.transform && style.transform !== "none") || (style.animationName && style.animationName !== "none") ||
    style.position === "fixed" || style.position === "sticky" || style.position === "absolute"
  )) return false;
  return true;
}

function sectionRule(config: SiteMotion | undefined, section: HTMLElement, element: HTMLElement): MotionRule | undefined {
  const id=section.getAttribute("data-section-id") || section.getAttribute("data-universal-section") || section.id;
  const blockId=element.getAttribute("data-block-id");
  return (blockId && config?.blocks?.[blockId]) || (id && config?.sections?.[id]) || undefined;
}

function chooseEffect(element: HTMLElement, rule: MotionRule | undefined): MotionEffect {
  if (rule?.effect && rule.effect !== "pulse" && rule.effect !== "float") return rule.effect;
  if (isOneOf(element,"figure,img")) return "fade-right";
  if (isOneOf(element,"article,blockquote")) return "fade-up";
  if (isOneOf(element,"p")) return "fade-left";
  return "fade-up";
}

export function attachUniversalScrollReveal(root: HTMLElement | null, config?: SiteMotion): () => void {
  if (!root) return () => {};
  const view=root.ownerDocument.defaultView;
  if (!view || config?.preset==="none") return () => {};
  const ObserverClass=(view as Window & typeof globalThis).IntersectionObserver;
  if (!ObserverClass) return () => {};
  if (view.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return () => {};
  const mobile = view.matchMedia?.("(max-width: 767px)").matches ?? false;
  if (mobile && config?.mobile==="none") return () => {};

  let disposed=false;
  let refreshFrame=0;
  const pendingFrames = new Set<number>();
  const touched: HTMLElement[]=[];
  const seen = new WeakSet<HTMLElement>();
  const shown = (el:HTMLElement)=>{
    if(disposed || !el.isConnected) return;
    el.classList.add("pn-global-scroll-visible");
    observer.unobserve(el);
  };
  const observer = new ObserverClass((entries)=>{
    entries.forEach(entry=>{if(entry.isIntersecting)shown(entry.target as HTMLElement);});
  },{threshold:0.07,rootMargin:"0px 0px -24px 0px"});

  const revealSoon=(element:HTMLElement)=>{
    // Paint the initial offset first so an entry in the viewport animates.
    const first=view.requestAnimationFrame(()=>{
      pendingFrames.delete(first);
      const second=view.requestAnimationFrame(()=>{
        pendingFrames.delete(second);
        shown(element);
      });
      pendingFrames.add(second);
    });
    pendingFrames.add(first);
  };

  const scan=()=>{
    if(disposed) return;
    const sections=Array.from(root.querySelectorAll<HTMLElement>(SECTION_SELECTOR));
    sections.forEach((section,sectionIndex)=>{
      if (section.closest(".pn-motion-site,[hidden],[aria-hidden='true']")) return;
      let count=0;
      let paragraphs=0;
      let headings=0;
      const children=Array.from(section.querySelectorAll<HTMLElement>(CANDIDATE_SELECTOR));
      for(const candidate of children) {
        if (count >= 18) break;
        if(seen.has(candidate) || !canAnimate(candidate,view)) continue;
        // Prefer the card/container over its children; don't animate dozens
        // of body paragraphs independently on complex editorial pages.
        if(candidate.matches("p") && ++paragraphs > 3) continue;
        if(candidate.matches("h2,h3") && ++headings > 5) continue;
        const rule=sectionRule(config,section,candidate);
        if(rule?.effect==="none") continue;
        if((rule?.device==="desktop" && mobile) || (rule?.device==="mobile" && !mobile)) continue;
        const effect=chooseEffect(candidate,rule);
        if(effect==="none") continue;
        seen.add(candidate);
        touched.push(candidate);
        count++;
        const delay=rule?.staggerMs ?? (config?.preset==="dynamic" ? 95 : 65);
        candidate.dataset.pnGlobalScrollReveal=effect;
        candidate.style.setProperty("--pn-global-scroll-duration",`${rule?.durationMs ?? (config?.preset==="dynamic" ? 810 : 650)}ms`);
        candidate.style.setProperty("--pn-global-scroll-delay",`${Math.min(350,(count-1)%4*delay)}ms`);
        candidate.classList.add("pn-global-scroll-reveal");

        const bounds=candidate.getBoundingClientRect();
        // Already scrolled past: do not make it disappear on editing/re-render.
        if(bounds.bottom<=0){shown(candidate);continue;}
        if(bounds.top<view.innerHeight*.9 && bounds.bottom>0){revealSoon(candidate);continue;}
        observer.observe(candidate);
      }
    });
  };

  scan();
  // Handles AI edits that insert/reorder sections after initial hydration.
  const MutationObserverClass=(view as Window & typeof globalThis).MutationObserver;
  const changes=MutationObserverClass ? new MutationObserverClass((records)=>{
    if(!records.some(record=>record.type==="childList" && (record.addedNodes.length || record.removedNodes.length)))return;
    if(refreshFrame)view.cancelAnimationFrame(refreshFrame);
    refreshFrame=view.requestAnimationFrame(()=>{refreshFrame=0;scan();});
  }):null;
  changes?.observe(root,{subtree:true,childList:true});

  return ()=>{
    disposed=true;
    observer.disconnect();
    changes?.disconnect();
    if(refreshFrame)view.cancelAnimationFrame(refreshFrame);
    pendingFrames.forEach(frame=>view.cancelAnimationFrame(frame));
    touched.forEach(el=>{
      el.classList.remove("pn-global-scroll-reveal","pn-global-scroll-visible");
      el.removeAttribute("data-pn-global-scroll-reveal");
      el.style.removeProperty("--pn-global-scroll-duration");
      el.style.removeProperty("--pn-global-scroll-delay");
    });
  };
}
