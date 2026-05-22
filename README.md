# JPL Earth Modeling Enterprise (JEME) Dashboard

An interactive dashboard for visualizing citation metrics across NASA JPL scientific models and Earth observation missions.

## Supported Models (JEME)

- **RAPID** - River Application for Parallel computation of Discharge
- **CARDAMOM** - CARbon DAta MOdel framework
- **CMS-Flux** - Carbon Monitoring System Flux
- **ECCO** - Estimating the Circulation and Climate of the Ocean
- **ISSM** - Ice-sheet and Sea-level System Model
- **MOMO-CHEM** - Chemistry-Climate Model
- **LES** - Large Eddy Simulation
- **EDMF** - Eddy Diffusivity Mass Flux

## Supported Missions (JEOE)

- **GRACE** - Gravity Recovery and Climate Experiment
- **SWOT** - Surface Water and Ocean Topography
- **TROPESS** - TRopospheric Ozone and its Precursors from Earth System Sounding

## Features

- **Multi-Model Dashboard**: Overview of all models with cross-model network analysis
- **Citation Trends**: Track annual and cumulative citations over time per model
- **Research Domain Analysis**: Distribution of citations across scientific fields
- **Engagement Levels**: Analyze depth of model usage in research (L1-L4)
- **Geographic Impact**: Map-based visualization of global research impact
- **Satellite Missions**: Track which missions/instruments are referenced in citations
- **Journal Distribution**: See which journals cite each model most frequently
- **Network Analysis**: Cross-model connectivity via bridge papers, shared authors, domain overlap
- **CSV Export**: Export filtered citation data

## Technologies

- React (Create React App)
- Recharts for data visualization
- D3 / TopoJSON for geographic maps
- Tailwind CSS for styling
- Lucide React for icons

## Setup and Installation

### Prerequisites

- Node.js (v14+)
- npm

### Installation

```bash
git clone https://github.jpl.nasa.gov/kyun/jeme.git
cd jeme
npm install
npm start
```

Open [http://localhost:3000/science-model-dashboard](http://localhost:3000/science-model-dashboard) to view the dashboard.

## Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Start development server (binds to `0.0.0.0:3000`) |
| `npm run build` | Build for production |
| `npm test` | Run tests |
| `npm run deploy` | Build and deploy to GitHub Pages (JPL) |
| `node scripts/clean_citation_data.js --all --dry-run` | Preview citation data cleanup |
| `node scripts/clean_citation_data.js --model ECCO` | Clean a specific model's data |
| `python3 scripts/fetch_ecco_venues.py` | Fetch missing journal/venue info for ECCO citations |

## Data Sources

Citation data is stored as JSON in `public/data/{MODEL_NAME}_analyzed.json`. Two formats coexist:

- **Crossref format**: Used by RAPID, CMS-Flux, ISSM, CARDAMOM (fields: `title[]`, `author[]`, `DOI`, `container-title[]`)
- **Simplified format**: Used by ECCO, LES, EDMF, MOMO-CHEM (fields: `title`, `authors`, `doi`, `venue`, `research_domain`, `engagement_level`, `missions_instruments[]`)

## Citation Data Verification

Citation data undergoes a multi-agent verification pipeline that cross-validates entries using multiple external APIs and heuristic analysis. This approach treats each data source and validation method as an independent "agent" whose results are combined to make keep/remove decisions.

### Verification Agents

| Agent | Source | Role |
|-------|--------|------|
| **Semantic Scholar** | Paper metadata, citation graphs | Primary data source; provides `citing_team_paper` links |
| **Crossref API** | DOI resolution, journal metadata | Venue enrichment; validates DOI existence and journal attribution |
| **Keyword Classifier** | Title + abstract text | Topical relevance scoring via domain-specific keyword matching |
| **Team Paper Categorizer** | Team paper titles | Classifies team papers into relevance tiers (Core / Infrastructure / Related / Unrelated) |
| **Deduplication** | DOI + title matching | Removes duplicate entries across data sources |

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

All entries are peer-reviewed publications. Non-peer-reviewed entries (preprints, theses, conference abstracts, technical reports) are excluded.

### Uncertainty Quantification

Each removal decision carries inherent uncertainty from the verification methods used:

| Decision Category | Uncertainty | Rationale |
|---|---|---|
| **EGM2008 geodesy removal** (ECCO) | Low (~5%) | EGM2008 is a gravity model, not ECCO. However, some citing papers may use both. |
| **Tangential team paper removal** (ECCO) | Medium (~15%) | Clearly unrelated team papers removed, but some ocean-adjacent papers may have been over-removed. |
| **Off-topic citing paper removal** (ECCO) | Low (~3%) | Papers with abstracts clearly outside earth/environmental science. |
| **Duplicate removal** (ECCO + ISSM) | Very Low (~1%) | DOI-based and title-based deduplication. |
| **Unverifiable entries retained** | Medium (~20%) | Papers without abstracts that passed team-paper-level filtering but could not be individually verified. |
| **ISSM metadata repair** | Very Low (~2%) | Title lookup via Semantic Scholar batch API. All broken IDs resolved. |

**Overall estimated false removal rate**: ~8-12% of removed entries may have been legitimate citations with indirect relevance.

**Overall estimated false retention rate**: ~3-5% of retained entries may be false positives (primarily among entries lacking abstracts).

### Methodology Limitations

- **Keyword-based relevance**: Title/abstract keyword matching cannot detect papers that use a model's output without naming it. Estimated miss rate: 5-10%.
- **Team paper attribution**: The `citing_team_paper` field links citations to team publications, but the definition of "team paper" may be over-inclusive or under-inclusive.
- **Abstract availability**: ~50% of ECCO entries and ~4-9% of other models lack abstracts, limiting verification to title-only matching.
- **Single-pass classification**: Each entry is classified once. A multi-round human-in-the-loop review of borderline cases would improve accuracy.

## Deployment

```bash
npm run deploy
```

Deploys to GitHub Pages at `https://github.jpl.nasa.gov/pages/kyun/jeme/`.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
