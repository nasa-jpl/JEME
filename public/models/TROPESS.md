# TROPESS - TROPospheric Emission Spectrometer System

## Overview

TROPESS (TROPospheric Emission Spectrometer System) is a NASA project that delivers science-quality, multi-instrument retrievals of tropospheric trace gases from infrared sounders. Building on the legacy of the TES (Tropospheric Emission Spectrometer) instrument on EOS Aura, TROPESS produces consistent, optimal-estimation retrievals from operational sounders such as CrIS (on Suomi NPP / JPSS-1/2) and AIRS (on Aqua), enabling decades-long records of atmospheric composition for chemistry, air quality, and climate research.

## Background

Tropospheric composition observations have historically come from a patchwork of instruments with different sensitivities, vertical resolutions, and retrieval algorithms — making long-term trend analysis difficult. TROPESS addresses this by applying the MUSES (MUlti-SpEctra, MUlti-SpEcies, MUlti-SEnsors) optimal-estimation retrieval algorithm uniformly across multiple sounders. This produces vertically-resolved profiles of CO, CH4, NH3, O3, PAN, and HDO/H2O with characterized averaging kernels and error covariances suitable for data assimilation and chemical reanalysis.

## Key Features

- **MUSES Algorithm**: Optimal-estimation retrievals consistent across instruments
- **Multi-Instrument**: CrIS (NPP, JPSS-1/2), AIRS (Aqua), with TES legacy continuity
- **Multi-Species**: CO, CH4, NH3, O3, PAN, HDO/H2O, and tropospheric temperature
- **Vertical Profiles**: Full averaging kernels and error covariance for assimilation
- **Streams**: Forward, special-collection, and reanalysis processing streams
- **Single-Footprint Retrievals**: Native sounder spatial resolution (no spatial averaging)

## Scientific Applications

- **Air Quality**: Megacity NH3 / O3 / PAN monitoring (e.g. Los Angeles, Mexico City)
- **Wildfire Smoke**: CO and PAN plumes from biomass burning (Western US, Canada)
- **Chemical Reanalysis**: Multi-constituent assimilation (TCR-2, MOMO-CHEM)
- **COVID-19 Lockdown Studies**: Global tropospheric NOx / ozone responses
- **Carbon Cycle**: CH4 retrieval validation for flux inversions
- **Water Cycle**: HDO/H2O isotopologue retrievals for moisture transport studies

## Technical Details

**Project Type**: Multi-instrument satellite retrieval suite
**Domain**: Global atmospheric composition
**Algorithm**: MUSES (MUlti-SpEctra, MUlti-SpEcies, MUlti-SEnsors)
**Instruments**: CrIS (NPP, JPSS-1/2), AIRS (Aqua), TES (Aura, legacy)
**Products**: CO, CH4, NH3, O3, PAN, HDO/H2O, T(p)
**Lead Institution**: NASA Jet Propulsion Laboratory (JPL)
**Heritage**: TES on EOS Aura (2004-2018)

## Team Members

- Kevin Bowman (Project Scientist)
- John Worden
- Vivienne Payne
- Susan Kulawik
- Dejian Fu
- Robert Herman
- Vijay Natraj
- Kazuyuki Miyazaki
- Ming Luo

## Key Publications

1. Worden, H., et al. (2022). "TROPESS/CrIS carbon monoxide profile validation with NOAA GML and ATom in situ aircraft observations." *Atmospheric Measurement Techniques*, 15, 5383-5398.

2. Fu, D., et al. (2018). "Retrievals of tropospheric ozone profiles from the synergism of AIRS and OMI: methodology and validation." *Atmospheric Measurement Techniques*, 11, 5587-5605.

3. Miyazaki, K., et al. (2020). "Updated tropospheric chemistry reanalysis and emission estimates, TCR-2, for 2005-2018." *Earth System Science Data*, 12, 2223-2259.

## Resources

- **Official Website**: https://tes.jpl.nasa.gov/tropess/
- **GitHub**: https://github.com/NASA-TROPESS
- **Data Portal**: https://disc.gsfc.nasa.gov/datasets?project=TROPESS
