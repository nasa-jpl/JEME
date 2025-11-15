#!/usr/bin/env python3
"""Test CrossRef API directly"""

import requests
import time
import json

def test_crossref():
    # Test a known DOI
    doi = "10.1175/2010MWR3142.1"
    url = f"https://api.crossref.org/works/{doi}"
    
    print(f"Testing CrossRef API with DOI: {doi}")
    
    try:
        response = requests.get(url, timeout=10)
        response.raise_for_status()
        
        data = response.json()
        work = data.get('message', {})
        
        title = work.get('title', [''])[0] if work.get('title') else ''
        authors = []
        if work.get('author'):
            for author in work['author']:
                given = author.get('given', '')
                family = author.get('family', '')
                if given and family:
                    authors.append(f"{given} {family}")
                elif family:
                    authors.append(family)
        
        year = None
        if work.get('published-print', {}).get('date-parts'):
            year = work['published-print']['date-parts'][0][0]
        elif work.get('published-online', {}).get('date-parts'):
            year = work['published-online']['date-parts'][0][0]
        
        print(f"SUCCESS!")
        print(f"Title: {title}")
        print(f"Authors: {authors}")
        print(f"Year: {year}")
        print(f"Citation count: {work.get('is-referenced-by-count')}")
        
        return True
        
    except Exception as e:
        print(f"ERROR: {e}")
        return False

def test_semantic_scholar():
    # Test Semantic Scholar
    paper_id = "204e3077c8ab8e7e18f5cbb9c8a36d8e20b0e65a"  # A known paper ID
    url = f"https://api.semanticscholar.org/graph/v1/paper/{paper_id}/citations"
    params = {
        'offset': 0,
        'limit': 10,
        'fields': 'title,authors,year,venue,citationCount'
    }
    
    print(f"\nTesting Semantic Scholar API...")
    
    try:
        response = requests.get(url, params=params, timeout=10)
        response.raise_for_status()
        
        data = response.json()
        citations = data.get('data', [])
        
        print(f"SUCCESS! Found {len(citations)} citations")
        
        if citations:
            first_citation = citations[0].get('citingPaper', {})
            print(f"Sample citation: {first_citation.get('title', 'Unknown')}")
        
        return True
        
    except Exception as e:
        print(f"ERROR: {e}")
        return False

if __name__ == '__main__':
    print("=== API Testing ===")
    
    crossref_works = test_crossref()
    semantic_works = test_semantic_scholar()
    
    if crossref_works:
        print("\n✓ CrossRef API is working")
    else:
        print("\n✗ CrossRef API failed")
        
    if semantic_works:
        print("✓ Semantic Scholar API is working")
    else:
        print("✗ Semantic Scholar API failed - this explains the citation scraping issues")