# ISSM - Ice Sheet System Model

## Overview

The Ice-sheet and Sea-level System Model (ISSM) tackles the challenge of modeling the evolution of the polar ice caps in Greenland and Antarctica, and the resulting solid-Earth and sea-level response. ISSM is an advanced thermomechanical ice sheet model that combines state-of-the-art numerical methods with comprehensive physics to project future ice sheet behavior and sea level rise.

## Background

ISSM was developed at NASA's Jet Propulsion Laboratory and the University of California, Irvine to provide the scientific community with a robust tool for ice sheet modeling. The model addresses critical questions about ice sheet stability, glacier dynamics, and their contribution to global sea level rise in a changing climate.

## Key Features

- **Finite Element Method**: High-resolution adaptive mesh capabilities
- **Complete Physics**: Thermomechanical coupling, damage mechanics, hydrology
- **Multiple Ice Flow Approximations**: Shallow-shelf, shallow-ice, L1L2, full-Stokes
- **Data Assimilation**: Inversion methods for basal friction and rheology
- **Uncertainty Quantification**: Dakota/UQLab integration for ensemble studies
- **High Performance Computing**: MPI parallelization for large-scale simulations
- **Sea Level Fingerprinting**: Gravitationally self-consistent sea level calculations

## Scientific Applications

- **Sea Level Projections**: Century-scale ice sheet evolution and sea level contributions
- **Ice Shelf Stability**: Assessment of ice shelf vulnerability to warming
- **Glacier Dynamics**: Fast-flowing outlet glacier behavior and grounding line retreat
- **Ice-Ocean Interactions**: Sub-shelf melting and fjord-glacier coupling
- **Paleoclimate Studies**: Past ice sheet configurations and deglaciations
- **Ice Sheet Sensitivity**: Response to climate forcing and parameter uncertainty
- **Mission Planning**: Support for NASA radar and altimetry missions

## Technical Details

**Model Type**: Thermomechanical Ice Sheet Model
**Domain**: Ice Sheet to Continental Scale
**Spatial Resolution**: 100m to 50km (adaptive)
**Temporal Resolution**: Seasonal to Multi-Millennial
**Programming Language**: C++, MATLAB, Python
**Numerical Method**: Finite Element
**License**: Open Source (LGPL-2.1)

## JPL Team Members

- Lambert Caron
- Surendra Adhikari
- Eric Larour

## Key Publications

1. Larour, E., et al. (2012). "Continental scale, high order, high spatial resolution, ice sheet modeling using the Ice Sheet System Model (ISSM)." *Journal of Geophysical Research: Earth Surface*, 117(F1).

2. Seroussi, H., et al. (2020). "ISMIP6 Antarctica: a multi-model ensemble of the Antarctic ice sheet evolution over the 21st century." *The Cryosphere*, 14(9), 3033-3070.

3. Morlighem, M., et al. (2017). "BedMachine v3: Complete bed topography and ocean bathymetry mapping of Greenland from multibeam echo sounding combined with mass conservation." *Geophysical Research Letters*, 44(21), 11-051.

## Resources

- **GitHub Repository**: https://github.com/ISSMteam/ISSM
- **Official Website**: https://issm.jpl.nasa.gov/
- **Documentation**: https://issm.jpl.nasa.gov/documentation/
- **Tutorials**: https://issm.jpl.nasa.gov/tutorials/
- **Forum**: https://issm.ess.uci.edu/forum/
