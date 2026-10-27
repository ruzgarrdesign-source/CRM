---
name: Görsel Operasyon
description: Rapor ve görsel inceleme prototipinin gözlenen arayüz sistemi.
colors:
  nav: "#173d3a"
  nav-hover: "#244e4a"
  nav-text: "#d5e4df"
  ink: "#253b39"
  muted: "#657572"
  border: "#e1e7e3"
  ground: "#f5f7f5"
  paper: "#fff"
  accent: "#255e4f"
  accent-hover: "#194638"
  mint: "#e8f0e8"
  green: "#286347"
  amber: "#895b1e"
  red: "#a03936"
  blue: "#355b85"
typography:
  headline:
    fontFamily: "Segoe UI, Arial, sans-serif"
    fontSize: "27px"
    fontWeight: 650
    lineHeight: 1.25
    letterSpacing: "-.025em"
  section:
    fontFamily: "Segoe UI, Arial, sans-serif"
    fontSize: "19px"
    fontWeight: 700
    lineHeight: 1.3
    letterSpacing: "-.015em"
  body:
    fontFamily: "Segoe UI, Arial, sans-serif"
    fontSize: "14px"
    lineHeight: 1.5
  control:
    fontFamily: "Segoe UI, Arial, sans-serif"
    fontSize: "12px"
    fontWeight: 600
  metadata:
    fontFamily: "Segoe UI, Arial, sans-serif"
    fontSize: "11px"
rounded:
  chip: "4px"
  button: "6px"
  nav: "7px"
  panel: "10px"
spacing:
  compact: "7px"
  control: "13px"
  panel: "18px"
  page: "29px"
components:
  button-primary:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.paper}"
    rounded: "{rounded.button}"
    padding: "9px 13px"
    height: "36px"
  button-primary-hover:
    backgroundColor: "{colors.accent-hover}"
  button-secondary:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.button}"
    padding: "9px 13px"
    height: "36px"
  nav-active:
    backgroundColor: "#dce8da"
    textColor: "#193d33"
    rounded: "{rounded.nav}"
    padding: "11px 13px"
  panel:
    backgroundColor: "{colors.paper}"
    rounded: "{rounded.panel}"
    padding: "25px"
  status-pending:
    backgroundColor: "#fbf1db"
    textColor: "{colors.amber}"
    rounded: "{rounded.chip}"
    padding: "3px 7px"
  status-approved:
    backgroundColor: "#e9f3e9"
    textColor: "{colors.green}"
    rounded: "{rounded.chip}"
    padding: "3px 7px"
---

# Design System: Görsel Operasyon

## Overview

**Creative North Star: "Contact-Sheet Precision"**

The shipped Operate prototype makes the report image and the review decision the main work. A dark navigation rail anchors a light, dense workspace. White panes, thin dividers, restrained state color, and a cool image mat let users scan a queue while keeping the current image large.

The interface uses ordinary controls and aligned metadata. The contact strip tracks the selected image below the viewer; report state remains readable in words and color. The visual system describes this browser-local demo, not a settled product brand.

The operations extension keeps the same restrained workbench language. The Reports page uses aligned duration bars and explicit units; the monthly shift calendar pairs compact labels with a detailed ledger below it. The Office ledger uses the existing white panels and role-scoped navigation. The review screen's three-area composition remains unchanged.

**Key Characteristics:**

- Desktop-first, three-area review workspace.
- Compact Segoe UI hierarchy and small operational metadata.
- Dark teal navigation against white working surfaces.
- Contact-strip selection and text-labeled semantic states.

## Colors

The core palette is muted blue-green and cool neutral; stronger colors carry action or state.

### Primary

- **Deep teal action** (`accent`): primary buttons and links. The darker `accent-hover` marks hover.
- **Dark teal rail** (`nav`): persistent navigation; `nav-hover` and `nav-text` support its states and legibility.

### Secondary

- **Mint wash** (`mint`): soft actions and selected working elements.
- **State colors** (`green`, `amber`, `red`, `blue`): approval, pending review, error or destructive feedback, and in-progress states respectively. State chips include words and a dot.

### Neutral

- **Ink** (`ink`): main text.
- **Muted gray-green** (`muted`): metadata and supporting copy.
- **Cool ground** (`ground`): page background.
- **Paper** (`paper`): panes, controls, and top bar.
- **Hairline border** (`border`): separation between panes and fields.

**The State-With-Text Rule.** A semantic tint accompanies an explicit status label; color alone never communicates report state.

## Typography

**Display and body font:** Segoe UI, with Arial and sans-serif fallback.

The typography is workhorse and compact. Headings carry hierarchy through size and weight; file names, times, and counts remain small but aligned with their related controls.

### Hierarchy

- **Page headline:** bold, tight tracking (`27px`, `650`, `1.25`); becomes `23px` at mobile width.
- **Section heading:** bold (`19px`, `1.3`) at the base style; the report-detail heading is smaller (`16px`, `1.5`).
- **Body:** regular (`14px`, `1.5`).
- **Controls and metadata:** buttons and labels mostly use `12px`; metadata runs at `11px`, with selected compact badges at `10px`.

**The Metadata Alignment Rule.** Keep short labels and values in stable rows; the report detail uses an `80px 1fr` definition list, widened to `90px 1fr` below `850px`.

## Layout

The shell uses a `204px` sidebar and flexible workspace. The review surface is a bordered three-column grid: a `220–255px` queue, flexible image viewer, and `286px` decision pane. It is at least `590px` high on desktop and otherwise tracks the viewport (`calc(100dvh - 238px)`, capped at `900px`). The top bar is `61px` high; page content has `29px` horizontal padding.

At `1500px` and above, the review grid uses `280px / flexible / 310px`. At `1240px`, the sidebar becomes `178px`, content padding `20px`, and the review grid `210px / flexible / 250px`. At `1080px`, navigation compresses to a `72px` icon rail. At `850px`, queue and viewer occupy the first row while detail moves below the viewer. At `600px`, navigation becomes a toggleable `225px` drawer and the queue, viewer, and detail stack vertically; the queue has a `265px` maximum height and the viewer a `450px` height.

The image mat centers artwork with `object-fit: contain`. A horizontally scrollable strip of `66px` thumbnails stays beneath the viewer. On desktop, the form uses a main area up to `760px` plus an aside; the aside drops away at `1080px`.

**The Image-First Rule.** In review, preserve enough flexible area for the submitted image while keeping queue selection and the report decision reachable.

## Elevation & Depth

The workspace is primarily flat. White planes, cool ground, and thin borders provide separation. The viewed image has a quiet `0 6px 24px #18302714` shadow. The shared floating shadow (`0 12px 40px #183c3a20`) is used for the toast and lightbox; the selected report uses a one-pixel inset edge instead of a raised card.

## Shapes

Forms are gently rounded: `6px` for most controls and thumbnails, `7px` for navigation and notices, and `10px` for the main review container. Status chips use `4px` corners and a small circular marker. Panels use a `1px` border; the active thumbnail increases its border to `2px`. Circular avatars are a utility silhouette, not a general card shape.

## Components

### Buttons

Primary buttons use deep teal, white text, `6px` corners, `9px 13px` padding, and a `36px` minimum height. Secondary buttons are white with a pale border and dark text; soft buttons use mint. Hover darkens the primary color or lightly tints secondary surfaces. A global `3px` teal outline with `3px` offset marks keyboard focus. Disabled buttons reduce opacity to `.48`.

### Navigation

The dark rail uses stacked icon-and-label buttons with `11px 13px` padding and `7px` corners. Hover uses the lighter teal rail color; the active item becomes pale green with dark text. On narrow screens the rail first becomes icon-only, then moves into a drawer.

### Queue and Contact Strip

Report rows use white or softly tinted backgrounds, a thin bottom border, compact author/time metadata, and a textual status chip. The selected row has a pale-green fill and a one-pixel inset start edge. The thumbnail strip scrolls horizontally; its active tile uses a `2px` green border and pale-green background.

### Status Chips

Small (`10px`) rounded labels pair a status word with a colored dot. Pending review is amber, approved is green, revision is warm orange, and in-progress work is blue. They are informational, not buttons.

### Panels and Fields

White panels use a `1px` cool border and `10px` corners. Standard forms use `6px` field corners, pale borders, and white fill. The queue search combines an icon and borderless text input inside one outlined field. The decision note remains adjacent to its report-wide actions and optional image-specific association.

## Do's and Don'ts

### Do:

- **Do** give the selected image a large, contained viewer and a visible contact strip.
- **Do** pair all status colors with written state labels.
- **Do** use the documented breakpoints and preserve reading order when review columns stack.

### Don't:

- **Don't** use shadows as the main pane-separation device; borders and tonal surfaces do that work.
