# TROPESS Download Metrics — source data

Source files for the **Monthly Download Report** section on the TROPESS dashboard
(`/TROPESS`, rendered by `src/components/tropess/MonthlyReportSection.js`).

## Contents

- `tropess_monthly_YYYYMM.csv` — one file per month, provided by GES DISC. Each row is a
  download request with columns:
  `Product, Date, Provider, Protocol, Extension, Country, StudyArea, Users, Files, Volume (MB)`.
- `product-download-chart.xlsx` — product lookup table (sheet **"Product Name Lookup Table"**)
  mapping each product code to its Long Name, trace-gas Species, Instrument, and DOI. Used to
  classify each download by species / processing stream / megacity.

## Monthly update procedure

1. Drop the new month's CSV from GES DISC into this folder, keeping the
   `tropess_monthly_YYYYMM.csv` naming convention.
2. From the repo root, regenerate the dashboard data:
   ```bash
   python scripts/build_tropess_downloads.py
   ```
   This rewrites `public/data/TROPESS_downloads.json` and prints a summary
   (months included, totals, and any product codes it could not map).
3. Commit the updated CSV and the regenerated JSON. The dashboard picks up the
   new month automatically.

## Notes

- If a new product code is not in the lookup table, the script attempts to decode it from the
  code itself (species token + `FS` = Forward stream, `MG<city>` = megacity). Codes it still
  cannot classify are logged and bucketed as species `Unknown` / stream `Special` so totals
  are never silently dropped — add them to the lookup xlsx when that happens.
- The authoritative `tropess-product-specification-2.9.2.xlsx` from the JPL stats notebook is a
  Git-LFS pointer and is intentionally not used here; `product-download-chart.xlsx` plus the
  fallback decoder covers all current products.
