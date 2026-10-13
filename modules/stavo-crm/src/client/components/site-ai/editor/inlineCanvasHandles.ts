/** Pointer/touch handles placed inside the same-origin preview iframe only. */
export interface CanvasSizing {
  offsetX?: number;
  offsetY?: number;
  widthPx?: number;
  heightPx?: number;
}
export function mountCanvasHandles(
  doc: Document,
  target: HTMLElement,
  current: CanvasSizing,
  onCommit: () => void,
): () => void {
  const overlay = doc.createElement('div');
  overlay.dataset.pnCanvasControl = '1';
  overlay.setAttribute('aria-label', 'Controles para mover e redimensionar');
  overlay.style.cssText = 'position:fixed;z-index:2147483000;pointer-events:none;' +
    'border:2px solid #06bd9f;border-radius:4px;box-sizing:border-box;' +
    'box-shadow:0 0 0 2px rgba(255,255,255,.65);';
  const moveButton = doc.createElement('button');
  const resizeButton = doc.createElement('button');
  const styling = 'position:absolute;display:flex;align-items:center;justify-content:center;' +
    'width:40px;height:40px;touch-action:none;user-select:none;-webkit-user-select:none;' +
    'border:2px solid white;border-radius:12px;color:white;background:#0c927e;' +
    'font:700 25px/1 sans-serif;pointer-events:auto;cursor:grab;' +
    'box-shadow:0 2px 10px rgba(0,0,0,.27);';
  moveButton.type = resizeButton.type = 'button';
  moveButton.textContent = '✥';
  moveButton.title = 'Segure e arraste para mover o bloco';
  moveButton.setAttribute('aria-label',moveButton.title);
  moveButton.style.cssText = styling + 'top:-20px;left:-20px;';
  resizeButton.textContent = '↘';
  resizeButton.title = 'Segure e arraste para aumentar ou diminuir o bloco';
  resizeButton.setAttribute('aria-label',resizeButton.title);
  resizeButton.style.cssText = styling + 'bottom:-20px;right:-20px;cursor:nwse-resize;';
  overlay.append(moveButton, resizeButton);
  doc.body.appendChild(overlay);

  const limit = (n: number, min: number, max: number) =>
    Math.round(Math.max(min, Math.min(max, n)));
  const refresh = () => {
    if (!target.isConnected) return;
    const rect = target.getBoundingClientRect();
    overlay.style.left = rect.left + 'px';
    overlay.style.top = rect.top + 'px';
    overlay.style.width = Math.max(1,rect.width) + 'px';
    overlay.style.height = Math.max(1,rect.height) + 'px';
  };
  type Gesture = {
    startX: number; startY: number;
    initialX: number; initialY: number;
    initialWidth: number; initialHeight: number;
    mode: 'move' | 'resize';
  };
  let gesture: Gesture | null = null;
  let activePointer: number | null = null;
  const press = (mode: Gesture['mode'], event: PointerEvent) => {
    if (activePointer !== null) return;
    event.preventDefault();
    event.stopPropagation();
    const rect = target.getBoundingClientRect();
    activePointer = event.pointerId;
    gesture = {
      startX:event.clientX,startY:event.clientY,
      initialX:current.offsetX ?? 0,initialY:current.offsetY ?? 0,
      initialWidth:current.widthPx ?? rect.width,initialHeight:current.heightPx ?? rect.height,
      mode,
    };
    (event.currentTarget as HTMLButtonElement).setPointerCapture(event.pointerId);
  };
  const update = (event: PointerEvent) => {
    if (activePointer !== event.pointerId || !gesture) return;
    event.preventDefault();
    event.stopPropagation();
    const dx = event.clientX - gesture.startX;
    const dy = event.clientY - gesture.startY;
    if (gesture.mode === 'move') {
      current.offsetX = limit(gesture.initialX + dx,-400,400);
      current.offsetY = limit(gesture.initialY + dy,-400,400);
      target.style.setProperty('transform',
        'translate('+current.offsetX+'px,'+current.offsetY+'px)','important');
      // Existing absolute images must stay absolute, never force relative.
      if (doc.defaultView?.getComputedStyle(target).position === 'static') {
        target.style.setProperty('position','relative','important');
      }
    } else {
      current.widthPx = limit(gesture.initialWidth + dx,64,1600);
      current.heightPx = limit(gesture.initialHeight + dy,48,1200);
      target.style.setProperty('width',current.widthPx+'px','important');
      target.style.setProperty('max-width','100%','important');
      if (target.tagName === 'ARTICLE') {
        target.style.setProperty('min-height',current.heightPx+'px','important');
      } else {
        target.style.setProperty('height',current.heightPx+'px','important');
        if (target.tagName === 'IMG') target.style.setProperty('object-fit','contain','important');
      }
    }
    refresh();
  };
  const complete = (event: PointerEvent) => {
    if (activePointer !== event.pointerId) return;
    update(event);
    activePointer = null;
    gesture = null;
    onCommit();
  };
  const hook = (button: HTMLButtonElement,mode: Gesture['mode']) => {
    const down = (event: PointerEvent) => press(mode,event);
    button.addEventListener('pointerdown',down);
    button.addEventListener('pointermove',update);
    button.addEventListener('pointerup',complete);
    button.addEventListener('pointercancel',complete);
    return () => {
      button.removeEventListener('pointerdown',down);
      button.removeEventListener('pointermove',update);
      button.removeEventListener('pointerup',complete);
      button.removeEventListener('pointercancel',complete);
    };
  };
  const stopMove = hook(moveButton,'move'),stopResize = hook(resizeButton,'resize');
  const frame = doc.defaultView;
  frame?.addEventListener('scroll',refresh,{passive:true});
  frame?.addEventListener('resize',refresh);
  const observer = typeof ResizeObserver === 'function' ? new ResizeObserver(refresh) : null;
  observer?.observe(target);
  refresh();
  return () => {
    stopMove();stopResize();observer?.disconnect();
    frame?.removeEventListener('scroll',refresh);
    frame?.removeEventListener('resize',refresh);
    overlay.remove();
  };
}
