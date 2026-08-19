export function ensureFocusedVisible(scroller, element = document.activeElement) {
  if (!(scroller instanceof HTMLElement) || !(element instanceof HTMLElement)) return;
  const viewport = window.visualViewport;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const reveal = () => {
    const item = element.getBoundingClientRect();
    const box = scroller.getBoundingClientRect();
    const vvTop = viewport?.offsetTop ?? 0;
    const visibleBottom = Math.min(box.bottom, vvTop + (viewport?.height ?? window.innerHeight));
    const topLimit = Math.max(box.top, vvTop);
    const padding = 16;
    let delta = 0;
    if (item.bottom > visibleBottom - padding) delta = item.bottom - visibleBottom + padding;
    else if (item.top < topLimit + padding) delta = item.top - topLimit - padding;
    if (delta) scroller.scrollBy({ top: delta, behavior: reduced ? 'auto' : 'smooth' });
  };
  if (!viewport) return requestAnimationFrame(reveal);
  let done = false;
  const finish = () => {
    if (done) return;
    done = true;
    viewport.removeEventListener('resize', finish);
    requestAnimationFrame(reveal);
  };
  viewport.addEventListener('resize', finish, { once: true });
  setTimeout(finish, 350);
}
