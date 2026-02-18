# Science Model Dashboard

An interactive dashboard for visualizing citation metrics across multiple NASA scientific models.

## Live Demo

[https://yunks128.github.io/science-model-dashboard](https://yunks128.github.io/science-model-dashboard)

## Supported Models

- **RAPID** - River Application for Parallel computation of Discharge
- **CARDAMOM** - CARbon DAta MOdel framework
- **CMS-Flux** - Carbon Monitoring System Flux
- **ECCO** - Estimating the Circulation and Climate of the Ocean
- **ISSM** - Ice-sheet and Sea-level System Model
- **MOMO-CHEM** - Chemistry-Climate Model
- **LES** - Large Eddy Simulation
- **EDMF** - Eddy Diffusivity Mass Flux

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
git clone https://github.com/yunks128/science-model-dashboard.git
cd science-model-dashboard
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
| `npm run deploy` | Build and deploy to GitHub Pages |
| `node scripts/clean_citation_data.js --all --dry-run` | Preview citation data cleanup |
| `node scripts/clean_citation_data.js --model ECCO` | Clean a specific model's data |
| `python3 scripts/fetch_ecco_venues.py` | Fetch missing journal/venue info for ECCO citations |

## Data Sources

Citation data is stored as JSON in `src/data/{MODEL_NAME}_analyzed.json`. Two formats coexist:

- **Crossref format**: Used by RAPID, CMS-Flux, ISSM, CARDAMOM (fields: `title[]`, `author[]`, `DOI`, `container-title[]`)
- **Simplified format**: Used by ECCO, LES, EDMF, MOMO-CHEM (fields: `title`, `authors`, `doi`, `venue`, `research_domain`, `engagement_level`, `missions_instruments[]`)

## Deployment

```bash
npm run deploy
```

Deploys to GitHub Pages at the configured homepage URL.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
