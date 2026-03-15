# Figma export for Project Planning Tool

This folder contains style tokens and a couple of vector assets exported from the codebase to import into Figma.

Files:

- `styles.json` — color and font tokens extracted from `src/index.css`.
- `assets/app-logo.svg` — header/logo SVG.
- `assets/spinner.svg` — loading spinner SVG.
- `metadata.json` — package metadata and notes.

Recommended import steps (long-term, best results):

1. Install the Figma Tokens plugin in Figma.
2. Open the plugin in your Figma file and choose Import → JSON, then select `styles.json`. Map tokens as colors/fonts inside Figma Tokens.
3. Import SVGs: drag `assets/*.svg` directly into Figma or use File → Place Image/Vector and select the SVG to keep vectors editable.
4. For icons that are currently React components (lucide-react), replace with raw SVGs where you need editable vectors — either copy-paste SVG markup or export from the icon library.
5. Avatars are remote URLs (e.g., `https://i.pravatar.cc/...`). Download and place them into Figma if needed.

Quick tips:

- Use the Figma Tokens plugin to generate color styles and text styles from the imported tokens so designers can reuse them.
- If you want component-level fidelity, take screenshots of UI blocks at 1x/2x and import as images, then rebuild them as Figma components using tokens for colors and typography.
- If you'd like, I can generate a ZIP of this `figma-export` folder for download.
