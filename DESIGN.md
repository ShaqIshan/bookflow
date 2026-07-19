---
name: Editorial Utility
colors:
  surface: '#FFFFFF'
  surface-dim: '#ded9d5'
  surface-bright: '#fdf8f4'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f8f3ef'
  surface-container: '#f2ede9'
  surface-container-high: '#ece7e3'
  surface-container-highest: '#e6e2de'
  on-surface: '#1d1b19'
  on-surface-variant: '#3f4945'
  inverse-surface: '#32302e'
  inverse-on-surface: '#f5f0ec'
  outline: '#6f7975'
  outline-variant: '#bfc9c3'
  surface-tint: '#226a57'
  primary: '#004334'
  on-primary: '#ffffff'
  primary-container: '#0e5c4a'
  on-primary-container: '#8dd2bb'
  inverse-primary: '#8fd4bd'
  secondary: '#835400'
  on-secondary: '#ffffff'
  secondary-container: '#feb64b'
  on-secondary-container: '#714800'
  tertiary: '#75140a'
  on-tertiary: '#ffffff'
  tertiary-container: '#952c1f'
  on-tertiary-container: '#ffb1a4'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#aaf1d9'
  primary-fixed-dim: '#8fd4bd'
  on-primary-fixed: '#002018'
  on-primary-fixed-variant: '#005140'
  secondary-fixed: '#ffddb5'
  secondary-fixed-dim: '#ffb956'
  on-secondary-fixed: '#2a1800'
  on-secondary-fixed-variant: '#633f00'
  tertiary-fixed: '#ffdad4'
  tertiary-fixed-dim: '#ffb4a8'
  on-tertiary-fixed: '#410100'
  on-tertiary-fixed-variant: '#862115'
  background: '#FAF7F2'
  on-background: '#1d1b19'
  surface-variant: '#e6e2de'
  muted-ink: '#8A8478'
typography:
  display-lg:
    fontFamily: Space Grotesk
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  display-md:
    fontFamily: Space Grotesk
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Space Grotesk
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 26px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
  stat-lg:
    fontFamily: Inter
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 34px
    letterSpacing: -0.02em
  display-lg-mobile:
    fontFamily: Space Grotesk
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 36px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  container-margin: 20px
  stack-gap-lg: 24px
  stack-gap-md: 16px
  stack-gap-sm: 8px
  gutter: 12px
---

## Brand & Style

The design system is built for a premium, editorial mobile experience that elevates the utilitarian task of booking management into a sophisticated digital workspace. It targets solo entrepreneurs and service providers who value professionalism and clarity.

The aesthetic follows a **Modern Corporate** approach with **Minimalist** and **Editorial** influences. It prioritizes high-quality typography, generous whitespace, and a warm, tactile feel to reduce the stress of business management. The interface should feel like a high-end physical planner—confident, calm, and uncluttered. 

Key visual principles include:
- **Warmth:** Using off-white surfaces instead of clinical whites or grays.
- **Precision:** Using sharp, characterful headings paired with highly legible, functional body text.
- **Hierarchy through Space:** Relying on padding and alignment rather than heavy borders or shadows to organize information.

## Colors

The palette is rooted in a "Paper and Ink" philosophy. The primary background uses a warm paper white to reduce eye strain and provide a premium feel, while the "Ink" (neutral) is a near-black that maintains high contrast without being harsh.

- **Primary (Deep Emerald):** Used for action-oriented elements like buttons, active navigation states, and "Success" or "Paid" indicators.
- **Secondary (Warm Amber):** Reserved for "Pending" states, deposits, or items requiring attention but not yet critical.
- **Tertiary (Muted Coral):** Used exclusively for alerts, overdue payments, or errors.
- **Neutral:** The near-black is used for primary headings and body text, while the "muted-ink" is used for labels, secondary information, and disabled states.

## Typography

The typography system uses a pairing of **Space Grotesk** for personality and **Inter** for utility. 

- **Headings:** Space Grotesk provides a modern, slightly technical, and editorial character. Use it for page titles, section headers, and names.
- **Body & Data:** Inter is used for all functional text, descriptions, and crucially, all numbers and currency (RM). 
- **Financials:** Money values (e.g., RM 1,800) should use `stat-lg` or `body-lg` with a Semi-Bold or Bold weight to ensure they are the focal point of the dashboard.
- **Labels:** Use `label-md` with uppercase styling and slight letter spacing for categories or small metadata above headings.

## Layout & Spacing

This design system uses a **Fluid Grid** model optimized for one-handed mobile use. 

- **Safe Zones:** A standard 20px margin is maintained on the left and right of the screen.
- **Vertical Rhythm:** Information is stacked vertically using a 4px-based scale. Major sections are separated by 24px, while related elements within a card or group are separated by 8px or 12px.
- **Tap Targets:** All interactive elements (buttons, list items, chips) must maintain a minimum height of 48px to ensure ease of use while on the move.
- **Bottom Navigation:** A persistent 5-tab bar. The center "Add" button is elevated and visually distinct to signify the primary action.

## Elevation & Depth

The system uses **Tonal Layers** combined with **Ambient Shadows** to create a sense of organized depth.

- **Base Layer:** The `#FAF7F2` background acts as the canvas.
- **Card Layer:** Pure white (`#FFFFFF`) surfaces sit on top of the base. These use a very soft, diffused shadow (Blur: 15px, Y: 4px, Color: `#161513` at 4% opacity).
- **Interactive Layer:** Elements like the floating "+" button or active status pills use color fills rather than shadows to denote their hierarchy.
- **Zero-Elevation Borders:** Use 1px borders in a slightly darker version of the background color for secondary input fields or dividers, keeping the interface flat and clean.

## Shapes

The shape language is defined by friendly, generous curves that soften the "business" nature of the app.

- **Main Containers:** Cards and large modal sheets use a 20px radius.
- **Interactive Elements:** Buttons use a 14px radius to feel distinct from cards while remaining soft.
- **Status Indicators:** All chips and tags must be fully pill-shaped (rounded-full).
- **Inputs:** Text fields follow the button radius (14px) for consistency in the "Add Booking" flow.

## Components

- **Buttons:** 
  - *Primary:* Emerald background, white text, 14px radius. 
  - *Secondary/Outline:* Emerald border (1px), emerald text, 14px radius.
- **Status Chips:** Pill-shaped with a low-opacity background of the status color and high-opacity text (e.g., Emerald background at 10% with Emerald text for "Paid").
- **Cards:** 20px radius, pure white, subtle shadow. Cards should have generous internal padding (16px to 20px).
- **Input Fields:** Large, clear inputs with 14px radius. The WhatsApp "Paste" area should feel like a large, inviting canvas with a dashed or light-gray border to signal it is a drop-zone.
- **Bottom Nav:** A solid white bar with a blur effect. The center "+" button is a 56x56px emerald circle with a white icon, slightly overlapping the top edge of the navigation bar.
- **Stat Cards:** Compact cards with `label-md` for the title and `stat-lg` for the value, arranged in a horizontal scroll or 3-column grid.