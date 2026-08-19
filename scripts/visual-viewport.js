export function installVisualViewportVars() {
  const root = document.documentElement;
  const viewport = window.visualViewport;
  let frame = 0;
  const update = () => {
    frame = 0;
    const height = viewport?.height ?? window.innerHeight;
    const top = viewport?.offsetTop ?? 0;
    const bottom = Math.max(0, window.innerHeight - height - top);
    const active = document.activeElement;
    const editable = active instanceof HTMLElement &&
      (active.matches('input, textarea, select') || active.isContentEditable);
    const keyboardOpen = editable && bottom > 150;
    root.style.setProperty('--vv-height', `${height}px`);
    root.style.setProperty('--vv-top', `${top}px`);
    root.style.setProperty('--vv-bottom', `${bottom}px`);
    root.style.setProperty('--keyboard-open', keyboardOpen ? '1' : '0');
    root.dataset.keyboardOpen = keyboardOpen ? 'true' : 'false';
  };
  const schedule = () => { if (!frame) frame = requestAnimationFrame(update); };
  update();
  viewport?.addEventListener('resize', schedule);
  viewport?.addEventListener('scroll', schedule);
  window.addEventListener('resize', schedule);
  document.addEventListener('focusin', schedule);
  document.addEventListener('focusout', schedule);
  return () => {
    if (frame) cancelAnimationFrame(frame);
    viewport?.removeEventListener('resize', schedule);
    viewport?.removeEventListener('scroll', schedule);
    window.removeEventListener('resize', schedule);
    document.removeEventListener('focusin', schedule);
    document.removeEventListener('focusout', schedule);
    delete root.dataset.keyboardOpen;
    ['--vv-height', '--vv-top', '--vv-bottom', '--keyboard-open']
      .forEach((name) => root.style.removeProperty(name));
  };
}
