# RAPID Citation Dashboard

A modular dashboard for visualizing citation metrics for the RAPID river routing model.

## Project Structure

The project is organized into a modular structure to improve maintainability and scalability:

```
src/
├── App.js                 # Main application file
├── index.js               # Entry point
├── components/            # UI Components
│   ├── Header.js          # Header component
│   ├── Tabs.js            # Tabs navigation
│   ├── PaperInfo.js       # Original paper info
│   ├── MetricCard.js      # Reusable metric card
│   ├── ScoreCalculation.js # Calculation component
│   ├── Footer.js          # Footer component
│   └── charts/            # Chart components
│       ├── CitationTrendsChart.js
│       ├── ModelComparisonChart.js
│       ├── ResearchDomainsCard.js
│       ├── EngagementLevelsCard.js
│       ├── CitationTypeCard.js
│       ├── FutureTrendsChart.js
│       ├── JournalDistributionCard.js
│       └── GitHubMetricsCard.js
├── data/                  # Data files
│   ├── citationData.js    # Annual citation data
│   ├── modelData.js       # Model comparison data
│   ├── citationTypeData.js # Citation types
│   ├── domainData.js      # Research domains
│   ├── engagementData.js  # Engagement levels
│   ├── trendData.js       # Future trends
│   ├── journalData.js     # Journal distribution
│   └── githubData.js      # GitHub metrics
├── utils/                 # Utility functions
│   ├── colors.js          # Color palette
│   └── dataUtils.js       # Data processing utilities
├── services/              # Data services
│   └── dataService.js     # Service for fetching data
└── views/                 # Page components
    ├── Dashboard.js       # Main dashboard view
    └── sections/          # Dashboard sections
        ├── MetricsOverview.js
        ├── DashboardSummary.js
        └── ComparativeAnalysis.js
```

## Features

- **Citation Trends**: Visualize annual and cumulative citations over time
- **Research Impact Analysis**: Analyze the impact of the RAPID model in various research domains
- **Engagement Level Analysis**: Understand how deeply researchers are engaging with RAPID
- **Journal Distribution**: See which journals are citing RAPID most frequently
- **Comparative Analysis**: Compare RAPID to other similar hydrological models
- **Predictive Analytics**: View projections of future citation trends

## Technologies

- React
- Recharts for data visualization
- Lucide React for icons
- Tailwind CSS for styling

## Setup and Installation

1. Clone the repository
2. Install dependencies: `npm install`
3. Start the development server: `npm start`
4. Build for production: `npm run build`

## Data Sources

The dashboard is powered by citation data from:
- Google Scholar
- Web of Science
- Scopus
- GitHub repository metrics

## Updating the Data

To update the citation data:
1. Replace the CSV file in the `public/data` directory
2. Run the data processing script: `npm run process-data`
3. The dashboard will automatically reflect the updated data

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.


-----
# RAPID Citation Dashboard

![Dashboard Preview](https://via.placeholder.com/800x450?text=RAPID+Citation+Dashboard)

## Overview

An interactive visualization dashboard for tracking and analyzing citation metrics for the RAPID (River Application for Parallel computation of Discharge) hydrological model. This dashboard provides comprehensive insights into citation patterns, research impact, and comparative analysis against other hydrological models.

## Features

- **Citation Trends**: Track annual and cumulative citations over time
- **Research Domain Analysis**: Visualize distribution across different research fields
- **Engagement Levels**: Analyze how deeply RAPID is being utilized in research
- **Comparative Assessment**: Compare RAPID against other popular hydrological models
- **Future Projections**: View citation growth forecasts and emerging research directions
- **GitHub Metrics**: Monitor repository activity and community engagement

## Live Demo

The dashboard is available at: [https://yunks128.github.io/citation-dashboard-mockup](https://yunks128.github.io/citation-dashboard-mockup)

## Technologies Used

- React
- Recharts for data visualization
- Tailwind CSS for styling
- Lucide React for icons
- GitHub Pages for deployment

## Getting Started

### Prerequisites

- Node.js (v14+)
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yunks128/citation-dashboard-mockup.git
   cd citation-dashboard-mockup
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm start
   ```

4. Open [http://localhost:3000](http://localhost:3000) to view the dashboard in your browser.

## Deployment

The project is configured for deployment to GitHub Pages:

```bash
npm run deploy
```

This will build the application and deploy it to the `gh-pages` branch of your repository.

## Data Sources

The dashboard visualizes citation data from:
- Google Scholar
- Web of Science
- Scopus
- GitHub repository metrics

## Dashboard Components

- **Citation Metrics Overview**: Key metrics at a glance
- **Citation Trends Chart**: Historical and cumulative citation patterns
- **Research Domains**: Distribution of citations across scientific fields
- **Engagement Level Analysis**: Depth of RAPID usage in research
- **Citation Type Breakdown**: Publication venue analysis
- **Model Comparison**: Comparative analysis with similar models
- **Future Trends**: Projected growth and emerging research areas
- **GitHub Repository Metrics**: Open-source community engagement statistics

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- RAPID model developers and contributors
- The hydrological modeling research community