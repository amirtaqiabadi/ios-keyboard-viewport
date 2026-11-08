---
name: ios-keyboard-viewport
description: Diagnose and fix mobile-web layout bugs caused by the on-screen keyboard and changing visual viewport, especially on iOS Safari. Use for bottom sheets, dialogs, drawers, full-screen forms, fixed CTAs/toolbars, chat composers, or focused inputs that jump, drift, clip, hide behind the keyboard, leave a gap, trigger page bounce, or break with 100vh/100dvh. Applies to HTML/CSS/JavaScript, React/Next.js, and portal-based UI libraries such as Radix, shadcn/ui, Headless UI, and MUI.
---

# Fix mobile keyboard viewport bugs

## Workflow

1. Inspect the component, portal/container, scroll ancestors, and styles controlling height and positioning. Search relevant files for `vh`, `dvh`, `position: fixed`, `overflow`, `transform`, `scrollIntoView`, and focus handlers.
2. Confirm the skill is being applied to the actual component. Installing this skill or copying its helper does not change application layout by itself; the agent must edit the fixed shell/overlay, the intended scroll container, and the component's focus lifecycle.
3. Classify the symptom before editing:
   - wrong available height → mirror Visual Viewport height;
   - fixed UI drifting when Safari pans → anchor an overlay to the Visual Viewport rectangle;
   - full-screen shell clipped at the top, or footer/composer `--vv-top` above the keyboard → Safari panned (`visualViewport.offsetTop` ≠ 0); pin the box to `--vv-top`, do not size from layout-viewport top with only `--vv-height`;
   - background bounce → lock body scroll while the overlay is open;
   - focused control obscured in an internal scroller → scroll that scroller after viewport geometry settles;
   - iOS input zoom → use a computed font size of at least `16px`, not disabled zoom.
4. Add the helper once near the application root, then connect the variables to the affected element. Do not install one instance per dialog or component.
5. Apply only the fixes required by the observed symptom.
6. Preserve the component library's focus trap, dismissal, accessibility, and portal behavior. Prefer documented hooks or container overrides to brittle selectors.
7. Test keyboard closed, opening, open, field switching, closing, orientation change, and reopening on a real device or Xcode Simulator.

## Preferred implementation

For vanilla code, copy `scripts/visual-viewport.js`. For React/Next.js, copy `scripts/useVisualViewport.ts`. They update CSS variables without React state:

- `--vv-height`: visible viewport height;
- `--vv-top`: visual viewport offset from the layout viewport top;
- `--vv-bottom`: obscured layout-viewport space below the visual viewport;
- `--vv-layout-height`: the current layout-viewport baseline used to derive `--vv-bottom`;
- `--keyboard-open`: `1` only when a keyboard-sized reduction and focused editable element are detected.

The helper is a measurement layer, not a complete fix. A project still needs CSS that consumes the variables. For a full-screen shell, use `top: var(--vv-top)` and `height: var(--vv-height)` (or `bottom: var(--vv-bottom)`), and for a sheet use a viewport-aligned overlay with an internal scrolling body. If the app's shell remains `top: 0; height: 100vh`, the helper can be working while the UI still stays behind the keyboard.

The visible rectangle is `[--vv-top, --vv-top + --vv-height]`. `--vv-height` is only the height of that rectangle. When Safari pans to reveal a focused field, `visualViewport.offsetTop` is nonzero, so a full-screen shell (app frame, login, booking, review, full-page chat) that uses `top: 0; height: var(--vv-height)` is clipped at the top and its footer/composer ends `--vv-top` pixels above the keyboard.

Pin the full-screen box to the Visual Viewport rectangle:

```css
.viewport-shell {
  position: fixed;
  top: var(--vv-top, 0px);
  left: 0;
  width: 100%;
  height: var(--vv-height, 100dvh);
}

/* Equivalent: glue the bottom to the visual viewport bottom. */
.viewport-shell-alt {
  position: fixed;
  top: var(--vv-top, 0px);
  bottom: var(--vv-bottom, 0px);
  left: 0;
  right: 0;
}
```

Do not use `top: 0; height: var(--vv-height)`. Do not compensate with `padding-top` or `translateY` on a box that is already `top: var(--vv-top)`.

Use a Visual Viewport overlay as the containing block, then position the sheet inside it:

```css
.viewport-overlay {
  position: fixed;
  top: var(--vv-top, 0px);
  left: 0;
  width: 100%;
  height: var(--vv-height, 100dvh);
  overflow: hidden;
}

.bottom-sheet {
  position: absolute;
  inset: auto 0 0;
  max-height: min(90%, 48rem);
  display: flex;
  flex-direction: column;
  padding-bottom: env(safe-area-inset-bottom);
}

.bottom-sheet__body {
  min-height: 0;
  overflow: auto;
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
}

:root[data-keyboard-open='true'] .bottom-sheet { padding-bottom: 0; }
```

Do not apply `translateY(var(--vv-top))` inside a viewport-aligned overlay; that double-compensates. If a library forces a fixed sheet directly under `body`, use `bottom: var(--vv-bottom)` and `max-height: var(--vv-height)` instead. Do not combine both strategies.

When an overlay opens, use `scripts/body-scroll-lock.js`. Keep the sheet body—not `body`—as the scrolling region. The helper supports nested overlays.

If a field remains hidden, use `scripts/ensure-focused-visible.js`. Trigger from focus, but scroll after Visual Viewport `resize` settles. Target the intended internal scroller and respect reduced motion.

If the bug is still present, add temporary diagnostics at the affected component and inspect these values during one keyboard cycle: `visualViewport.height`, `visualViewport.offsetTop`, `visualViewport.pageTop`, `window.innerHeight`, `document.activeElement`, the shell rect, the scroller rect, and the active scrollTop. A useful result should show which rectangle is wrong; do not add another compensating `translateY` until that is known.

## Framework guidance

- In Next.js, call the React hook from a small client component mounted once near the root layout.
- For Radix/shadcn dialogs and drawers, retain content primitives, focus trapping, and portal semantics. Add a viewport-aligned wrapper or override exposed content/container styles.
- Check whether a transformed ancestor creates an unexpected containing block for fixed descendants.
- Do not pass viewport dimensions through props or store every resize event in application state.

## Guardrails

- Do not claim `100dvh` universally fixes keyboards. It is a useful fallback, but UI that tracks the live visible rectangle needs Visual Viewport measurements.
- Do not claim all iOS versions behave identically. Feature-detect `window.visualViewport` and retain a fallback.
- Do not infer keyboard visibility from viewport reduction alone; browser chrome and orientation also resize the viewport.
- Do not use `window.innerHeight` as the live keyboard geometry source. Use it only as the layout-viewport baseline/fallback.
- Do not treat `--keyboard-open` as a replacement for viewport geometry. It is only a convenience flag; layout should follow `--vv-top`, `--vv-height`, and `--vv-bottom`.
- Do not size a full-screen `position: fixed` box from layout-viewport top using only `--vv-height`. Align `top` to `--vv-top` (or `bottom` to `--vv-bottom`) so the box's bottom matches the visual viewport bottom.
- Do not disable zoom with `user-scalable=no` or `maximum-scale=1`.
- Do not globally suppress `touchmove`, prevent focus defaults, or fight the browser with timer loops.

## Verification

Confirm the variables change while the keyboard opens and closes. Verify exactly one element scrolls, background position restores, the focused control and action button remain reachable, safe-area padding returns after dismissal, and repeated cycles do not jump.

If reproduction is unavailable, add temporary logging for `visualViewport.height`, `offsetTop`, `pageTop`, `window.innerHeight`, active element, and scroll positions. Remove it before delivery.
