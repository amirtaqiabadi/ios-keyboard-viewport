---
name: ios-keyboard-viewport
description: Diagnose and fix mobile-web layout bugs caused by the on-screen keyboard and changing visual viewport, especially on iOS Safari. Use for bottom sheets, dialogs, drawers, full-screen forms, fixed CTAs/toolbars, chat composers, or focused inputs that jump, drift, clip, hide behind the keyboard, leave a gap, trigger page bounce, or break with 100vh/100dvh. Applies to HTML/CSS/JavaScript, React/Next.js, and portal-based UI libraries such as Radix, shadcn/ui, Headless UI, and MUI.
---

# Fix mobile keyboard viewport bugs

## Workflow

1. Inspect the component, portal/container, scroll ancestors, and styles controlling height and positioning. Search relevant files for `vh`, `dvh`, `position: fixed`, `overflow`, `transform`, `scrollIntoView`, and focus handlers.
2. Classify the symptom before editing:
   - wrong available height → mirror Visual Viewport height;
   - fixed UI drifting when Safari pans → anchor an overlay to the Visual Viewport rectangle;
   - background bounce → lock body scroll while the overlay is open;
   - focused control obscured in an internal scroller → scroll that scroller after viewport geometry settles;
   - iOS input zoom → use a computed font size of at least `16px`, not disabled zoom.
3. Apply only the fixes required by the observed symptom.
4. Preserve the component library's focus trap, dismissal, accessibility, and portal behavior. Prefer documented hooks or container overrides to brittle selectors.
5. Test keyboard closed, opening, open, field switching, closing, orientation change, and reopening on a real device or Xcode Simulator.

## Preferred implementation

For vanilla code, copy `scripts/visual-viewport.js`. For React/Next.js, copy `scripts/useVisualViewport.ts`. They update CSS variables without React state:

- `--vv-height`: visible viewport height;
- `--vv-top`: visual viewport offset from the layout viewport top;
- `--vv-bottom`: obscured layout-viewport space below the visual viewport;
- `--keyboard-open`: `1` only when a keyboard-sized reduction and focused editable element are detected.

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
- Do not disable zoom with `user-scalable=no` or `maximum-scale=1`.
- Do not globally suppress `touchmove`, prevent focus defaults, or fight the browser with timer loops.

## Verification

Confirm the variables change while the keyboard opens and closes. Verify exactly one element scrolls, background position restores, the focused control and action button remain reachable, safe-area padding returns after dismissal, and repeated cycles do not jump.

If reproduction is unavailable, add temporary logging for `visualViewport.height`, `offsetTop`, `pageTop`, `window.innerHeight`, active element, and scroll positions. Remove it before delivery.
