#!/usr/bin/env python3
"""
Wrapper script to run citation scraper on all team papers files
Handles different JSON formats and normalizes data
"""

import json
import subprocess
import os
from pathlib import Path

def normalize_team_papers(input_file: str, output_file: str) -> bool:
    """
    Normalize team papers JSON to format expected by citation scraper
    Returns True if successful
    """
    try:
        import html
        import re

        with open(input_file, 'r', encoding='utf-8') as f:
            data = json.load(f)

        papers = []

        # Handle different formats
        if isinstance(data, list):
            papers = data
        elif isinstance(data, dict):
            # Try to find papers in various keys
            for key in data.keys():
                if isinstance(data[key], list):
                    papers = data[key]
                    break
            if not papers and 'papers' in data:
                papers = data['papers']

        if not papers:
            print(f"  ⚠ Warning: No papers found in {input_file}")
            return False

        # Normalize each paper
        normalized_papers = []
        for paper in papers:
            # Clean title - remove HTML entities and tags
            title = paper.get('title', '')
            title = html.unescape(title)  # Convert &amp; to &, etc
            title = re.sub(r'<[^>]+>', '', title)  # Remove HTML tags like <sub>, </sub>

            normalized = {
                'title': title,
                'authors': paper.get('authors', []),
                'year': paper.get('year'),
                'doi': paper.get('doi', ''),
                'venue': paper.get('venue') or paper.get('journal', ''),
            }

            # Handle authors as string (convert to list)
            if isinstance(normalized['authors'], str):
                # Simple split by comma or 'and'
                authors_str = normalized['authors']
                authors_str = authors_str.replace(' and ', ', ')
                normalized['authors'] = [a.strip() for a in authors_str.split(',')]

            normalized_papers.append(normalized)

        # Save normalized format
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(normalized_papers, f, indent=2, ensure_ascii=False)

        print(f"  ✓ Normalized {len(normalized_papers)} papers")
        return True

    except Exception as e:
        print(f"  ✗ Error normalizing {input_file}: {e}")
        return False

def main():
    # Setup directories
    script_dir = Path(__file__).parent
    team_papers_dir = Path("/home/ks/science-model-dashboard/public/data")
    output_dir = script_dir / "output"
    temp_dir = script_dir / "temp"
    scraper_script = script_dir / "citation_scraper.py"

    # Create directories
    output_dir.mkdir(exist_ok=True)
    temp_dir.mkdir(exist_ok=True)

    # Define models and their team papers files
    models = {
        "CARDAMOM": "cardamom_team_papers.json",
        "CMS-Flux": "cms_flux_team_papers.json",
        "ECCO": "ecco_team_papers.json",
        "ISSM": "issm_team_papers.json",
        "MOMO-CHEM": "momo_chem_team_papers.json",
        "RAPID": "rapid_team_papers.json",
        "LES": "LES_team_papers.json",
        "EDMF": "EDMF_team_papers.json"
    }

    print("\n" + "="*50)
    print("Citation Scraper Batch Processing")
    print("="*50 + "\n")

    for model_name, filename in models.items():
        input_file = team_papers_dir / filename
        temp_file = temp_dir / f"{model_name}_normalized.json"
        output_file = output_dir / f"{model_name}_citations.json"

        print(f"Processing: {model_name}")
        print(f"  Input:  {input_file}")
        print(f"  Output: {output_file}")

        # Check if input exists
        if not input_file.exists():
            print(f"  ⚠ Warning: Input file not found, skipping...\n")
            continue

        # Normalize the team papers format
        if not normalize_team_papers(str(input_file), str(temp_file)):
            print(f"  ✗ Failed to normalize, skipping...\n")
            continue

        # Run citation scraper (no limit on citations per paper)
        print(f"  Running citation scraper...")
        try:
            result = subprocess.run(
                [
                    "python3",
                    str(scraper_script),
                    str(temp_file),
                    "-o", str(output_file),
                    "--max-citations", "999999"  # Effectively unlimited
                ],
                capture_output=True,
                text=True,
                timeout=7200  # 2 hour timeout per model
            )

            if result.returncode == 0:
                print(f"  ✓ Successfully processed {model_name}")
            else:
                print(f"  ✗ Failed to process {model_name}")
                print(f"  Error: {result.stderr}")

        except subprocess.TimeoutExpired:
            print(f"  ✗ Timeout processing {model_name}")
        except Exception as e:
            print(f"  ✗ Error running scraper: {e}")

        print("\n" + "-"*50 + "\n")

        # Delay between models to avoid rate limiting
        import time
        time.sleep(10)

    print("="*50)
    print("Batch processing complete!")
    print("="*50)
    print(f"\nOutput files saved to: {output_dir}")
    print("\nNext steps:")
    print("1. Review the citation data in output directory")
    print("2. Copy *_citations_only.json files to dashboard data directory")
    print("3. Run LLM analysis on the citation data if needed")

if __name__ == '__main__':
    main()
