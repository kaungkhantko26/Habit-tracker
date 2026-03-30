# Design System Strategy: The Playful Architect

## 1. Overview & Creative North Star
This design system is built on the Creative North Star of **"The Playful Architect."** It bridges the gap between the structured, high-utility organizational logic of Notion and the vibrant, dopamine-inducing gamification of Duolingo. 

While many habit trackers feel like spreadsheets, this system treats the UI as a living environment. We move beyond the "template" look by utilizing **intentional asymmetry** and **tonal depth**. Instead of rigid grids, we use overlapping card elements and varying scale to create a sense of progress and play. The goal is to make productivity feel less like a chore and more like a curated collection of achievements.

## 2. Colors & Surface Logic
The palette is rooted in vibrant clarity. We use a high-chroma primary paired with soft, inviting neutrals to ensure the "gamified" elements pop without causing cognitive fatigue.

### The "No-Line" Rule
**Strict Mandate:** Designers are prohibited from using 1px solid borders for sectioning. Boundaries must be defined solely through background color shifts. To separate a list from a container, move from `surface-container-low` to `surface-container-lowest`. 

### Surface Hierarchy & Nesting
Treat the UI as a series of physical layers. We use the Material Design surface tiers to define importance through "nested" depth:
- **Base Layer:** `surface` (#f5f6f7) for the main application background.
- **Sectioning:** `surface-container-low` (#eff1f2) for grouping related habit categories.
- **Interaction Cards:** `surface-container-lowest` (#ffffff) for individual habit cards, creating a "lifted" look against the background.

### The "Glass & Gradient" Rule
To avoid a flat, "Bootstrap" feel, use **Glassmorphism** for floating navigation bars or celebratory modals. Use `surface_tint` (#6a37d4) at 10% opacity with a `20px` backdrop blur.
- **Signature Textures:** For main CTAs and "Streak" milestones, use a linear gradient from `primary` (#6a37d4) to `primary_container` (#ae8dff) at a 135-degree angle. This adds "soul" and a sense of energy that flat hex codes lack.

## 3. Typography
The system utilizes a dual-font strategy to balance utility with personality.

*   **Display & Headlines:** `Plus Jakarta Sans`. This choice provides a bold, rounded, and modern feel that resonates with the "playful" requirement. It is used for XP tallies, streak counts, and section headers.
*   **Body & Labels:** `Inter`. Chosen for its legendary legibility at small sizes, ensuring that habit descriptions and metadata feel clean and "Notion-like."

**Hierarchy of Intent:**
- **Display-LG (3.5rem):** Reserved exclusively for major milestones (e.g., "30 Day Streak!").
- **Headline-MD (1.75rem):** Used for daily headers to give the user a clear sense of "Today."
- **Title-SM (1rem):** The standard for habit names within cards, providing a sturdy anchor for the eye.

## 4. Elevation & Depth
We reject traditional heavy-handed shadows in favor of **Tonal Layering**.

*   **The Layering Principle:** Depth is achieved by stacking. A `surface-container-lowest` card placed on a `surface-container-low` background creates a soft, natural lift without a single pixel of shadow.
*   **Ambient Shadows:** For "Active" states or "Floating Action Buttons," use an extra-diffused shadow: `0px 20px 40px rgba(44, 47, 48, 0.06)`. The shadow color is a tinted version of `on-surface` (#2c2f30) rather than pure black.
*   **The "Ghost Border" Fallback:** If accessibility requires a border, use `outline-variant` (#abadae) at **15% opacity**. Never use 100% opaque lines.
*   **Tactile Feedback:** When an element is pressed, it should visually "sink." Use a `scale(0.98)` transform and remove the ambient shadow to mimic physical interaction.

## 5. Components

### Cards & Habit Lists
*   **Rule:** Forbid the use of divider lines.
*   **Execution:** Separate items using the `Spacing Scale 3` (1rem) or by alternating background shifts. Habit cards must use `Roundedness-DEFAULT` (1rem).
*   **Visual Soul:** High-quality 3D icons or emojis should be positioned with "intentional overflow"—slightly peeking outside the card's top-left boundary to break the boxy grid.

### Buttons (Tactile Primary)
*   **Primary:** Background: `Primary` (#6a37d4); Text: `On_Primary` (#f8f0ff). Use `Roundedness-MD` (1.5rem). 
*   **Secondary:** Background: `Secondary_Container` (#69f6b8); Text: `On_Secondary_Container` (#005a3c). These are for "Success" actions like completing a habit.
*   **Tertiary:** No background. Use `Primary` text with a subtle `surface-container-high` background on hover.

### Progress Toggles (Checkboxes)
*   **State:** When a habit is "checked," the entire card should transition from `surface-container-lowest` to `secondary_container` (#69f6b8) with a spring animation. This provides immediate, delightful feedback.

### Chips (Filter & Tags)
*   Use `Roundedness-full` (9999px) for a "pill" look. Tags like "Health" or "Work" should use `surface-variant` with `on-surface-variant` text to remain secondary to the content.

## 6. Do's and Don'ts

### Do
*   **Do** use asymmetrical margins (e.g., a larger `Spacing-8` top margin and `Spacing-4` bottom margin) to create a rhythmic, editorial flow.
*   **Do** use `plusJakartaSans` in bold weights for all numerical data to emphasize the gamified "stats."
*   **Do** lean into white space. If a screen feels crowded, increase the spacing between card groups using `Spacing-10` (3.5rem).

### Don't
*   **Don't** use pure black (#000000) for text. Use `on_surface` (#2c2f30) to maintain a premium, soft-ink look.
*   **Don't** use standard 4px or 8px corners. Our brand identity lives in the `1rem` to `2rem` range; sharp corners are the enemy of "Playful."
*   **Don't** use "flat" buttons for primary actions. Everything the user can tap should feel like it has physical volume and "squish."