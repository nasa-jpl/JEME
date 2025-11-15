#!/usr/bin/env python3
"""Check citation scraping progress"""

import json
import os
from pathlib import Path

def check_progress():
    files_to_check = [
        ('LES', 'LES_citations.json', 90),
        ('EDMF', 'EDMF_citations.json', 37)
    ]
    
    print("Citation Scraping Progress Check")
    print("=" * 50)
    
    for model, filename, total_papers in files_to_check:
        filepath = Path(filename)
        
        if not filepath.exists():
            print(f"\n{model}: No output file yet")
            continue
            
        try:
            with open(filepath, 'r') as f:
                data = json.load(f)
            
            if 'citations' in data:
                citations = data['citations']
                stats = data.get('scraping_metadata', {}).get('statistics', {})
                
                print(f"\n{model} Status:")
                print(f"  Output file: {filename}")
                print(f"  File size: {filepath.stat().st_size / 1024:.1f} KB")
                print(f"  Total team papers: {total_papers}")
                print(f"  Papers found: {stats.get('papers_found', 'Unknown')}")
                print(f"  Papers not found: {stats.get('papers_not_found', 'Unknown')}")
                print(f"  Total citations collected: {len(citations)}")
                
                if len(citations) > 0:
                    # Count unique citing papers per team paper
                    citing_papers = {}
                    for cite in citations:
                        team_paper = cite.get('citing_team_paper', 'Unknown')
                        if team_paper not in citing_papers:
                            citing_papers[team_paper] = 0
                        citing_papers[team_paper] += 1
                    
                    print(f"  Team papers with citations: {len(citing_papers)}")
                    if len(citing_papers) > 0:
                        avg_citations = sum(citing_papers.values()) / len(citing_papers)
                        print(f"  Average citations per paper: {avg_citations:.1f}")
        
        except json.JSONDecodeError:
            print(f"\n{model}: File exists but may be incomplete (still writing)")
        except Exception as e:
            print(f"\n{model}: Error reading file: {e}")

if __name__ == '__main__':
    check_progress()