<img width="1672" height="941" alt="image" src="https://github.com/user-attachments/assets/e07d5271-56e4-497b-ac06-fd2b26754d2f" />

# iOS Keyboard Viewport

An [Agent Skill](https://agentskills.io/) for diagnosing and fixing mobile-web layout bugs caused by the on-screen keyboard and the Visual Viewport API, especially on iOS Safari.

Use it when bottom sheets, dialogs, drawers, full-screen forms, fixed CTAs, chat composers, or focused inputs jump, drift, clip, hide behind the keyboard, leave a gap, trigger page bounce, or break with `100vh` / `100dvh`.

[![skills.sh](https://skills.sh/b/amirtaqiabadi/ios-keyboard-viewport)](https://skills.sh/amirtaqiabadi/ios-keyboard-viewport)

## Install

```bash
npx skills add amirtaqiabadi/ios-keyboard-viewport
```

After install, coding agents (Cursor, Claude Code, Codex, and others supported by the Skills CLI) will pick up the skill when the task matches.

### Manual install

Copy this repository into an agent skills directory:

- Cursor (user): `~/.cursor/skills/ios-keyboard-viewport/`
- Cursor (project): `.cursor/skills/ios-keyboard-viewport/`
- Codex / Agents: `~/.agents/skills/ios-keyboard-viewport/`

## What the skill does

The agent classifies the symptom, then applies only the matching fix:

| Symptom | Approach |
| --- | --- |
| Wrong available height | Mirror Visual Viewport height |
| Fixed UI drifting when Safari pans | Anchor an overlay to the Visual Viewport rectangle |
| Full-screen shell clipped at top, or composer `--vv-top` above the keyboard | Pin the box to `--vv-top`; do not size from layout top with only `--vv-height` |
| Background bounce | Lock body scroll while the overlay is open |
| Focused control obscured in an internal scroller | Scroll that scroller after viewport geometry settles |
| iOS input zoom | Use a computed font size of at least `16px` (do not disable zoom) |

This is an agent instruction package, not a runtime polyfill. Installing it does not modify an application's CSS or component tree. The agent must install the viewport helper once near the app root and then update the actual fixed shell, overlay, and internal scroller that reproduce the bug.

It ships copy-paste helpers:

- `scripts/visual-viewport.js` — vanilla Visual Viewport CSS variables
- `scripts/useVisualViewport.ts` — React / Next.js hook (no resize state)
- `scripts/body-scroll-lock.js` — nested overlay body lock
- `scripts/ensure-focused-visible.js` — scroll a focused field into the visible rectangle

CSS variables set by the helpers:

- `--vv-height` — visible viewport height
- `--vv-top` — visual viewport offset from the layout viewport top
- `--vv-bottom` — obscured layout-viewport space below the visual viewport
- `--vv-layout-height` — layout-viewport baseline used to derive `--vv-bottom`
- `--keyboard-open` — `1` only when a keyboard-sized reduction and a focused editable element are detected

Works with HTML/CSS/JavaScript, React/Next.js, and portal-based libraries such as Radix, shadcn/ui, Headless UI, and MUI.

## Example prompts

```
This bottom sheet jumps when the iOS keyboard opens. Fix it.
```

```
The chat composer is hidden behind the keyboard on Safari.
```

```
My Radix dialog leaves a gap and the page bounces on iPhone.
```

## Repository layout

```
.
├── SKILL.md                      # Agent instructions
├── agents/openai.yaml            # ChatGPT / Codex skill metadata
├── assets/icon.svg               # Skill icon
└── scripts/
    ├── visual-viewport.js
    ├── useVisualViewport.ts
    ├── body-scroll-lock.js
    └── ensure-focused-visible.js
```

## License

MIT
