#!/usr/bin/env python3
"""
Remove duplicate citations from citation files
Uses paper_id (Semantic Scholar ID) as primary deduplication key
Falls back to DOI, then title for citations without paper_id
"""

import json
import sys
from pathlib import Path
from typing import List, Dict

def deduplicate_citations(citations: List[Dict]) -> tuple[List[Dict], Dict]:
    """
    Remove duplicate citations based on paper_id, DOI, or title
    Returns: (deduplicated_list, stats_dict)
    """
    seen_ids = set()
    seen_dois = set()
    seen_titles = set()

    deduplicated = []
    duplicates_found = 0

    for citation in citations:
        paper_id = citation.get('paper_id')
        doi = citation.get('doi')
        title = citation.get('title', '').lower().strip()

        # Check uniqueness using paper_id first (most reliable)
        if paper_id:
            if paper_id in seen_ids:
                duplicates_found += 1
                continue
            seen_ids.add(paper_id)
            deduplicated.append(citation)
            continue

        # Fall back to DOI if no paper_id
        if doi:
            if doi in seen_dois:
                duplicates_found += 1
                continue
            seen_dois.add(doi)
            deduplicated.append(citation)
            continue

        # Fall back to title if no paper_id or DOI
        if title:
            if title in seen_titles:
                duplicates_found += 1
                continue
            seen_titles.add(title)
            deduplicated.append(citation)
            continue

        # Keep citations with no identifying information (rare)
        deduplicated.append(citation)

    stats = {
        'original_count': len(citations),
        'deduplicated_count': len(deduplicated),
        'duplicates_removed': duplicates_found,
        'unique_paper_ids': len(seen_ids),
        'unique_dois': len(seen_dois),
        'unique_titles': len(seen_titles)
    }

    return deduplicated, stats

def process_citation_file(input_file: Path, output_file: Path = None) -> Dict:
    """Process a single citation file"""
    if output_file is None:
        output_file = input_file.parent / f"{input_file.stem}_deduplicated{input_file.suffix}"

    print(f"Processing: {input_file.name}")

    # Load citations
    try:
        with open(input_file, 'r', encoding='utf-8') as f:
            citations = json.load(f)
    except json.JSONDecodeError as e:
        print(f"  ✗ Error reading JSON: {e}")
        return None

    if not isinstance(citations, list):
        print(f"  ✗ Expected a list of citations, got {type(citations)}")
        return None

    original_count = len(citations)
    print(f"  Original citations: {original_count:,}")

    # Deduplicate
    deduplicated, stats = deduplicate_citations(citations)

    print(f"  After deduplication: {stats['deduplicated_count']:,}")
    print(f"  Duplicates removed: {stats['duplicates_removed']:,}")
    print(f"  Deduplication rate: {(stats['duplicates_removed']/original_count*100):.1f}%")

    # Save deduplicated version
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(deduplicated, f, indent=2, ensure_ascii=False)

    print(f"  ✓ Saved to: {output_file.name}")
    print()

    return stats

def main():
    import argparse

    parser = argparse.ArgumentParser(description='Deduplicate citation files')
    parser.add_argument('--input-dir', default='output',
                       help='Directory containing citation files')
    parser.add_argument('--in-place', action='store_true',
                       help='Overwrite original files instead of creating new ones')
    parser.add_argument('--models', nargs='*',
                       help='Specific models to process (default: all)')

    args = parser.parse_args()

    input_dir = Path(args.input_dir)
    if not input_dir.exists():
        print(f"Error: Directory {input_dir} not found")
        return 1

    # Find all citation files
    pattern = '*_citations_citations_only.json'
    citation_files = sorted(input_dir.glob(pattern))

    if args.models:
        # Filter by specified models
        citation_files = [f for f in citation_files
                         if any(model.upper() in f.stem.upper() for model in args.models)]

    if not citation_files:
        print(f"No citation files found in {input_dir}")
        return 1

    print(f"Found {len(citation_files)} citation file(s) to process")
    print("=" * 60)
    print()

    total_stats = {
        'files_processed': 0,
        'total_original': 0,
        'total_deduplicated': 0,
        'total_duplicates_removed': 0
    }

    for input_file in citation_files:
        output_file = input_file if args.in_place else None
        stats = process_citation_file(input_file, output_file)

        if stats:
            total_stats['files_processed'] += 1
            total_stats['total_original'] += stats['original_count']
            total_stats['total_deduplicated'] += stats['deduplicated_count']
            total_stats['total_duplicates_removed'] += stats['duplicates_removed']

    print("=" * 60)
    print("SUMMARY")
    print("=" * 60)
    print(f"Files processed: {total_stats['files_processed']}")
    print(f"Total original citations: {total_stats['total_original']:,}")
    print(f"Total after deduplication: {total_stats['total_deduplicated']:,}")
    print(f"Total duplicates removed: {total_stats['total_duplicates_removed']:,}")
    if total_stats['total_original'] > 0:
        pct = (total_stats['total_duplicates_removed'] / total_stats['total_original'] * 100)
        print(f"Overall deduplication rate: {pct:.1f}%")

    return 0

if __name__ == '__main__':
    sys.exit(main())
