export function installVisualViewportVars() {
  const root = document.documentElement;
  const viewport = window.visualViewport;
  let frame = 0;
  const settleTimers = new Set();

  const isEditable = (element) => {
    if (!(element instanceof HTMLElement)) return false;
    if (element.isContentEditable) return true;
    return element.matches(
      'textarea, input:not([type]), input[type="text"], input[type="search"], ' +
      'input[type="email"], input[type="url"], input[type="tel"], ' +
      'input[type="password"], input[type="number"]',
    );
  };

  const update = () => {
    frame = 0;
    const height = viewport?.height ?? window.innerHeight;
    const top = viewport?.offsetTop ?? 0;
    // innerHeight is the layout-viewport baseline. visualViewport.height is
    // the currently visible rectangle, so the difference is the obscured
    // space below that rectangle (usually the keyboard on iOS).
    const layoutHeight = window.innerHeight;
    const bottom = Math.max(0, layoutHeight - height - top);
    const keyboardOpen = isEditable(document.activeElement) && bottom > 150;
    root.style.setProperty('--vv-height', `${height}px`);
    root.style.setProperty('--vv-top', `${top}px`);
    root.style.setProperty('--vv-bottom', `${bottom}px`);
    root.style.setProperty('--vv-layout-height', `${layoutHeight}px`);
    root.style.setProperty('--keyboard-open', keyboardOpen ? '1' : '0');
    root.dataset.keyboardOpen = keyboardOpen ? 'true' : 'false';
  };
  const schedule = () => { if (!frame) frame = requestAnimationFrame(update); };
  const scheduleSettled = () => {
    schedule();
    [50, 150, 300].forEach((delay) => {
      const timer = setTimeout(() => {
        settleTimers.delete(timer);
        schedule();
      }, delay);
      settleTimers.add(timer);
    });
  };

  update();
  viewport?.addEventListener('resize', schedule);
  viewport?.addEventListener('scroll', schedule);
  window.addEventListener('resize', schedule);
  window.addEventListener('orientationchange', scheduleSettled);
  window.addEventListener('scroll', schedule);
  window.addEventListener('pageshow', schedule);
  document.addEventListener('focusin', scheduleSettled);
  document.addEventListener('focusout', scheduleSettled);
  return () => {
    if (frame) cancelAnimationFrame(frame);
    settleTimers.forEach((timer) => clearTimeout(timer));
    settleTimers.clear();
    viewport?.removeEventListener('resize', schedule);
    viewport?.removeEventListener('scroll', schedule);
    window.removeEventListener('resize', schedule);
    window.removeEventListener('orientationchange', scheduleSettled);
    window.removeEventListener('scroll', schedule);
    window.removeEventListener('pageshow', schedule);
    document.removeEventListener('focusin', scheduleSettled);
    document.removeEventListener('focusout', scheduleSettled);
    delete root.dataset.keyboardOpen;
    ['--vv-height', '--vv-top', '--vv-bottom', '--vv-layout-height', '--keyboard-open']
      .forEach((name) => root.style.removeProperty(name));
  };
}
