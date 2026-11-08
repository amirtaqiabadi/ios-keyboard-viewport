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

  if (!viewport) {
    requestAnimationFrame(reveal);
    return;
  }

  // iOS often emits several resize/scroll steps while the keyboard animates.
  // Wait for two stable animation frames, with a hard 600ms bound, instead of
  // revealing after the first resize (which can immediately become stale).
  const started = performance.now();
  const initial = [viewport.height, viewport.offsetTop, viewport.pageTop]
    .map((value) => Math.round(value)).join(':');
  let previous = initial;
  let stableFrames = 0;
  let done = false;
  let frame = 0;
  const finish = () => {
    if (done) return;
    done = true;
    viewport.removeEventListener('resize', check);
    viewport.removeEventListener('scroll', check);
    cancelAnimationFrame(frame);
    requestAnimationFrame(reveal);
  };
  const check = () => {
    if (done) return;
    const signature = [viewport.height, viewport.offsetTop, viewport.pageTop]
      .map((value) => Math.round(value)).join(':');
    stableFrames = signature === previous ? stableFrames + 1 : 0;
    previous = signature;
    const elapsed = performance.now() - started;
    if ((elapsed >= 120 && stableFrames >= 2) || elapsed >= 600) {
      finish();
      return;
    }
    frame = requestAnimationFrame(check);
  };
  viewport.addEventListener('resize', check);
  viewport.addEventListener('scroll', check);
  frame = requestAnimationFrame(check);
}
