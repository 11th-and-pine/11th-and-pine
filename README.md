# 11th & Pine

11th & Pine is a location-based audio storytelling prototype about the Capitol Hill Occupied Protest (CHOP) in Seattle. The app turns archival and oral-history material into a mobile walking experience, allowing users to follow routes, listen to narrated stops, and explore multiple perspectives tied to places around Westlake, Pine Street, Capitol Hill, and Cal Anderson Park.

This project was created as a University of Washington Informatics Capstone project by team **Juicy Jam**, sponsored by the **University of Washington School of Drama**.

## Project Overview

The prototype explores how digital archives can become embodied, place-based experiences. Instead of presenting CHOP history only as static documentation, 11th & Pine asks users to move through the streets where events unfolded while listening to stories connected to those locations.

The current repository contains a working React/Vite frontend prototype. It includes onboarding, route browsing, map-based navigation, simulated walking/audio playback, perspective cards, labels for key locations, and project information pages.

## Features

- Mobile-first React app designed inside a phone-sized shell
- Onboarding flow introducing the walking audio experience
- Interactive Mapbox route exploration
- Route selection for multiple CHOP-related perspectives
- Guided walk screen with GPS-aware route logic and a demo walking simulation
- Mock audio playback for route storytelling
- Perspective library with Westlake, Capitol Hill, and label-based content
- About and privacy pages for handoff and user-facing context
- Local mock data for routes, perspectives, labels, images, and audio

## Prototype

The current prototype is built with React, Vite, React Router, Mapbox, and Tailwind CSS. It can be run locally with:

```bash
npm install
npm run dev
```

Map-based screens require a Mapbox token in a local `.env` file:

```bash
VITE_MAPBOX_TOKEN=your_mapbox_access_token_here
```

## Project Structure

```text
.
├── public/
│   ├── audio/                 # Mock route audio files
│   ├── favicon.svg
│   └── icons.svg
├── src/
│   ├── assets/                # Images, logos, route cards, onboarding art
│   ├── components/            # Shared navigation and icon components
│   ├── data/                  # Route definitions used by map flows
│   ├── mock/                  # Mock route and perspective JSON data
│   ├── pages/
│   │   ├── Map/               # Route overview, route selection, live walk
│   │   ├── Onboarding/        # Intro and onboarding screens
│   │   └── Perspectives/      # Perspective list and detail screens
│   ├── services/              # Local data access helpers
│   ├── App.jsx                # Route definitions
│   ├── index.css              # Global styles and mobile shell
│   └── main.jsx               # React entry point
├── index.html
├── package.json
├── vite.config.js
└── README.md
```

## Content and Data

The prototype currently uses local mock data and assets:

- `src/mock/` contains route and perspective content.
- `src/data/chopRoutes.js` contains route coordinates and perspective-route relationships.
- `public/audio/` contains mock audio files.
- `src/assets/images/` contains onboarding, route, perspective, and location imagery.

## Testing Notes

This prototype is designed for end-to-end demo testing through:

- local browser walkthroughs
- mobile viewport testing
- Mapbox token validation
- simulated walking behavior
- mock audio playback verification
- field testing for GPS thresholds and route accuracy

There is no automated test suite currently configured. For now, testing is focused on prototype walkthroughs, mobile viewport checks, Mapbox rendering, simulated walking behavior, and mock audio playback.

## Handoff

This repository is part of an Informatics Capstone project and serves as a record of the team's research, design direction, and prototype development. The project will be handed off to the University of Washington School of Drama as a reference for future exploration of CHOP-related archival storytelling and place-based audio experiences.

## Team

**Juicy Jam**  
University of Washington Informatics Capstone

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.
