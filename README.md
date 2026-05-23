# JPL Earth Modeling Enterprise (JEME) Dashboard

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![SLIM](https://img.shields.io/badge/Best%20Practices%20from-SLIM-blue)](https://nasa-ammos.github.io/slim/)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)](https://reactjs.org/)
[![GitHub Pages](https://img.shields.io/badge/GitHub%20Pages-Live-brightgreen?logo=github)](https://github.jpl.nasa.gov/pages/kyun/jeme/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-2.2-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

An interactive dashboard for visualizing citation metrics, research impact, and model capability levels across NASA JPL Earth science models and observation missions.

![JEME Dashboard](public/JEME-1slide.jpg)

---

## Table of Contents

- [Overview](#overview)
- [Screenshots](#screenshots)
- [Supported Models & Missions](#supported-models--missions)
- [Features](#features)
- [Technologies](#technologies)
- [Setup and Installation](#setup-and-installation)
- [Scripts](#scripts)
- [Data Sources](#data-sources)
- [Citation Data Verification](#citation-data-verification)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [Governance](#governance)
- [Citation](#citation)
- [License](#license)

---

## Overview

The JEME Dashboard is a React-based web application that provides interactive visualizations of how NASA JPL Earth science models are cited and used in the scientific literature. It covers two enterprise views:

- **JEME** (JPL Earth Modeling Enterprise) — 8 science models
- **JEOE** (JPL Earth Observation Enterprise) — NASA Earth observation missions

---

## Screenshots

### JEME Main Dashboard
![JEME Dashboard Overview](public/JEME-1slide.jpg)

### Model Dashboard (ECCO example)
The per-model dashboard shows citation trends, engagement levels, research domain breakdown, geographic impact, and journal distribution.

> Additional screenshots available at the [live site](https://github.jpl.nasa.gov/pages/kyun/jeme/).

---

## Supported Models & Missions

### JEME — Science Models

| Model | Full Name |
|-------|-----------|
| **RAPID** | River Application for Parallel computation of Discharge |
| **CARDAMOM** | CARbon DAta MOdel framework |
| **CMS-Flux** | Carbon Monitoring System Flux |
| **ECCO** | Estimating the Circulation and Climate of the Ocean |
| **ISSM** | Ice-sheet and Sea-level System Model |
| **MOMO-CHEM** | Chemistry-Climate Model |
| **LES** | Large Eddy Simulation |
| **EDMF** | Eddy Diffusivity Mass Flux |

### JEOE — NASA Missions

| Mission | Full Name |
|---------|-----------|
| **GRACE** | Gravity Recovery and Climate Experiment |
| **SWOT** | Surface Water and Ocean Topography |
| **TROPESS** | TRopospheric Ozone and its Precursors from Earth System Sounding |

---

## Features

- **Multi-Model Dashboard** — Overview of all models with cross-model network analysis
- **Citation Trends** — Annual and cumulative citations over time per model
- **Research Domain Analysis** — Distribution of citations across scientific fields
- **Engagement Levels** — Depth of model usage in research (L1–L4)
- **Geographic Impact** — Map-based visualization of global research impact
- **Satellite Missions** — Track which missions/instruments are referenced in citations
- **Journal Distribution** — See which journals cite each model most frequently
- **Network Analysis** — Cross-model connectivity via bridge papers, shared authors, domain overlap
- **Model Capability Levels (MCL)** — Maturity assessment for each science model
- **Uncertainty Quantification** — 3-phase UQ pipeline with stochastic variance and skeptic agent review
- **Private Sector Engagement** — Alumni network and industry adoption explorer
- **CSV Export** — Export filtered citation data

---

## Technologies

- [React 18](https://reactjs.org/) (Create React App)
- [Recharts](https://recharts.org/) for data visualization
- [D3](https://d3js.org/) / [TopoJSON](https://github.com/topojson/topojson) for geographic maps
- [Tailwind CSS v2](https://tailwindcss.com/) for styling
- [Lucide React](https://lucide.dev/) for icons

---

## Setup and Installation

### Prerequisites

- Node.js v14+
- npm

### Installation

```bash
git clone https://github.jpl.nasa.gov/kyun/jeme.git
cd jeme
npm install
npm start
```

Open [http://localhost:3000/science-model-dashboard](http://localhost:3000/science-model-dashboard) to view the dashboard.

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Start development server (binds to `0.0.0.0:3000`) |
| `npm run build` | Build for production |
| `npm test` | Run tests |
| `npm run deploy` | Build and deploy to GitHub Pages (JPL) |
| `node scripts/clean_citation_data.js --all --dry-run` | Preview citation data cleanup across all models |
| `node scripts/clean_citation_data.js --model ECCO` | Clean a specific model's data |
| `python3 scripts/verify_peer_review.py --all --dry-run` | Preview non-peer-reviewed paper removal |
| `python3 scripts/verify_peer_review.py --model TROPESS` | Remove non-peer-reviewed papers for a specific model |
| `python3 scripts/compute_uncertainty.py --model RAPID` | Run Phase 1 uncertainty scoring |
| `python3 scripts/phase2_llm_confidence.py --model RAPID --sample 10` | Run Phase 2 LLM confidence sampling |
| `python3 scripts/phase3_skeptic_agent.py --model RAPID` | Run Phase 3 skeptic agent review |
| `python3 scripts/fetch_ecco_venues.py` | Fetch missing journal/venue info for ECCO citations |

---

## Data Sources

Citation data is stored as JSON in `public/data/{MODEL_NAME}_analyzed.json`. Two formats coexist:

- **Crossref format**: Used by RAPID, CMS-Flux, ISSM, CARDAMOM — fields: `title[]`, `author[]`, `DOI`, `container-title[]`
- **Simplified format**: Used by ECCO, LES, EDMF, MOMO-CHEM — fields: `title`, `authors`, `doi`, `venue`, `research_domain`, `engagement_level`, `missions_instruments[]`

Always use `extractPublicationData()` from `src/utils/dataUtils.js` to normalize entries before processing.

---

## Citation Data Verification

Citation data undergoes a multi-agent verification pipeline that cross-validates entries using multiple external APIs and heuristic analysis.

### Verification Agents

| Agent | Source | Role |
|-------|--------|------|
| **Semantic Scholar** | Paper metadata, citation graphs | Primary data source; provides `citing_team_paper` links |
| **Crossref API** | DOI resolution, journal metadata | Venue enrichment; validates DOI existence and journal attribution |
| **Keyword Classifier** | Title + abstract text | Topical relevance scoring via domain-specific keyword matching |
| **Team Paper Categorizer** | Team paper titles | Classifies team papers into relevance tiers (Core / Infrastructure / Related / Unrelated) |
| **Deduplication** | DOI + title matching | Removes duplicate entries across data sources |

All entries are peer-reviewed publications. Non-peer-reviewed entries (preprints, theses, conference abstracts, technical reports) are excluded.

### Verified Papers by Model

| Model | Papers in Dashboard | Confidence |
|-------|-------------------|------------|
| RAPID | 336 | High (96% keyword match) |
| CARDAMOM | 514 | High (95% keyword match) |
| CMS-Flux | 646 | High (95% keyword match) |
| ECCO | 16,320 | Medium-High |
| ISSM | 3,491 | High (96% keyword match; metadata repaired) |
| MOMO-CHEM | 983 | High (95% keyword match) |
| LES | 168 | High (93% keyword match) |
| EDMF | 810 | High (91% keyword match) |
| GRACE | 3,084 | High |
| SWOT | 371 | High |
| TROPESS | 771 | High |

### Uncertainty Estimates

- **Overall false removal rate**: ~8–12% of removed entries may have been legitimate citations with indirect relevance.
- **Overall false retention rate**: ~3–5% of retained entries may be false positives (primarily among entries lacking abstracts).

### Methodology Limitations

- **Keyword-based relevance**: Cannot detect papers that use a model's output without naming it. Estimated miss rate: 5–10%.
- **Abstract availability**: ~50% of ECCO entries and ~4–9% of other models lack abstracts, limiting verification to title-only matching.
- **Single-pass classification**: Each entry is classified once without human-in-the-loop review of borderline cases.

---

## Deployment

```bash
npm run deploy
```

Deploys to GitHub Pages at [`https://github.jpl.nasa.gov/pages/kyun/jeme/`](https://github.jpl.nasa.gov/pages/kyun/jeme/).

---

## Contributing

Please read [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) before contributing. To report bugs or request features, use the [issue tracker](https://github.jpl.nasa.gov/kyun/jeme/issues).

Pull requests are welcome — please use the [PR template](.github/PULL_REQUEST_TEMPLATE.md) and ensure `npm run build` passes before submitting.

---

## Governance

See [GOVERNANCE.md](GOVERNANCE.md) for project decision-making, maintainership, and release policies.

---

## Citation

If you use this dashboard in your research, please cite it using the metadata in [CITATION.cff](CITATION.cff).

---

## License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
