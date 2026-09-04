# LIGHT-POLLUTED EARTH

A cinematic, interactive 3D atlas exploring Earth's artificial night.

## Current build
- Interactive WebGL Earth with orbit controls and atmospheric shell
- Procedural star field and subtle particle depth
- City-light visualization with selectable city profiles
- City search UI and data panel
- Darkness Mode / Restore the Dark interaction
- Then → Now timeline control (1995–2026)
- Responsive mobile layout and reduced-motion support
- Scientific honesty: demo city metrics are explicitly labeled; production VIIRS radiance is intended to replace them

## Production roadmap
1. Connect NASA Black Marble / NOAA VIIRS radiance composites through a server-side ETL pipeline.
2. Add GPU radiance textures, mip/LOD tiles and bloom-based emissive rendering.
3. Add air quality, CO2, temperature, population and urbanization layers.
4. Add historical comparison, night-sky simulator, city-mode 3D volumes and story scenes.
5. Add automated data provenance metadata, tests, performance budgets and deployment CI.

## Run
`npm install`

`npm run dev`

`npm run build`

## Data principle
Never label a dataset LIVE unless it is actually live. Display source and measurement date for production datasets.
