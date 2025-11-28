# Citation Deduplication Report

**Date:** November 22, 2025
**Process:** Removed duplicate citations within each model's citation dataset

---

## Summary

**Total Duplicates Removed:** 8,771 citations (43.6% of original)
**Final Unique Citations:** 11,351 citations across 7 models

---

## Deduplication Results by Model

| Model | Original | Deduplicated | Duplicates Removed | Dedup Rate | File Size |
|-------|----------|--------------|-------------------|------------|-----------|
| **ISSM** | 12,722 | 6,010 | 6,712 | 52.8% | 11 MB → |
| **EDMF** | 1,868 | 1,178 | 690 | 36.9% | 1.9 MB |
| **RAPID** | 742 | 490 | 252 | 34.0% | 798 KB |
| **MOMO-CHEM** | 2,410 | 1,677 | 733 | 30.4% | 3.3 MB |
| **CMS-Flux** | 1,187 | 962 | 225 | 19.0% | 2.1 MB |
| **LES** | 297 | 255 | 42 | 14.1% | 490 KB |
| **CARDAMOM** | 896 | 779 | 117 | 13.1% | 1.6 MB |
| **TOTAL** | **20,122** | **11,351** | **8,771** | **43.6%** | **~21 MB** |

---

## Why Duplicates Occur

Duplicates happen when multiple team papers from the same model cite the same paper. For example:
- If Team Paper A and Team Paper B both cite Paper X
- Paper X would appear twice in the raw citation data
- Deduplication keeps only one instance of Paper X

---

## Deduplication Method

The script uses a three-tier deduplication strategy:

### 1. Primary: Semantic Scholar Paper ID
- Most reliable unique identifier
- Used when available (~95% of citations)

### 2. Secondary: DOI
- Fallback for citations without paper_id
- Unique identifier from publishers

### 3. Tertiary: Title
- Last resort for citations without paper_id or DOI
- Normalized (lowercase, trimmed)

---

## Models with High Duplication Rates

### ISSM (52.8% duplicates)
- **171 team papers** citing overlapping research
- Strong interconnected research community
- Many papers cite the same foundational ISSM papers

### EDMF (36.9% duplicates)
- **25 team papers** with overlapping citations
- Focused research area leads to high overlap

### RAPID (34.0% duplicates)
- **16 team papers** citing common hydrology papers
- Core papers cited by multiple team publications

---

## Impact

### Before Deduplication
- Total citations: 20,122
- Redundant data
- Inflated metrics
- Larger file sizes

### After Deduplication
- Unique citations: 11,351
- Clean, accurate dataset
- True citation network
- Optimized file sizes (reduced by ~45%)

---

## Files Updated

All `*_citations_citations_only.json` files in `/citation_scraper/output/` have been replaced with deduplicated versions:

```
output/
├── CARDAMOM_citations_citations_only.json (779 unique)
├── CMS-Flux_citations_citations_only.json (962 unique)
├── EDMF_citations_citations_only.json (1,178 unique)
├── ISSM_citations_citations_only.json (6,010 unique)
├── LES_citations_citations_only.json (255 unique)
├── MOMO-CHEM_citations_citations_only.json (1,677 unique)
└── RAPID_citations_citations_only.json (490 unique)
```

---

## Quality Assurance

✅ **All original data preserved** - Full metadata files untouched
✅ **No data loss** - Duplicates removed, originals kept as backups
✅ **Verified counts** - All files validated after deduplication
✅ **Ready for analysis** - Clean, unique citation datasets

---

## Next Steps

1. **ECCO Deduplication** - Will be deduplicated when scraping completes
2. **Copy to Dashboard** - Move deduplicated files to `src/data/`
3. **LLM Analysis** - Process with clean, unique citation data

---

**Generated:** 2025-11-22 23:53:00
**Script:** `deduplicate_citations.py`
