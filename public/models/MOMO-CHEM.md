# MOMO-CHEM - Multi-mOdel Multi-cOnstituent CHEMical data assimilation

## Overview

MOMO-CHEM is a multi-model, multi-constituent chemical data assimilation framework for tropospheric chemical reanalysis that directly accounts for model error in transport and chemistry. The system combines multiple chemical transport models with satellite and in-situ observations to provide comprehensive estimates of atmospheric composition and air quality.

## Background

MOMO-CHEM was developed to address limitations in single-model chemical data assimilation systems by explicitly accounting for structural model uncertainties. By using a multi-model ensemble approach, the framework reduces biases associated with any individual model and provides more robust estimates of atmospheric trace gas concentrations and their uncertainties.

## Key Features

- **Multi-Model Ensemble**: Integrates multiple chemical transport models (CTMs)
- **Multi-Constituent Analysis**: Simultaneous analysis of multiple atmospheric species
- **Model Error Quantification**: Explicit treatment of transport and chemistry uncertainties
- **Satellite Data Assimilation**: Incorporates OMI, AIRS, MOPITT, and other observations
- **Tropospheric Focus**: Optimized for lower atmosphere chemistry and air quality
- **Bayesian Framework**: Rigorous uncertainty quantification and error attribution
- **Chemical Reanalysis**: Consistent long-term atmospheric composition records

## Scientific Applications

- **Air Quality Assessment**: Urban and regional pollution monitoring
- **Trace Gas Analysis**: Ozone, NO2, CO, formaldehyde distributions
- **Emission Estimation**: Top-down constraints on anthropogenic and natural emissions
- **Transport Studies**: Long-range pollutant transport and intercontinental exchange
- **Model Evaluation**: Benchmarking chemical transport model performance
- **Satellite Validation**: Cross-validation of multiple satellite products
- **Climate-Chemistry Interactions**: Aerosol-cloud-radiation feedbacks

## Technical Details

**Model Type**: Multi-Model Chemical Data Assimilation System
**Domain**: Regional to Global
**Spatial Resolution**: Variable (0.5° to 2° typical)
**Temporal Resolution**: Hourly to Daily
**Programming Language**: Fortran, Python, IDL
**Ensemble Models**: GEOS-Chem, TM5, Mozart, CAM-Chem
**License**: Varies by component

## Team Members

- Kazuyuki Miyazaki
- Kevin Bowman

## Key Publications

1. Miyazaki, K., et al. (2020). "Global tropospheric ozone responses to reduced NOx emissions linked to the COVID-19 worldwide lockdowns." *Science Advances*, 6(41), eabd2197.

2. Miyazaki, K., et al. (2020). "Updated tropospheric chemistry reanalysis and emission estimates, TCR-2, for 2005-2018." *Earth System Science Data*, 12(3), 2223-2259.

3. Bowman, K. W., et al. (2013). "Evaluation of ACCMIP outgoing longwave radiation from tropospheric ozone using TES satellite observations." *Atmospheric Chemistry and Physics*, 13(8), 4057-4072.

## Resources

- **Publications**: https://acp.copernicus.org/articles/20/931/2020/
- **Data Access**: Contact JPL atmospheric chemistry team
- **Documentation**: Available through JPL internal systems
- **Collaborations**: Through NASA atmospheric composition programs
