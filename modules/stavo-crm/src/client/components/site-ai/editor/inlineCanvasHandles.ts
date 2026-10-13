/**
 * A small selection outline inside the same-origin preview. The whole selected
 * element can be dragged directly; only edge/corner grips resize it. Nothing
 * from this overlay reaches the published HTML.
 */
export interface CanvasSizing {
  offsetX?: number;
  offsetY?: number;
  widthPx?: number;
  heightPx?: number;
}
type ResizeDirection = 'se' | 'e' | 's';
type GestureMode = 'move' | ResizeDirection;
interface Gesture {
  pointerId: number;
  startX: number;
  startY: number;
  initialX: number;
  initialY: number;
  initialWidth: number;
  initialHeight: number;
  mode: GestureMode;
  moved: boolean;
}
const clamp = (value: number, min: number, max: number) =>
  Math.round(Math.max(min, Math.min(max, value)));

/** Pure sizing logic also used by touch and mouse, with equal movement ranges. */
export function calculateCanvasSizing(
  initial: CanvasSizing,
  startWidth: number,
  startHeight: number,
  dx: number,
  dy: number,
  mode: GestureMode,
): CanvasSizing {
  if (mode === 'move') {
    return {
      ...initial,
      offsetX: clamp((initial.offsetX ?? 0) + dx, -400, 400),
      offsetY: clamp((initial.offsetY ?? 0) + dy, -400, 400),
    };
  }
  return {
    ...initial,
    widthPx: mode === 'e' || mode === 'se'
      ? clamp(startWidth + dx, 64, 1600) : initial.widthPx,
    heightPx: mode === 's' || mode === 'se'
      ? clamp(startHeight + dy, 48, 1200) : initial.heightPx,
  };
}
export function mountCanvasHandles(
  doc: Document,
  target: HTMLElement,
  current: CanvasSizing,
  onCommit: () => void,
): () => void {
  const win = doc.defaultView;
  const overlay = doc.createElement('div');
  overlay.dataset.pnCanvasControl = '1';
  overlay.style.cssText = 'position:fixed;z-index:2147483000;pointer-events:none;' +
    'border:1.5px solid #00a88c;border-radius:3px;box-sizing:border-box;';
  overlay.setAttribute('aria-label', 'Elemento selecionado: arraste-o para mover e use o canto para redimensionar');
  const grips: HTMLButtonElement[] = [];
  const addGrip = (mode: ResizeDirection, position: string, symbol: string, label: string) => {
    const button = doc.createElement('button');
    button.type = 'button';
    button.textContent = symbol;
    button.dataset.pnResize = mode;
    button.setAttribute('aria-label', label);
    button.title = label;
    button.style.cssText = 'position:absolute;pointer-events:auto;touch-action:none;' +
      'width:34px;height:34px;display:flex;align-items:center;justify-content:center;' +
      'border:1.5px solid #fff;border-radius:10px;background:#008e7d;color:white;' +
      'font:700 20px/1 sans-serif;box-shadow:0 2px 7px #0004;' +
      'user-select:none;-webkit-user-select:none;cursor:nwse-resize;' + position;
    overlay.appendChild(button);
    grips.push(button);
    return button;
  };
  const corner = addGrip('se','right:-17px;bottom:-17px;','↘','Arraste este canto para alterar a largura e a altura');
  const right = addGrip('e','right:-17px;top:calc(50% - 17px);','↔','Arraste para ajustar a largura');
  const bottom = addGrip('s','left:calc(50% - 17px);bottom:-17px;','↕','Arraste para ajustar a altura');
  right.style.cursor = 'ew-resize';
  bottom.style.cursor = 'ns-resize';
  overlay.style.touchAction = 'none';
  doc.body.appendChild(overlay);

  const originalTouchAction = target.style.touchAction;
  const originalUserSelect = target.style.userSelect;
  const originalCursor = target.style.cursor;
  // After one click/tap, the element itself is the drag handle. This also
  // avoids showing the mobile keyboard for mere selection.
  target.style.touchAction = target.isContentEditable ? 'auto' : 'none';
  target.style.userSelect = target.isContentEditable ? 'text' : 'none';
  target.style.cursor = target.isContentEditable ? 'text' : 'grab';

  let gesture: Gesture | null = null;
  const drawOutline = () => {
    if (!target.isConnected) return;
    const rect = target.getBoundingClientRect();
    overlay.style.left = rect.left + 'px';
    overlay.style.top = rect.top + 'px';
    overlay.style.width = Math.max(1, rect.width) + 'px';
    overlay.style.height = Math.max(1, rect.height) + 'px';
  };
  const begin = (mode: GestureMode, event: PointerEvent) => {
    if (gesture || (event.pointerType === 'mouse' && event.button !== 0)) return;
    if (mode === 'move' && target.isContentEditable) return;
    // Do not hijack ordinary native input/select controls.
    if (mode === 'move' && (event.target as HTMLElement).closest('input,textarea,select')) return;
    const box = target.getBoundingClientRect();
    gesture = {
      pointerId:event.pointerId, mode,
      startX:event.clientX, startY:event.clientY,
      initialX:current.offsetX ?? 0, initialY:current.offsetY ?? 0,
      initialWidth:current.widthPx ?? box.width,
      initialHeight:current.heightPx ?? box.height,
      moved:false,
    };
    if (mode !== 'move') {
      event.preventDefault();
      event.stopPropagation();
    }
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
  };
  const update = (event: PointerEvent) => {
    const active = gesture;
    if (!active || active.pointerId !== event.pointerId) return;
    const dx = event.clientX-active.startX;
    const dy = event.clientY-active.startY;
    if (!active.moved && Math.hypot(dx,dy) < 4) return;
    active.moved = true;
    event.preventDefault();
    event.stopPropagation();
    const next = calculateCanvasSizing(
      {offsetX:active.initialX,offsetY:active.initialY,
        widthPx:active.initialWidth,heightPx:active.initialHeight},
      active.initialWidth,active.initialHeight,dx,dy,active.mode,
    );
    if (active.mode === 'move') {
      current.offsetX = next.offsetX;
      current.offsetY = next.offsetY;
      target.style.setProperty('transform',
        'translate('+current.offsetX+'px,'+current.offsetY+'px)','important');
      if (win?.getComputedStyle(target).position === 'static') {
        target.style.setProperty('position','relative','important');
      }
    } else {
      if (next.widthPx !== undefined && active.mode !== 's') {
        current.widthPx = next.widthPx;
        target.style.setProperty('width',current.widthPx+'px','important');
        target.style.setProperty('max-width','100%','important');
      }
      if (next.heightPx !== undefined && active.mode !== 'e') {
        current.heightPx = next.heightPx;
        if (target.tagName === 'ARTICLE') {
          target.style.setProperty('min-height',current.heightPx+'px','important');
        } else {
          target.style.setProperty('height',current.heightPx+'px','important');
        }
        if (target.tagName === 'IMG') target.style.setProperty('object-fit','contain','important');
      }
    }
    drawOutline();
  };
  const finish = (event: PointerEvent) => {
    if (!gesture || gesture.pointerId !== event.pointerId) return;
    const changed = gesture.moved;
    if (changed) update(event);
    gesture = null;
    if (changed) {
      event.preventDefault();
      event.stopPropagation();
      onCommit();
    }
  };
  // Suppress the post-drag click so it cannot select an adjacent text element.
  let lastDraggedAt = 0;
  const pointerUp = (event: PointerEvent) => {
    const changed = Boolean(gesture?.moved);
    finish(event);
    if (changed) lastDraggedAt = Date.now();
  };
  const suppressClick = (event: MouseEvent) => {
    if (Date.now()-lastDraggedAt < 300) {
      event.preventDefault();
      event.stopPropagation();
    }
  };
  target.addEventListener('click',suppressClick,true);
  const hooks: Array<() => void> = [];
  const attach = (element: HTMLElement, mode: GestureMode) => {
    const down = (event: PointerEvent) => begin(mode,event);
    element.addEventListener('pointerdown',down);
    element.addEventListener('pointermove',update);
    element.addEventListener('pointerup',pointerUp);
    element.addEventListener('pointercancel',finish);
    hooks.push(() => {
      element.removeEventListener('pointerdown',down);
      element.removeEventListener('pointermove',update);
      element.removeEventListener('pointerup',pointerUp);
      element.removeEventListener('pointercancel',finish);
    });
  };
  attach(target,'move');
  attach(corner,'se');
  attach(right,'e');
  attach(bottom,'s');
  const resizeObserver = typeof ResizeObserver === 'function' ? new ResizeObserver(drawOutline) : null;
  resizeObserver?.observe(target);
  win?.addEventListener('scroll',drawOutline,{passive:true});
  win?.addEventListener('resize',drawOutline);
  drawOutline();
  return () => {
    gesture = null;
    for (const remove of hooks) remove();
    target.removeEventListener('click',suppressClick,true);
    target.style.touchAction = originalTouchAction;
    target.style.userSelect = originalUserSelect;
    target.style.cursor = originalCursor;
    resizeObserver?.disconnect();
    win?.removeEventListener('scroll',drawOutline);
    win?.removeEventListener('resize',drawOutline);
    overlay.remove();
  };
}
