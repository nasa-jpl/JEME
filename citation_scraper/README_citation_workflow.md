# Citation Scraping Workflow for New Models

This document describes how to collect citations for new models (like LES and EDMF) and integrate them into the existing analysis pipeline.

## Overview

The workflow consists of four main steps:
1. **Prepare team papers** in JSON format (located in `/public/data/`)
2. **Scrape citations** using academic APIs (Semantic Scholar + CrossRef)
3. **Deduplicate citations** to remove redundant entries
4. **Integrate** into the dashboard and LLM analytics pipeline

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

## Quick Start: Batch Processing All Models

The fastest way to process multiple models is using the automated batch processing script:

```bash
cd citation_scraper

# Process all models automatically
python3 run_citation_scraper.py

# Process specific models only
python3 run_citation_scraper.py --models CARDAMOM RAPID CMS-Flux

# For very large datasets (like ECCO), run separately with unlimited timeout
nohup python3 citation_scraper.py temp/ECCO_normalized.json -o output/ECCO_citations.json --max-citations 999999 > ecco_scraper.log 2>&1 &
```

**What This Does:**
- Reads team papers from `/public/data/*_team_papers.json`
- Normalizes paper data (cleans HTML entities, extracts DOIs)
- Scrapes citations using DOI-based search (most reliable)
- Saves results to `output/MODEL_citations.json` and `output/MODEL_citations_citations_only.json`
- No citation limit (collects all available citations)

**Current Supported Models:**
- CARDAMOM (20 team papers)
- CMS-Flux (15 team papers)
- ECCO (2,038 team papers)
- EDMF (25 team papers)
- ISSM (171 team papers)
- LES (21 team papers)
- MOMO-CHEM (73 team papers)
- RAPID (16 team papers)

### Monitor Progress

For large datasets, monitor progress using the monitoring scripts:

```bash
# Monitor all models
./monitor_progress.sh

# Monitor ECCO specifically
./monitor_ecco.sh

# Auto-refresh every 60 seconds
watch -n 60 ./monitor_ecco.sh

# Check logs directly
tail -f ecco_scraper.log
```

## Step 1: Prepare Team Papers JSON

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
- Search for each team paper using DOI first (most reliable), then fall back to title search
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

## Step 3: Deduplicate Citations

After scraping, remove duplicate citations within each model. Duplicates occur when multiple team papers cite the same work.

### Run Deduplication

```bash
cd citation_scraper

# Deduplicate all models (creates separate deduplicated files)
python3 deduplicate_citations.py

# Deduplicate specific models only
python3 deduplicate_citations.py --models ISSM ECCO

# Deduplicate in-place (replace original files)
python3 deduplicate_citations.py --in-place
```

### What Gets Deduplicated

The script uses a three-tier deduplication strategy:

1. **Primary: Semantic Scholar Paper ID** - Most reliable unique identifier (~95% of citations)
2. **Secondary: DOI** - Fallback for citations without paper_id
3. **Tertiary: Normalized Title** - Last resort (lowercase, trimmed)

### Expected Results

```
Processing: ISSM_citations_citations_only.json
  Original citations: 12,722
  After deduplication: 6,010
  Duplicates removed: 6,712
  Deduplication rate: 52.8%
  ✓ Saved to: ISSM_citations_citations_only_deduplicated.json

SUMMARY
Files processed: 7
Total original citations: 20,122
Total after deduplication: 11,351
Total duplicates removed: 8,771
Overall deduplication rate: 43.6%
```

### Why Deduplication Matters

- **ISSM**: 171 team papers → 52.8% duplicates (many papers cite same foundational work)
- **EDMF**: 25 team papers → 36.9% duplicates (focused research area)
- **RAPID**: 16 team papers → 34.0% duplicates (common hydrology references)

After deduplication:
- Clean, accurate dataset representing unique citations
- Reduced file sizes (~45% smaller)
- True citation network without inflated metrics

## Step 4: Integrate into Pipeline

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

## Step 5: View in Dashboard

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
   - Ensure DOIs are included when available (DOI-based search is much more reliable)
   - Some papers may not be in Semantic Scholar/CrossRef databases
   - Check for HTML entities in titles (should be cleaned automatically by run_citation_scraper.py)

5. **High Duplication Rates**
   - Normal for models with many team papers citing foundational work
   - ISSM: 52.8% duplicates (171 team papers, interconnected research)
   - EDMF: 36.9% duplicates (focused research area)
   - Deduplication is essential for accurate metrics

6. **ECCO Timeout**
   - ECCO has 2,038 team papers (largest dataset)
   - Run separately with unlimited timeout: `nohup python3 citation_scraper.py ... &`
   - Monitor with `./monitor_ecco.sh`
   - Expected time: 2-3 hours

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
science-model-dashboard/
├── public/
│   └── data/
│       ├── cardamom_team_papers.json      # Team papers (20)
│       ├── cms_flux_team_papers.json      # (15)
│       ├── ecco_team_papers.json          # (2,038)
│       ├── edmf_team_papers.json          # (25)
│       ├── issm_team_papers.json          # (171)
│       ├── les_team_papers.json           # (21)
│       ├── momo_chem_team_papers.json     # (73)
│       └── rapid_team_papers.json         # (16)
│
├── citation_scraper/
│   ├── output/
│   │   ├── CARDAMOM_citations.json                      # Full metadata
│   │   ├── CARDAMOM_citations_citations_only.json       # Deduplicated (779 unique)
│   │   ├── CMS-Flux_citations.json
│   │   ├── CMS-Flux_citations_citations_only.json       # (962 unique)
│   │   ├── ECCO_citations.json
│   │   ├── ECCO_citations_citations_only.json           # (pending deduplication)
│   │   ├── EDMF_citations.json
│   │   ├── EDMF_citations_citations_only.json           # (1,178 unique)
│   │   ├── ISSM_citations.json
│   │   ├── ISSM_citations_citations_only.json           # (6,010 unique)
│   │   ├── LES_citations.json
│   │   ├── LES_citations_citations_only.json            # (255 unique)
│   │   ├── MOMO-CHEM_citations.json
│   │   ├── MOMO-CHEM_citations_citations_only.json      # (1,677 unique)
│   │   ├── RAPID_citations.json
│   │   └── RAPID_citations_citations_only.json          # (490 unique)
│   ├── temp/
│   │   └── *_normalized.json                            # Cleaned team papers
│   ├── citation_scraper.py                              # Core scraper
│   ├── run_citation_scraper.py                          # Batch processor
│   ├── deduplicate_citations.py                         # Deduplication script
│   ├── monitor_progress.sh                              # Progress monitor
│   ├── monitor_ecco.sh                                  # ECCO-specific monitor
│   ├── scraper.log                                      # Batch processing log
│   ├── ecco_scraper.log                                 # ECCO scraping log
│   └── DEDUPLICATION_REPORT.md                          # Deduplication stats
│
└── src/
    ├── data/
    │   ├── LES_analyzed.json          # Dashboard data (LLM-analyzed)
    │   └── EDMF_analyzed.json
    └── config/
        └── modelConfig.js             # Updated with new models

LLM_paper_analytics/
├── data/
│   ├── LES.json                       # Raw citations (for LLM input)
│   └── EDMF.json
└── results/
    ├── LES_analyzed.json              # LLM-analyzed citations
    └── EDMF_analyzed.json
```

### Key Files

- **Team Papers**: `/public/data/*_team_papers.json` - Source papers for each model
- **Raw Citations**: `citation_scraper/output/*_citations.json` - Full scraping results with metadata
- **Deduplicated Citations**: `citation_scraper/output/*_citations_citations_only.json` - Unique citations only
- **Logs**: `citation_scraper/*.log` - Processing logs for debugging
- **Reports**: `citation_scraper/DEDUPLICATION_REPORT.md` - Statistics on duplicate removal

## Example Complete Workflow

### Modern Workflow (Recommended)

```bash
# 1. Ensure team papers are in /public/data/
# Already done for: CARDAMOM, CMS-Flux, ECCO, EDMF, ISSM, LES, MOMO-CHEM, RAPID

# 2. Run batch citation scraper
cd citation_scraper
python3 run_citation_scraper.py
# This processes all models automatically (may take 1-3 hours for all 8 models)

# For very large datasets like ECCO, run separately:
nohup python3 citation_scraper.py temp/ECCO_normalized.json -o output/ECCO_citations.json --max-citations 999999 > ecco_scraper.log 2>&1 &

# Monitor progress
./monitor_ecco.sh

# 3. Deduplicate citations
python3 deduplicate_citations.py
# Removes ~44% of duplicate citations across all models

# 4. Copy to dashboard (when ready for integration)
cp output/*_citations_citations_only.json ../src/data/

# 5. Start dashboard
cd ../science-model-dashboard
npm start

# 6. View results at http://localhost:3000/science-model-dashboard/
```

### Legacy Workflow (Individual Models)

```bash
# 1. Convert team papers
cd pubclassifier
python team_papers_converter.py "team papers/LES/LES team papers.docx" LES -o LES_team_papers.json

# 2. Scrape citations (this may take 10-30 minutes depending on number of papers)
python citation_scraper.py LES_team_papers.json -o LES_citations.json --max-citations 999999

# 3. Deduplicate citations
cd ../citation_scraper
python3 deduplicate_citations.py --models LES

# 4. Integrate into pipeline (requires Ollama running)
python pipeline_integration.py LES LES_citations.json --team-papers LES_team_papers.json

# 5. Start dashboard
cd ../science-model-dashboard
npm start

# 6. View results at http://localhost:3000/science-model-dashboard/LES
```

## Current Status (November 22, 2025)

### Scraping Complete (7/8 models)

| Model | Team Papers | Citations (Deduplicated) | File Size | Status |
|-------|------------|-------------------------|-----------|--------|
| CARDAMOM | 20 | 779 | 1.6 MB | ✅ Complete |
| CMS-Flux | 15 | 962 | 2.1 MB | ✅ Complete |
| EDMF | 25 | 1,178 | 1.9 MB | ✅ Complete |
| ISSM | 171 | 6,010 | 11 MB | ✅ Complete |
| LES | 21 | 255 | 490 KB | ✅ Complete |
| MOMO-CHEM | 73 | 1,677 | 3.3 MB | ✅ Complete |
| RAPID | 16 | 490 | 798 KB | ✅ Complete |
| **Subtotal** | **341** | **11,351** | **~21 MB** | **7/8** |

### In Progress

| Model | Team Papers | Progress | Status |
|-------|------------|----------|--------|
| ECCO | 2,038 | 92.6% (1887/2038) | 🔄 ~7 min remaining |

### Deduplication Results

- **Original Citations**: 20,122
- **After Deduplication**: 11,351
- **Duplicates Removed**: 8,771 (43.6%)
- **File Size Reduction**: ~45%

**Models with Highest Duplication:**
- ISSM: 52.8% (171 team papers → many cite same foundational work)
- EDMF: 36.9% (focused research area)
- RAPID: 34.0% (common hydrology references)

See `DEDUPLICATION_REPORT.md` for detailed statistics.

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