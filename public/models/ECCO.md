# ECCO - Estimating the Circulation and Climate of the Ocean

## Overview

ECCO version 4 is an ocean state estimation framework based on the MITgcm (MIT General Circulation Model) and its adjoint, providing a physically consistent description of the time-evolving state of the ocean. ECCO synthesizes nearly all available ocean observations with a general circulation model to produce a best estimate of ocean circulation and its role in climate.

## Background

The ECCO project began as a collaborative effort between MIT, JPL, and other institutions to create a comprehensive picture of ocean circulation and its evolution over time. Using advanced data assimilation techniques, ECCO combines satellite and in-situ observations with ocean physics to generate a four-dimensional view of the global ocean state.

## Key Features

- **4D Ocean State Estimation**: Time-evolving, physically consistent ocean state
- **MITgcm Integration**: Based on the premier ocean general circulation model
- **Adjoint Method**: Advanced optimization using adjoint techniques
- **Multi-Decade Coverage**: Continuous estimates from 1992 to near-present
- **Global Coverage**: Complete global ocean at 1-degree resolution
- **Comprehensive Observations**: Assimilates satellite altimetry, SST, in-situ T/S profiles, and more
- **Climate Variables**: Sea level, heat content, freshwater content, and transports

## Scientific Applications

- **Sea Level Change**: Understanding past and predicting future sea level rise
- **Ocean Heat Content**: Tracking ocean warming and heat redistribution
- **Ocean Circulation**: Analyzing current systems and meridional overturning
- **Climate Variability**: Studying ENSO, PDO, AMO, and other climate modes
- **Polar Oceanography**: Ice-ocean interactions in polar regions
- **Carbon Cycle**: Ocean's role in global carbon budget
- **Weather & Climate Prediction**: Initializing seasonal to decadal forecasts

## Technical Details

**Model Type**: Ocean State Estimation System
**Domain**: Global Ocean
**Spatial Resolution**: 1° (111 km) horizontal, 50 vertical levels
**Temporal Coverage**: 1992-present (monthly updates)
**Programming Language**: Fortran, MATLAB, Python
**Base Model**: MITgcm
**License**: Open Source (MIT License)

## JPL Team Members

- Ian Fenty
- Dimitris Menemenlis

## Key Publications

1. Forget, G., et al. (2015). "ECCO version 4: an integrated framework for non-linear inverse modeling and global ocean state estimation." *Geoscientific Model Development*, 8(10), 3071-3104.

2. Fukumori, I., et al. (2017). "ECCO Version 4 Release 3." *NASA JPL Technical Report*.

3. Wunsch, C., & Heimbach, P. (2013). "Dynamically and kinematically consistent global ocean circulation and ice state estimates." *Ocean Circulation and Climate: A 21st Century Perspective*, 103, 553-579.

## Resources

- **GitHub Repository**: https://github.com/ECCO-GROUP
- **Official Website**: https://ecco-group.org/
- **Data Portal**: https://ecco.jpl.nasa.gov/drive/files
- **Documentation**: https://ecco-group.org/docs.htm
- **PO.DAAC**: https://podaac.jpl.nasa.gov/ECCO
