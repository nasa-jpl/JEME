# Citation Scraping Status Report

**Date:** November 22, 2025
**Tool:** citation_scraper.py with DOI-based search
**API:** Semantic Scholar + CrossRef fallback

---

## Overall Summary

- **Total Models:** 8
- **Completed:** 7 models ✅
- **In Progress:** 1 model (ECCO) 🔄
- **Total Citations Collected:** 20,122+ (and counting)

---

## Completed Models ✅

| Model | Team Papers | Citations | File Size | Status |
|-------|------------|-----------|-----------|--------|
| **CARDAMOM** | 20 | 896 | 2.0 MB | ✅ Complete |
| **CMS-Flux** | 15 | 1,187 | 2.7 MB | ✅ Complete |
| **ISSM** | 171 | 12,722 | 24 MB | ✅ Complete |
| **MOMO-CHEM** | 73 | 2,410 | 5.2 MB | ✅ Complete |
| **RAPID** | 16 | 742 | 1.3 MB | ✅ Complete |
| **LES** | 21 | 297 | 580 KB | ✅ Complete |
| **EDMF** | 25 | 1,868 | 3.2 MB | ✅ Complete |

**Subtotal:** 341 team papers → 20,122 citations

---

## In Progress 🔄

### ECCO
- **Team Papers:** 2,038 (largest dataset)
- **Current Progress:** Paper 38/2,038 (1.9%)
- **Status:** Running in background (unlimited timeout)
- **Estimated Time:** ~2-3 hours to completion
- **Log File:** `citation_scraper/ecco_scraper.log`
- **Monitor:** `./monitor_ecco.sh` or `watch -n 60 ./monitor_ecco.sh`

---

## Output Files

All citation files are located in:
```
/home/ks/science-model-dashboard/citation_scraper/output/
```

Each model has two output files:

### 1. Full Metadata Files
- `{MODEL}_citations.json` - Complete scraping results with metadata

### 2. Citations-Only Files (Ready for LLM Analysis)
- `{MODEL}_citations_citations_only.json` - Array of citations only

**File Naming:**
- CARDAMOM_citations_citations_only.json
- CMS-Flux_citations_citations_only.json
- EDMF_citations_citations_only.json
- ISSM_citations_citations_only.json
- LES_citations_citations_only.json
- MOMO-CHEM_citations_citations_only.json
- RAPID_citations_citations_only.json
- ECCO_citations_citations_only.json (in progress)

---

## Technical Details

### DOI-Based Search (Primary Method)
- Uses Semantic Scholar API with DOI lookup
- Much more reliable than title-based search
- Handles Unicode characters correctly
- Success rate: ~95%+

### Rate Limiting
- 2-3 second delay between API calls
- Exponential backoff on rate limit errors
- Automatic retry logic (5 attempts)

### Data Format
Each citation includes:
- Title, authors, year
- DOI (when available)
- Venue/journal
- Citation count
- Paper ID (Semantic Scholar)
- URL, abstract (when available)

---

## Monitoring Commands

### Check All Models
```bash
./monitor_progress.sh
```

### Monitor ECCO Specifically
```bash
./monitor_ecco.sh

# Or watch continuously (updates every 60 seconds)
watch -n 60 ./monitor_ecco.sh
```

### Check ECCO Log
```bash
tail -f ecco_scraper.log
```

---

## Next Steps

### 1. Wait for ECCO to Complete
ECCO is the largest dataset (2,038 papers) and will take 2-3 hours.

### 2. Copy Citation Files to Dashboard
Once ECCO completes:
```bash
cp output/*_citations_only.json ../src/data/
```

### 3. Optional: Run LLM Analysis
Use the citations_only.json files as input to:
- Categorize papers by research domain
- Classify engagement levels
- Extract geographic information
- Generate analytics

---

## Success Metrics

✅ **DOI-based search fixed the Unicode title issue**
✅ **All 7 smaller models completed successfully**
✅ **20,122 citations collected so far**
✅ **ECCO processing without timeout limit**
✅ **Clean, structured output ready for analysis**

---

## Files Generated

```
citation_scraper/
├── output/
│   ├── CARDAMOM_citations.json (2.0M)
│   ├── CARDAMOM_citations_citations_only.json (1.9M)
│   ├── CMS-Flux_citations.json (2.7M)
│   ├── CMS-Flux_citations_citations_only.json (2.6M)
│   ├── EDMF_citations.json (3.2M)
│   ├── EDMF_citations_citations_only.json (3.1M)
│   ├── ISSM_citations.json (24M)
│   ├── ISSM_citations_citations_only.json (23M)
│   ├── LES_citations.json (580K)
│   ├── LES_citations_citations_only.json (564K)
│   ├── MOMO-CHEM_citations.json (5.2M)
│   ├── MOMO-CHEM_citations_citations_only.json (5.0M)
│   ├── RAPID_citations.json (1.3M)
│   ├── RAPID_citations_citations_only.json (1.2M)
│   └── ECCO_citations*.json (in progress)
├── temp/
│   └── *_normalized.json (cleaned team papers)
├── ecco_scraper.log (ECCO processing log)
├── scraper.log (batch processing log)
├── monitor_progress.sh (all models monitor)
└── monitor_ecco.sh (ECCO-specific monitor)
```

---

**Last Updated:** 2025-11-22 21:11:00
**ECCO Status:** Processing (1.9% complete)
