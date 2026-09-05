# ORBITAL DEBRIS OBSERVATORY

Educational interactive website on space pollution / orbital debris, inspired by the Zajno “Educational Website on Space Pollution” concept.

## Concept

You are an operator inside a research observation deck monitoring Low Earth Orbit. The site contrasts the beauty of Earth with the growing cloud of human-made debris that threatens communications, navigation, and future exploration.

## Features

- **Cinematic 3D Earth** with procedural surface, volumetric-style atmosphere, and orbital shells
- **Debris visualization** — abstract particle fields and orbit rings for LEO / MEO / GEO
- **HUD interface** — crosshairs, mission timer, coordinate tags, monospaced telemetry
- **Historical timeline** from Sputnik (1957) through major collisions and ASAT tests
- **Kessler Syndrome** explanation
- **Solutions hub** — de-orbit sails, robotic capture, nets/harpoons, laser concepts + CTAs
- Responsive layout and reduced-motion support

## Design system

| Element | Implementation |
|---------|----------------|
| Palette | Deep charcoal/black (`#000`, `#0A0A0A`, `#282828`), slate HUD (`#5F5F5F`, `#939393`), warning coral/red accents |
| Aesthetic | Retro-futuristic terminal + aerospace diagram language |
| Typography | Monospaced telemetry + clean sans for headlines |
| Hierarchy | Space canvas → 3D Earth stage → floating glass/HUD panels |

## Run

```bash
npm install
npm run dev
npm run build
```

## Data note

Debris counts and metrics are educational approximations drawn from publicly discussed NASA/ESA ranges. Production deployments should cite live catalogs (e.g. Space-Track, ESA DISCOS) with provenance.
