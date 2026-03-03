#!/usr/bin/env python3
"""
Script to classify papers by research domain and engagement level.
Processes citation data files and adds research_domain and engagement_level fields.

Usage:
    python scripts/classify_papers.py                  # Process all models
    python scripts/classify_papers.py --model RAPID    # Process a specific model
    python scripts/classify_papers.py --all            # Explicit all models
"""

import argparse
import json
import os
import re
import sys
from pathlib import Path

# ---------------------------------------------------------------------------
# Generic (fallback) domain keywords
# ---------------------------------------------------------------------------

DOMAIN_KEYWORDS = {
    "Hydrology & Water Resources": [
        "river", "streamflow", "discharge", "flood", "water resource", "watershed",
        "runoff", "precipitation", "rainfall", "groundwater", "aquifer", "irrigation",
        "dam", "reservoir", "hydrological", "hydrolog", "stream", "flow routing",
        "water management", "water quality", "freshwater", "lake", "wetland"
    ],
    "Ocean & Marine Science": [
        "ocean", "sea level", "marine", "coastal", "tide", "wave", "current",
        "salinity", "thermohaline", "bathymetry", "submarine", "seafloor",
        "oceanograph", "estuar", "coral", "fisheries", "maritime", "offshore"
    ],
    "Climate Science": [
        "climate", "global warming", "greenhouse", "carbon", "co2", "temperature",
        "radiative", "forcing", "ipcc", "projection", "scenario", "rcp", "ssp",
        "paleoclimate", "climate change", "anthropogenic", "emission"
    ],
    "Atmospheric Science": [
        "atmospher", "weather", "meteorolog", "aerosol", "ozone", "radiation",
        "cloud", "convection", "boundary layer", "wind", "cyclone", "hurricane",
        "monsoon", "jet stream", "troposphere", "stratosphere", "air quality"
    ],
    "Cryosphere & Glaciology": [
        "ice sheet", "glacier", "snow", "permafrost", "arctic", "antarctic",
        "cryosphere", "ice cap", "sea ice", "ice flow", "ice dynamics", "firn",
        "greenland", "ice mass", "glacial", "polar", "frost", "icesheet"
    ],
    "Remote Sensing & Satellite": [
        "satellite", "remote sensing", "lidar", "radar", "modis", "landsat",
        "sentinel", "grace", "altimetry", "swot", "gps", "insar", "sar",
        "imagery", "pixel", "spectral", "geospatial"
    ],
    "Ecosystem & Biogeochemistry": [
        "ecosystem", "vegetation", "forest", "carbon cycle", "biomass", "npp",
        "photosynthesis", "respiration", "soil", "nutrient", "nitrogen", "phosphorus",
        "biogeochemical", "land surface", "biosphere", "ecology", "habitat"
    ],
    "Machine Learning & Data Science": [
        "machine learning", "deep learning", "neural network", "artificial intelligence",
        "data assimilation", "data-driven", "ensemble", "prediction", "forecast",
        "random forest", "regression", "classification", "lstm", "cnn", "transformer"
    ],
    "Modeling & Simulation": [
        "model", "simulation", "numerical", "parameterization", "calibration",
        "validation", "uncertainty", "sensitivity", "coupled model", "gcm",
        "regional model", "downscaling", "resolution", "grid", "finite element"
    ],
    "Geophysics & Geodesy": [
        "gravity", "geodetic", "geoid", "mass balance", "crustal", "tectonic",
        "seismic", "isostatic", "mantle", "lithosphere", "geophysic"
    ]
}

# ---------------------------------------------------------------------------
# Model-specific domain taxonomies
# ---------------------------------------------------------------------------

MODEL_SPECIFIC_DOMAINS = {
    "RAPID": {
        "River Routing & Discharge": [
            "river routing", "discharge", "river discharge", "flow routing",
            "channel routing", "muskingum", "routing scheme", "rapid model",
            "streamflow", "river flow", "river network", "river channel",
            "hydrograph", "flow velocity", "manning", "river basin",
            "river", "stream", "gauge", "rating curve", "flow regime"
        ],
        "Flood Modeling & Prediction": [
            "flood", "flooding", "inundation", "flash flood", "floodplain",
            "flood risk", "flood forecast", "flood prediction", "flood map",
            "flood frequency", "return period", "flood damage", "levee",
            "flood warning", "extreme event", "high water"
        ],
        "Watershed & Catchment Hydrology": [
            "watershed", "catchment", "basin", "sub-basin", "drainage",
            "hillslope", "overland flow", "surface runoff", "baseflow",
            "hydrological response", "water balance", "rainfall-runoff",
            "infiltration", "soil moisture", "land use change",
            "runoff", "precipitation", "rainfall"
        ],
        "Water Resource Management": [
            "water resource", "water management", "water supply", "irrigation",
            "dam", "reservoir", "water allocation", "drought", "water scarcity",
            "water demand", "water security", "water availability",
            "water stress", "hydropower", "water policy", "water quality"
        ],
        "Groundwater & Aquifer": [
            "groundwater", "aquifer", "water table", "recharge", "well",
            "subsurface", "baseflow separation", "groundwater storage",
            "groundwater depletion", "confined aquifer", "unconfined",
            "permeability", "hydraulic conductivity", "piezometer"
        ],
        "Remote Sensing Applications": [
            "satellite", "remote sensing", "altimetry", "swot", "grace",
            "sentinel", "modis", "landsat", "lidar", "sar", "insar",
            "imagery", "geospatial", "earth observation"
        ],
        "Machine Learning for Hydrology": [
            "machine learning", "deep learning", "neural network", "lstm",
            "random forest", "artificial intelligence", "data-driven",
            "prediction model", "cnn", "transformer", "surrogate model",
            "emulator", "transfer learning"
        ],
        "Climate & Water Cycle": [
            "climate change", "climate", "global warming", "water cycle",
            "precipitation change", "temperature", "evapotranspiration",
            "projection", "scenario", "rcp", "ssp", "cmip",
            "hydrological cycle", "climate impact"
        ],
        "General Hydrologic Science": [
            "hydrology", "hydrological", "hydrolog"
        ]
    },

    "CARDAMOM": {
        "Terrestrial Carbon Cycle": [
            "carbon cycle", "terrestrial carbon", "carbon budget", "carbon stock",
            "carbon flux", "nee", "npp", "gpp", "net ecosystem",
            "carbon balance", "carbon sink", "carbon source", "co2 flux",
            "carbon uptake", "respiration", "autotrophic", "heterotrophic",
            "carbon", "co2", "ecosystem", "biogeochemical"
        ],
        "Vegetation & Forest Dynamics": [
            "vegetation", "forest", "tree", "canopy", "leaf area",
            "lai", "phenology", "growing season", "deciduous", "evergreen",
            "tropical forest", "boreal forest", "deforestation", "woodland",
            "savanna", "plant", "stem", "biomass allocation",
            "biomass", "biosphere", "land surface"
        ],
        "Soil & Peatland Carbon": [
            "soil carbon", "soil organic", "peatland", "peat", "litter",
            "decomposition", "soil respiration", "turnover", "organic matter",
            "humus", "mineralization", "soil moisture", "root", "rhizosphere",
            "mycorrhiz", "soil temperature", "soil"
        ],
        "Fire & Disturbance Ecology": [
            "fire", "wildfire", "burn", "disturbance", "mortality",
            "drought stress", "insect", "beetle", "dieback", "regrowth",
            "recovery", "resilience", "thinning", "logging", "clearcut"
        ],
        "Land Use & Land Cover Change": [
            "land use", "land cover", "deforestation", "afforestation",
            "reforestation", "cropland", "agricultural", "pasture",
            "urbanization", "land management", "lulcc", "conversion"
        ],
        "Carbon Data Assimilation": [
            "data assimilation", "bayesian", "inversion", "parameter estimation",
            "optimization", "calibration", "ensemble", "posterior",
            "prior", "likelihood", "mcmc", "monte carlo", "uncertainty",
            "constraint", "observation operator",
            "model", "simulation", "numerical", "method"
        ],
        "Arctic & Permafrost Carbon": [
            "arctic", "permafrost", "tundra", "thaw", "frozen",
            "high latitude", "boreal", "siberia", "alaska", "subarctic",
            "active layer", "thermokarst", "talik", "methane"
        ],
        "Remote Sensing of Ecosystems": [
            "satellite", "remote sensing", "modis", "landsat", "sentinel",
            "lidar", "sar", "ndvi", "evi", "sif",
            "solar-induced fluorescence", "earth observation", "imagery"
        ],
        "Climate Projections & Feedbacks": [
            "climate change", "climate projection", "warming", "feedback",
            "scenario", "rcp", "ssp", "cmip", "future climate",
            "temperature sensitivity", "radiative forcing", "ipcc",
            "carbon-climate feedback", "climate model",
            "climate", "temperature", "precipitation"
        ],
        "General Science": [
            "cardamom"
        ]
    },

    "CMS-Flux": {
        "CO2 Flux & Carbon Budget": [
            "co2 flux", "carbon flux", "carbon budget", "carbon balance",
            "net flux", "nee", "nep", "npp", "gpp", "net biome",
            "carbon sink", "carbon source", "co2 exchange",
            "carbon uptake", "gross primary", "carbon", "co2"
        ],
        "Atmospheric CO2 Inversions": [
            "inversion", "inverse model", "atmospheric transport",
            "co2 concentration", "flask", "tower", "column co2",
            "xco2", "oco-2", "oco-3", "gosat", "total column",
            "atmospheric co2", "mixing ratio", "mole fraction",
            "transport model", "tracer", "atmosphere", "atmospheric"
        ],
        "Ocean Carbon Uptake": [
            "ocean carbon", "ocean co2", "ocean sink", "marine carbon",
            "ocean flux", "pco2", "sea-air", "air-sea",
            "dissolved inorganic carbon", "alkalinity", "ocean acidif",
            "ocean biogeochemistry", "ocean uptake",
            "ocean", "marine", "sea level"
        ],
        "Fossil Fuel & Urban Emissions": [
            "fossil fuel", "urban", "emission", "anthropogenic",
            "inventory", "power plant", "industrial", "city",
            "megacity", "combustion", "energy", "sector",
            "bottom-up", "top-down", "vulcan", "odiac"
        ],
        "Land-Atmosphere Exchange": [
            "land surface", "terrestrial", "land atmosphere",
            "evapotranspiration", "eddy covariance", "flux tower",
            "ecosystem exchange", "biosphere", "soil respiration",
            "vegetation", "forest", "cropland", "grassland",
            "ecosystem", "soil", "precipitation"
        ],
        "Methane & Trace Gases": [
            "methane", "ch4", "n2o", "nitrous oxide", "trace gas",
            "tropomi", "wetland emission", "rice paddy",
            "fugitive emission", "landfill", "enteric"
        ],
        "Biomass & Fire Emissions": [
            "fire", "biomass burning", "wildfire", "gfed",
            "fire emission", "burned area", "smoke", "combustion",
            "biomass", "wood", "deforestation", "land use change",
            "aboveground biomass", "carbon density"
        ],
        "Satellite Carbon Observations": [
            "satellite", "remote sensing", "oco", "gosat", "tropomi",
            "modis", "lidar", "gedi", "icesat", "earth observation",
            "retrieval", "footprint", "sounding", "orbit"
        ],
        "Carbon Cycle Modeling": [
            "carbon cycle model", "biogeochemical model", "earth system",
            "coupled model", "gcm", "cmip", "simulation", "scenario",
            "projection", "climate model", "carbon model", "benchmark",
            "model", "climate", "temperature", "warming"
        ],
        "General Science": [
            "cms"
        ]
    },

    "ECCO": {
        "Ocean Circulation & Transport": [
            "ocean circulation", "thermohaline", "meridional overturning",
            "amoc", "moc", "gyre", "transport", "current", "eddy",
            "barotropic", "baroclinic", "geostrophic", "ekman",
            "wind-driven", "ocean current", "water mass",
            "ocean", "marine", "oceanograph", "salinity"
        ],
        "Sea Level Change & Variability": [
            "sea level", "sea-level", "sealevel", "steric", "halosteric",
            "thermosteric", "tide gauge", "altimetry", "mean sea level",
            "relative sea level", "sea level rise", "sea level budget",
            "sea level trend", "coastal sea level"
        ],
        "Mesoscale & Submesoscale Dynamics": [
            "mesoscale", "submesoscale", "eddy", "eddies", "vortex",
            "front", "filament", "instability", "turbulence",
            "mixing", "stirring", "kinetic energy"
        ],
        "Ocean Heat & Energy Budget": [
            "ocean heat", "ocean warming", "heat content", "heat transport",
            "heat flux", "energy budget", "enthalpy", "temperature",
            "thermal", "upper ocean", "deep ocean", "ocean temperature"
        ],
        "Arctic & Polar Ocean": [
            "arctic ocean", "arctic", "antarctic", "polar", "sea ice",
            "ice-ocean", "bering", "beaufort", "chukchi", "greenland sea",
            "weddell", "ross sea", "southern ocean", "nordic seas",
            "ice shelf ocean", "subpolar"
        ],
        "Coastal & Regional Ocean": [
            "coastal", "shelf", "estuar", "bay", "gulf", "strait",
            "marginal sea", "regional ocean", "upwelling", "tidal",
            "continental shelf", "nearshore", "littoral", "lagoon"
        ],
        "Marine Biogeochemistry": [
            "biogeochemistry", "nutrient", "oxygen", "chlorophyll",
            "primary production", "phytoplankton", "carbon cycle",
            "dissolved oxygen", "nitrogen cycle", "phosphorus",
            "silicate", "marine ecosystem", "biological pump",
            "carbon", "co2", "ecosystem"
        ],
        "Ocean-Ice Interaction": [
            "ice shelf", "ice-ocean interaction", "basal melt",
            "glacier ocean", "iceberg", "freshwater flux",
            "meltwater", "ice front", "calving", "grounding line",
            "sub-ice", "cavity circulation", "glacier", "ice sheet"
        ],
        "Satellite Oceanography": [
            "satellite", "remote sensing", "altimeter", "jason",
            "sentinel", "grace", "swot", "sst retrieval",
            "sea surface temperature", "sea surface height",
            "ssh", "ocean color", "earth observation",
            "radar", "lidar", "imagery"
        ],
        "Ocean Modeling & Data Assimilation": [
            "data assimilation", "state estimation", "reanalysis",
            "adjoint", "4d-var", "ensemble kalman", "ocean model",
            "mitgcm", "mom6", "nemo", "hycom", "parameterization",
            "grid resolution", "numerical method", "ecco",
            "simulation", "numerical", "calibration", "validation"
        ],
        "General Science": [
            "ecco"
        ]
    },

    "EDMF": {
        "Boundary Layer Turbulence": [
            "boundary layer", "planetary boundary", "pbl", "abl",
            "turbulence", "turbulent", "mixing", "entrainment",
            "surface layer", "roughness", "shear", "tke",
            "turbulent kinetic", "eddy diffusivity", "stable boundary"
        ],
        "Convection & Cloud Processes": [
            "convection", "convective", "cloud", "cumulus", "updraft",
            "downdraft", "plume", "mass flux", "moist convection",
            "shallow convection", "deep convection", "stratocumulus",
            "cloud fraction", "cloud base", "cloud top", "condensation"
        ],
        "Weather Prediction & NWP": [
            "weather", "nwp", "numerical weather", "forecast",
            "operational", "prediction", "gfs", "ecmwf", "era5",
            "reanalysis", "synoptic", "mesoscale", "storm", "cyclone"
        ],
        "Air Quality & Pollution": [
            "air quality", "pollution", "pollutant", "pm2.5", "pm10",
            "ozone", "nox", "emission", "dispersion", "plume",
            "urban air", "smog", "particulate", "aerosol"
        ],
        "Aerosol & Radiation": [
            "aerosol", "radiation", "radiative", "shortwave", "longwave",
            "solar", "albedo", "optical depth", "scattering", "absorption",
            "dust", "black carbon", "sulfate"
        ],
        "Tropical Cyclones & Storms": [
            "tropical cyclone", "hurricane", "typhoon", "tropical storm",
            "eye wall", "wind speed", "storm surge", "intensity",
            "severe weather", "thunderstorm", "tornado", "squall"
        ],
        "Parameterization Development": [
            "parameterization", "parametrization", "scheme", "closure",
            "edmf", "eddy-diffusivity mass-flux", "unified parameterization",
            "subgrid", "scale-aware", "stochastic", "calibration",
            "tuning", "single column", "scm"
        ],
        "General Atmospheric Science": [
            "atmosphere", "atmospheric", "meteorolog", "climate",
            "temperature", "humidity", "wind", "pressure", "precipitation"
        ]
    },

    "ISSM": {
        "Ice Sheet Dynamics & Flow": [
            "ice sheet", "ice flow", "ice dynamics", "ice stream",
            "ice velocity", "sliding", "deformation", "stress",
            "strain rate", "viscosity", "rheology", "glen",
            "ice sheet model", "icesheet", "stokes", "higher order",
            "ice", "cryosphere"
        ],
        "Ice Shelf & Calving": [
            "ice shelf", "calving", "iceberg", "ice front",
            "buttressing", "collapse", "disintegration", "rift",
            "fracture", "crevasse", "tabular", "ice tongue",
            "shelf break", "thinning"
        ],
        "Glacier Retreat & Mass Balance": [
            "glacier", "glacial", "retreat", "advance", "mass balance",
            "mass loss", "surface mass balance", "smb", "accumulation",
            "ablation", "melt rate", "ice loss", "ice volume"
        ],
        "Sea Level Contribution": [
            "sea level", "sea-level", "sealevel", "contribution",
            "sea level rise", "sea level projection", "slr",
            "global mean sea level", "gmsl", "barystatic",
            "eustatic", "coastal flooding", "coastal"
        ],
        "Subglacial & Basal Processes": [
            "subglacial", "basal", "bed", "bedrock", "geothermal",
            "friction", "basal sliding", "basal melt", "till",
            "sediment", "subglacial hydrology", "water pressure",
            "basal drag", "grounding line", "grounding zone"
        ],
        "Polar Ocean & Ice-Ocean Interaction": [
            "ocean", "ice-ocean", "marine ice", "warm water",
            "cavity", "fjord", "meltwater", "submarine melt",
            "thermal forcing", "amundsen", "weddell", "ross",
            "circumpolar deep water", "intrusion", "marine"
        ],
        "Snow & Firn Processes": [
            "snow", "firn", "compaction", "densification", "snowfall",
            "snowpack", "snowmelt", "albedo", "refreezing",
            "percolation", "firn aquifer", "surface melt"
        ],
        "Remote Sensing of Ice": [
            "satellite", "remote sensing", "insar", "sar", "radar",
            "icesat", "cryosat", "grace", "lidar", "altimetry",
            "interferometry", "imagery", "earth observation"
        ],
        "Ice Sheet Modeling & Methods": [
            "finite element", "mesh", "adaptive mesh", "inversion",
            "adjoint", "data assimilation", "uncertainty", "ensemble",
            "sensitivity", "initialization", "spinup", "projection",
            "numerical method", "resolution", "parameterization",
            "model", "simulation", "numerical", "calibration"
        ],
        "General Science": [
            "issm", "climate", "polar", "arctic", "antarctic",
            "greenland", "antarctica"
        ]
    },

    "LES": {
        "Cloud & Stratocumulus Simulation": [
            "cloud", "stratocumulus", "cumulus", "cloud deck",
            "cloud top", "cloud base", "drizzle", "liquid water",
            "cloud fraction", "cloud layer", "marine cloud",
            "trade wind cumulus", "shallow cumulus", "overcast",
            "convection", "precipitation", "rain", "moisture"
        ],
        "Boundary Layer Turbulence": [
            "boundary layer", "turbulence", "turbulent", "mixing",
            "entrainment", "convective boundary", "surface layer",
            "pbl", "abl", "tke", "eddy", "shear",
            "buoyancy", "inversion", "capping",
            "atmosphere", "atmospheric", "weather", "climate",
            "temperature", "radiation", "aerosol"
        ],
        "Methane Detection & Plumes": [
            "methane", "ch4", "plume", "emission", "leak",
            "point source", "natural gas", "oil and gas", "pipeline",
            "detection", "quantification", "concentration"
        ],
        "Fire & Smoke Modeling": [
            "fire", "wildfire", "smoke", "combustion", "flame",
            "pyroconvection", "fire spread", "burn", "heat flux",
            "fire weather", "firebrand", "prescribed fire"
        ],
        "Atmospheric Chemistry LES": [
            "chemistry", "chemical", "ozone", "nox", "reactive",
            "photochemistry", "oxidant", "radical", "voc",
            "secondary organic", "aerosol formation"
        ],
        "Wind & Urban Applications": [
            "wind", "wind energy", "wind farm", "wind turbine",
            "urban", "canopy", "building", "street canyon",
            "pedestrian", "ventilation", "dispersion", "city"
        ],
        "Remote Sensing & AI Methods": [
            "satellite", "remote sensing", "machine learning",
            "deep learning", "neural network", "retrieval",
            "imagery", "observation", "detection algorithm",
            "classification", "training data"
        ],
        "General Science": [
            "large eddy simulation"
        ]
    },

    "MOMO-CHEM": {
        "Ozone & Stratospheric Chemistry": [
            "ozone", "stratosphere", "stratospheric", "ozone layer",
            "ozone depletion", "ozone hole", "total column ozone",
            "uv radiation", "polar vortex", "chlorine", "bromine",
            "cfc", "halocarbon", "tropopause"
        ],
        "Aerosol Processes & Effects": [
            "aerosol", "particulate", "pm2.5", "pm10", "dust",
            "black carbon", "sulfate", "sea salt", "organic aerosol",
            "aerosol optical", "aod", "nucleation", "coagulation",
            "hygroscopic", "ccn"
        ],
        "Air Quality & Health": [
            "air quality", "pollution", "health", "respiratory",
            "exposure", "mortality", "morbidity", "nox", "sox",
            "smog", "clean air", "air pollution", "public health",
            "epa", "standard", "emission"
        ],
        "Methane & Trace Gases": [
            "methane", "ch4", "n2o", "nitrous oxide", "carbon monoxide",
            "co", "formaldehyde", "hcho", "ethane", "propane",
            "trace gas", "volatile organic", "voc", "isoprene"
        ],
        "Chemical Transport Modeling": [
            "chemical transport", "ctm", "geos-chem", "cam-chem",
            "waccm", "mozart", "transport", "tracer", "advection",
            "diffusion", "emission inventory", "chemical mechanism",
            "photolysis", "reaction rate", "model", "simulation",
            "chemistry", "chemical", "atmospheric chemistry"
        ],
        "Wildfire & Biomass Burning": [
            "fire", "wildfire", "biomass burning", "smoke",
            "fire emission", "burned area", "gfed", "pyroconvection",
            "prescribed burn", "fire season", "carbon monoxide"
        ],
        "Satellite Atmospheric Observations": [
            "satellite", "remote sensing", "tropomi", "omi", "mls",
            "airs", "cris", "retrieval", "column", "profile",
            "earth observation", "orbit", "footprint"
        ],
        "Climate-Chemistry Interactions": [
            "climate change", "climate", "feedback", "radiative forcing",
            "greenhouse", "warming", "temperature", "circulation",
            "monsoon", "enso", "projection", "scenario", "cmip",
            "atmosphere", "atmospheric", "weather", "radiation"
        ],
        "General Science": [
            "momo"
        ]
    },

    "GRACE": {
        "Terrestrial Water Storage": [
            "terrestrial water storage", "tws", "water storage",
            "total water storage", "soil moisture", "groundwater storage",
            "water balance", "hydrological", "land water",
            "water", "freshwater", "lake", "wetland", "snow",
            "evapotranspiration", "land surface"
        ],
        "Groundwater Depletion": [
            "groundwater", "aquifer", "depletion", "groundwater depletion",
            "water table", "well", "pumping", "extraction",
            "overdraft", "sustainable yield", "recharge"
        ],
        "Ice Mass Balance": [
            "ice sheet", "ice mass", "glacier", "ice loss", "greenland",
            "antarctica", "mass balance", "cryosphere", "ice cap",
            "polar", "glacial", "ice volume", "arctic", "antarctic",
            "sea ice", "ice flow", "firn"
        ],
        "Ocean Mass & Sea Level": [
            "ocean mass", "sea level", "ocean bottom pressure",
            "steric", "barystatic", "mean sea level",
            "sea level budget", "ocean heat", "thermosteric",
            "ocean", "marine", "coastal"
        ],
        "Gravity Field & Geodesy": [
            "gravity field", "gravity", "geoid", "spherical harmonic",
            "mascon", "mass concentration", "geodesy", "geodetic",
            "geopotential", "gia", "glacial isostatic", "crustal",
            "geophysic", "tectonic", "seismic", "isostatic"
        ],
        "Drought & Flood Detection": [
            "drought", "flood", "extreme", "anomaly", "deficit",
            "wet", "dry", "precipitation", "water stress",
            "disaster", "hazard", "monitoring", "climate",
            "temperature", "warming"
        ],
        "River Basin Hydrology": [
            "river basin", "basin", "watershed", "catchment",
            "discharge", "runoff", "streamflow", "river",
            "amazon", "ganges", "mississippi", "congo", "nile",
            "irrigation", "dam", "reservoir"
        ],
        "GRACE Instrument & Methods": [
            "grace", "grace-fo", "follow-on", "twin satellite",
            "ranging", "accelerometer", "k-band", "laser ranging",
            "data processing", "destriping", "filtering", "leakage",
            "signal separation", "spatial resolution",
            "satellite", "remote sensing", "earth observation",
            "model", "simulation", "inversion", "data assimilation"
        ],
        "General Science": [
            "grace"
        ]
    },

    "SWOT": {
        "River & Lake Monitoring": [
            "river", "lake", "inland water", "water surface",
            "river discharge", "river width", "water level",
            "water extent", "river height", "freshwater",
            "stream", "tributary", "hydrograph", "streamflow",
            "runoff", "water body", "water depth", "gauge",
            "hydrology", "hydrological", "watershed", "catchment",
            "basin", "water balance"
        ],
        "Flood Mapping & Detection": [
            "flood", "flooding", "inundation", "flood map",
            "flood extent", "flood detection", "floodplain",
            "flood risk", "flash flood", "flood monitoring",
            "disaster", "emergency", "extreme event", "high water"
        ],
        "Ocean Surface Topography": [
            "ocean topography", "sea surface height", "ssh",
            "ocean surface", "mesoscale", "submesoscale",
            "ocean circulation", "eddy", "geostrophic",
            "ocean dynamics", "sea level", "ocean",
            "marine", "current", "wave", "salinity",
            "thermohaline", "oceanograph", "sea surface"
        ],
        "Coastal & Estuarine Dynamics": [
            "coastal", "estuar", "tidal", "tide", "nearshore",
            "bay", "lagoon", "shelf", "storm surge",
            "coastal flooding", "littoral", "shoreline",
            "mangrove", "wetland", "delta", "harbor"
        ],
        "Altimetry Methods & Calibration": [
            "altimeter", "altimetry", "interferometry", "karin",
            "calibration", "validation", "cal/val", "crossover",
            "orbit", "troposphere correction", "ionosphere",
            "wet troposphere", "instrument", "swath",
            "satellite", "remote sensing", "radar", "sar",
            "lidar", "measurement", "retrieval", "algorithm"
        ],
        "Reservoir & Water Management": [
            "reservoir", "dam", "water management", "water resource",
            "storage", "hydropower", "water supply", "irrigation",
            "water allocation", "water security", "drought"
        ],
        "Bathymetry & Seafloor": [
            "bathymetry", "seafloor", "depth", "bottom topography",
            "submarine", "ocean floor", "sonar", "submerged"
        ],
        "General Science": [
            "swot"
        ]
    },
}

ALL_MODELS = [
    "CARDAMOM", "CMS-Flux", "ECCO", "EDMF", "GRACE",
    "ISSM", "LES", "MOMO-CHEM", "RAPID", "SWOT"
]

# Engagement level keywords
ENGAGEMENT_KEYWORDS = {
    "Level 4: Foundational Method": [
        "based on", "built upon", "extends", "foundation", "core method",
        "fundamental", "underlying", "backbone", "integral part", "key component"
    ],
    "Level 3: Model Adaptation": [
        "modified", "adapted", "customized", "enhanced", "improved", "extended",
        "coupled with", "integrated with", "combined", "incorporated"
    ],
    "Level 2: Data Usage": [
        "data from", "output from", "results from", "using data", "utilized",
        "employed", "applied", "used", "dataset", "products"
    ],
    "Level 1: Simple Citation": [
        "cited", "referenced", "mentioned", "noted", "described", "reported",
        "previous study", "prior work", "earlier research"
    ]
}


def get_domain_keywords(model_name=None):
    """Return the appropriate domain keyword dict for a model."""
    if model_name and model_name in MODEL_SPECIFIC_DOMAINS:
        return MODEL_SPECIFIC_DOMAINS[model_name]
    return DOMAIN_KEYWORDS


def get_domain_list(model_name=None):
    """Return the list of domain names for a model (used by Phase 2)."""
    keywords = get_domain_keywords(model_name)
    domains = list(keywords.keys())
    if "General Science" not in domains and "General Hydrologic Science" not in domains and "General Atmospheric Science" not in domains:
        domains.append("General Science")
    return domains


def classify_domain(paper, domain_keywords=None):
    """Classify paper into research domain based on title, abstract, and venue."""
    if domain_keywords is None:
        domain_keywords = DOMAIN_KEYWORDS

    # Combine text fields for analysis
    text_parts = []

    title = paper.get('title', '')
    if isinstance(title, list):
        title = title[0] if title else ''
    text_parts.append(title.lower())

    abstract = paper.get('abstract', '') or ''
    text_parts.append(abstract.lower())

    venue = paper.get('venue', '') or paper.get('container-title', '')
    if isinstance(venue, list):
        venue = venue[0] if venue else ''
    text_parts.append(venue.lower())

    text = ' '.join(text_parts)

    # Score each domain
    domain_scores = {}
    for domain, keywords in domain_keywords.items():
        score = 0
        for keyword in keywords:
            # Count occurrences with word boundary awareness
            count = len(re.findall(r'\b' + re.escape(keyword.lower()) + r'\b', text))
            score += count
        if score > 0:
            domain_scores[domain] = score

    # Return domain with highest score, or fallback "General Science" if no match
    if domain_scores:
        return max(domain_scores, key=domain_scores.get)

    # Find the "General" fallback in the keyword dict
    for domain_name in domain_keywords:
        if domain_name.startswith("General"):
            return domain_name
    return "General Science"


def classify_engagement(paper):
    """Classify paper engagement level based on citing context."""
    # Get text to analyze
    text_parts = []

    abstract = paper.get('abstract', '') or ''
    text_parts.append(abstract.lower())

    # Check for citing_team_paper field which indicates the relationship
    citing_context = paper.get('citing_team_paper', '') or ''
    text_parts.append(citing_context.lower())

    text = ' '.join(text_parts)

    # Score each engagement level (check from highest to lowest)
    for level in ["Level 4: Foundational Method", "Level 3: Model Adaptation",
                  "Level 2: Data Usage", "Level 1: Simple Citation"]:
        keywords = ENGAGEMENT_KEYWORDS[level]
        for keyword in keywords:
            if keyword.lower() in text:
                return level

    # Default based on citation count (higher citations often indicate deeper engagement)
    citation_count = paper.get('citation_count', 0) or paper.get('is-referenced-by-count', 0) or 0

    if citation_count > 100:
        return "Level 3: Model Adaptation"
    elif citation_count > 20:
        return "Level 2: Data Usage"
    else:
        return "Level 1: Simple Citation"


def process_file(input_path, output_path, model_name=None):
    """Process a single JSON file and add classifications."""
    print(f"Processing {input_path} (model={model_name or 'generic'})...")

    domain_keywords = get_domain_keywords(model_name)
    print(f"  Using {'model-specific' if model_name in MODEL_SPECIFIC_DOMAINS else 'generic'} taxonomy with {len(domain_keywords)} domains")

    with open(input_path, 'r', encoding='utf-8') as f:
        data = json.load(f)

    # Filter out papers with invalid years
    # Valid range: 1990 (reasonable start) to current year (2025)
    MIN_YEAR = 1990
    MAX_YEAR = 2025

    original_count = len(data)
    filtered_data = []
    removed_count = 0

    for paper in data:
        year = paper.get('year')
        if year is not None and (year < MIN_YEAR or year > MAX_YEAR):
            removed_count += 1
            continue
        filtered_data.append(paper)

    data = filtered_data
    if removed_count > 0:
        print(f"  Removed {removed_count} papers with invalid years (outside {MIN_YEAR}-{MAX_YEAR})")

    # Track statistics
    domain_counts = {}
    engagement_counts = {}

    for paper in data:
        # Add research domain
        domain = classify_domain(paper, domain_keywords)
        paper['research_domain'] = domain
        domain_counts[domain] = domain_counts.get(domain, 0) + 1

        # Add engagement level
        engagement = classify_engagement(paper)
        paper['engagement_level'] = engagement
        engagement_counts[engagement] = engagement_counts.get(engagement, 0) + 1

    # Write output
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2)

    # Print domain distribution sorted by count
    print(f"  Processed {len(data)} papers (from {original_count})")
    print(f"  Domain distribution:")
    for domain, count in sorted(domain_counts.items(), key=lambda x: -x[1]):
        pct = 100.0 * count / len(data) if data else 0
        print(f"    {domain}: {count} ({pct:.1f}%)")
    print(f"  Engagement distribution: {engagement_counts}")
    print(f"  Output: {output_path}")
    return len(data)


def main():
    parser = argparse.ArgumentParser(
        description="Classify papers by research domain and engagement level"
    )
    parser.add_argument("--model", type=str, help="Process a specific model (e.g. RAPID)")
    parser.add_argument("--all", action="store_true", help="Process all models")
    args = parser.parse_args()

    # Get project root
    script_dir = Path(__file__).parent
    project_root = script_dir.parent
    data_dir = project_root / 'public' / 'data'

    if args.model:
        if args.model not in ALL_MODELS:
            print(f"ERROR: Unknown model '{args.model}'. Valid: {', '.join(ALL_MODELS)}")
            sys.exit(1)
        models = [args.model]
    else:
        models = list(ALL_MODELS)

    total_papers = 0
    for model in models:
        input_file = data_dir / f'{model}_analyzed.json'
        if input_file.exists():
            # Process in place (overwrite)
            total_papers += process_file(input_file, input_file, model_name=model)
        else:
            print(f"Warning: {input_file} not found")
        print()

    print(f"Total papers processed: {total_papers}")


if __name__ == '__main__':
    main()
