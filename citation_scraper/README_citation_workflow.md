# Citation Scraping Workflow for New Models

This document describes how to collect citations for new models (like LES and EDMF) and integrate them into the existing analysis pipeline.

## Overview

The workflow consists of three main steps:
1. **Convert team papers** from .docx to JSON format
2. **Scrape citations** using academic APIs
3. **Integrate** into the existing LLM analytics and dashboard pipeline

## Prerequisites

### Install Required Dependencies

```bash
# For citation scraping
pip install requests scholarly crossref-commons

# For DOCX processing (optional)
pip install python-docx

# Ensure Ollama is installed and running (for LLM analysis)
ollama serve
```

## Step 1: Convert Team Papers to JSON

You have team papers in `.docx` format in the `team papers/` folder. Convert them to JSON first.

### Option A: Automatic DOCX Conversion

```bash
cd pubclassifier

# Convert LES team papers
python team_papers_converter.py "team papers/LES/LES team papers.docx" LES -o LES_team_papers.json

# Convert EDMF team papers  
python team_papers_converter.py "team papers/EDMF/EDMF team papers.docx" EDMF -o EDMF_team_papers.json
```

### Option B: Manual Entry (if DOCX conversion doesn't work well)

```bash
# Manual entry for LES
python team_papers_converter.py LES -o LES_team_papers.json --format manual

# Manual entry for EDMF
python team_papers_converter.py EDMF -o EDMF_team_papers.json --format manual
```

### Option C: CSV Format (if you export from Excel/Google Sheets)

```bash
python team_papers_converter.py LES_papers.csv LES -o LES_team_papers.json --format csv
```

## Step 2: Scrape Citations

Use the citation scraper to collect papers that cite your team papers.

```bash
# Scrape citations for LES
python citation_scraper.py LES_team_papers.json -o LES_citations.json --max-citations 1000

# Scrape citations for EDMF
python citation_scraper.py EDMF_team_papers.json -o EDMF_citations.json --max-citations 1000
```

The scraper will:
- Search for each team paper using Semantic Scholar and CrossRef APIs
- Find citing papers for each team paper
- Save all citations in JSON format compatible with the existing pipeline

### Expected Output

```
Scraping Statistics:
Team papers processed: 15
Papers found: 12
Papers not found: 3
Total citations collected: 450
```

## Step 3: Integrate into Pipeline

Use the integration script to add your new model to the complete pipeline.

```bash
# Full integration for LES
python pipeline_integration.py LES LES_citations.json --team-papers LES_team_papers.json

# Full integration for EDMF
python pipeline_integration.py EDMF EDMF_citations.json --team-papers EDMF_team_papers.json
```

This will:
1. Copy citations to `../LLM_paper_analytics/data/LES.json`
2. Run LLM analysis to categorize citations (creates `LES_analyzed.json`)
3. Copy analyzed data to the dashboard (`../science-model-dashboard/src/data/`)
4. Update model configuration files

### Options

```bash
# Skip LLM analysis (if Ollama not available)
python pipeline_integration.py LES LES_citations.json --no-analysis

# Skip dashboard integration
python pipeline_integration.py LES LES_citations.json --no-dashboard

# Just validate integration
python pipeline_integration.py LES LES_citations.json --validate-only
```

## Step 4: View in Dashboard

After integration, start the dashboard to view your new model:

```bash
cd ../science-model-dashboard
npm install
npm start
```

Navigate to:
- `http://localhost:3000/science-model-dashboard/LES`
- `http://localhost:3000/science-model-dashboard/EDMF`

## Troubleshooting

### Common Issues

1. **DOCX Conversion Problems**
   ```bash
   # Install python-docx
   pip install python-docx
   
   # Or use manual entry
   python team_papers_converter.py LES -o LES_team_papers.json --format manual
   ```

2. **API Rate Limiting**
   ```bash
   # The scraper has built-in delays, but if you hit limits:
   # - Wait a few minutes between runs
   # - Use --max-citations with smaller numbers
   python citation_scraper.py LES_team_papers.json -o LES_citations.json --max-citations 100
   ```

3. **Ollama Not Available**
   ```bash
   # Skip LLM analysis for now
   python pipeline_integration.py LES LES_citations.json --no-analysis
   
   # Or install Ollama and run analysis later
   # Download from: https://ollama.ai
   ollama pull deepseek-r1:671b
   ```

4. **Papers Not Found**
   - Check the paper titles in your team papers JSON
   - Ensure DOIs are included when available
   - Some papers may not be in Semantic Scholar/CrossRef databases

### Manual Fixes

If automatic conversion doesn't work well, you can manually edit the JSON files:

```json
{
  "model_name": "LES",
  "team_papers_source": "manual",
  "extraction_date": "2025-11-11",
  "papers": [
    {
      "title": "Large Eddy Simulation of...",
      "authors": ["Smith, J.", "Jones, A."],
      "year": 2020,
      "doi": "10.1234/example",
      "venue": "Journal of Climate"
    }
  ]
}
```

## File Structure After Integration

```
LLM_paper_analytics/
├── data/
│   ├── LES.json           # Raw citations
│   └── EDMF.json
└── results/
    ├── LES_analyzed.json   # LLM-analyzed citations
    └── EDMF_analyzed.json

science-model-dashboard/
└── src/
    ├── data/
    │   ├── LES_analyzed.json   # Dashboard data
    │   └── EDMF_analyzed.json
    └── config/
        └── modelConfig.js      # Updated with new models

pubclassifier/
├── LES_team_papers.json    # Team papers
├── LES_citations.json      # Scraped citations
├── EDMF_team_papers.json
└── EDMF_citations.json
```

## Example Complete Workflow

```bash
# 1. Convert team papers
cd pubclassifier
python team_papers_converter.py "team papers/LES/LES team papers.docx" LES -o LES_team_papers.json

# 2. Scrape citations (this may take 10-30 minutes depending on number of papers)
python citation_scraper.py LES_team_papers.json -o LES_citations.json

# 3. Integrate into pipeline (requires Ollama running)
python pipeline_integration.py LES LES_citations.json --team-papers LES_team_papers.json

# 4. Start dashboard
cd ../science-model-dashboard
npm start

# 5. View results at http://localhost:3000/science-model-dashboard/LES
```

## Advanced Usage

### Custom Citation Analysis

If you want to run custom LLM analysis:

```bash
cd ../LLM_paper_analytics
python src/citation_analyzer.py data/LES.json -o results/LES_custom.json -m "Large Eddy Simulation methodology" --model "llama3.3:70b"
```

### Batch Processing Multiple Models

```bash
# Create a batch script
for model in LES EDMF; do
    echo "Processing $model..."
    python citation_scraper.py ${model}_team_papers.json -o ${model}_citations.json
    python pipeline_integration.py $model ${model}_citations.json --team-papers ${model}_team_papers.json
done
```

### Updating Existing Models

To add more citations to an existing model:

```bash
# Scrape additional citations
python citation_scraper.py LES_additional_papers.json -o LES_additional_citations.json

# Merge with existing data (you may need to manually combine JSON files)
# Then re-run integration
python pipeline_integration.py LES LES_combined_citations.json
```