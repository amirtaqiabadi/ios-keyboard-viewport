let locks = 0;
let scrollY = 0;
let previous = null;

export function lockBodyScroll() {
  locks += 1;
  if (locks > 1) return;
  scrollY = window.scrollY;
  previous = {
    position: document.body.style.position,
    top: document.body.style.top,
    left: document.body.style.left,
    right: document.body.style.right,
    width: document.body.style.width,
    overflow: document.body.style.overflow,
  };
  Object.assign(document.body.style, {
    position: 'fixed', top: `-${scrollY}px`, left: '0', right: '0',
    width: '100%', overflow: 'hidden',
  });
}

export function unlockBodyScroll() {
  if (!locks) return;
  locks -= 1;
  if (locks) return;
  Object.assign(document.body.style, previous);
  previous = null;
  window.scrollTo(0, scrollY);
}
