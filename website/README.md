# TEDxAuburnHills website

Static multi-page layout for TEDxAuburnHills: **Retooling: Same hands,
different tools.**

## Current pages

- Home
- About
- Speakers
- Schedule
- Attend
- Sponsors
- Organizers
- Contact and FAQ

Every page includes fixed site navigation and a same-page section navigator.
On smaller screens, the section sidebar is removed and the visible page links
become a horizontally scrollable navigation strip below the logo.

The visual system combines opaque static glass, red and dark tints,
cursor-following highlights, lightweight ambient gradients, and Rochester
Hills photography. The speaker page adds a pointer-responsive CSS grid and uses
alternating full-width profiles. No continuous canvas or WebGL animation is
required. The schedule uses a scroll-drawn curved thread, alternating event
cards, a centered-item glow, and an original abstract red-and-charcoal
background generated for the timeline.

## Local preview

Open `index.html` directly, or serve this folder with any local static web
server. No build step, package installation, database, or hosted service is
required.

## Content status

This version is for layout review. Confirmed event details, the official TED
listing, the speaker application, eight speaker profiles, the draft program,
and accessibility information are included.

The registration service, livestream URL, contact email and delivery service,
remaining team and speaker profiles, performer details, and partner agreements
are still placeholders. The contact form is visual only until a delivery
service is selected.

The hero image is credited in the site footer. Sources for every local
background and profile image are recorded in `THIRD_PARTY_NOTICES.md`.
Modern browsers receive optimized AVIF backgrounds and speaker portraits, with
WebP and JPEG fallbacks. Unused source and legacy assets are kept in the local,
ignored backup rather than published with the deployable site.
