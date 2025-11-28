#!/usr/bin/env python3
"""
Citation Scraper for Team Papers
Collects citations for team papers using multiple academic APIs
Supports Semantic Scholar, CrossRef, and Google Scholar (via scholarly)
"""

import json
import time
import requests
import logging
from typing import List, Dict, Optional, Set
from pathlib import Path
from dataclasses import dataclass
import re
from urllib.parse import quote

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

@dataclass
class Paper:
    """Represents a paper with citation information"""
    title: str
    authors: List[str]
    year: Optional[int] = None
    doi: Optional[str] = None
    venue: Optional[str] = None
    citation_count: Optional[int] = None
    paper_id: Optional[str] = None
    url: Optional[str] = None
    abstract: Optional[str] = None

class SemanticScholarAPI:
    """Semantic Scholar API client"""

    def __init__(self):
        self.base_url = "https://api.semanticscholar.org/graph/v1"
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'CitationScraper/1.0 (research@nasa.gov)'
        })

    def search_paper_by_doi(self, doi: str) -> Optional[Paper]:
        """Search for a paper by DOI (most reliable method)"""
        try:
            # Clean DOI
            doi = doi.strip()
            if doi.startswith('http'):
                doi = doi.split('doi.org/')[-1]

            url = f"{self.base_url}/paper/DOI:{doi}"
            params = {
                'fields': 'title,authors,year,venue,citationCount,paperId,url,abstract,externalIds'
            }

            # Retry logic for rate limiting
            for retry in range(5):
                response = self.session.get(url, params=params, timeout=15)
                if response.status_code == 429:  # Rate limited
                    wait_time = (retry + 1) * 5
                    logger.warning(f"Rate limited. Waiting {wait_time} seconds...")
                    time.sleep(wait_time)
                    continue
                elif response.status_code == 404:
                    logger.warning(f"Paper not found for DOI: {doi}")
                    return None
                response.raise_for_status()
                break

            data = response.json()
            return self._parse_paper(data)

        except Exception as e:
            logger.error(f"Error searching DOI {doi}: {e}")
            return None

    def search_paper(self, title: str, authors: List[str] = None) -> Optional[Paper]:
        """Search for a paper by title and authors"""
        try:
            # Clean title for search
            clean_title = re.sub(r'[^\w\s-]', ' ', title).strip()
            search_query = quote(clean_title)
            
            url = f"{self.base_url}/paper/search"
            params = {
                'query': search_query,
                'limit': 5,
                'fields': 'title,authors,year,venue,citationCount,paperId,url,abstract,externalIds'
            }
            
            # Retry logic for rate limiting
            for retry in range(5):
                response = self.session.get(url, params=params, timeout=15)
                if response.status_code == 429:  # Rate limited
                    wait_time = (retry + 1) * 5  # Exponential backoff
                    logger.warning(f"Rate limited. Waiting {wait_time} seconds...")
                    time.sleep(wait_time)
                    continue
                response.raise_for_status()
                break
            
            data = response.json()
            papers = data.get('data', [])
            
            # Find best match
            for paper_data in papers:
                if self._is_title_match(title, paper_data.get('title', '')):
                    return self._parse_paper(paper_data)
                    
            return None
            
        except Exception as e:
            logger.error(f"Error searching for paper '{title}': {e}")
            return None
    
    def get_citations(self, paper_id: str, limit: int = 1000) -> List[Paper]:
        """Get citations for a paper by its Semantic Scholar ID"""
        try:
            citations = []
            offset = 0
            batch_size = 100
            
            while len(citations) < limit:
                url = f"{self.base_url}/paper/{paper_id}/citations"
                params = {
                    'offset': offset,
                    'limit': min(batch_size, limit - len(citations)),
                    'fields': 'title,authors,year,venue,citationCount,paperId,url,abstract,externalIds'
                }
                
                # Retry logic for rate limiting on citation fetching
                for retry in range(5):
                    response = self.session.get(url, params=params, timeout=20)
                    if response.status_code == 429:  # Rate limited
                        wait_time = (retry + 1) * 10  # Longer wait for citations
                        logger.warning(f"Rate limited on citations. Waiting {wait_time} seconds...")
                        time.sleep(wait_time)
                        continue
                    response.raise_for_status()
                    break
                
                data = response.json()
                batch_citations = data.get('data', [])
                
                if not batch_citations:
                    break
                    
                for citation_data in batch_citations:
                    citing_paper = citation_data.get('citingPaper', {})
                    if citing_paper:
                        paper = self._parse_paper(citing_paper)
                        if paper:
                            citations.append(paper)
                
                offset += batch_size
                time.sleep(2.0)  # Increased rate limiting to avoid 429 errors
                
            logger.info(f"Found {len(citations)} citations for paper {paper_id}")
            return citations
            
        except Exception as e:
            logger.error(f"Error getting citations for paper {paper_id}: {e}")
            return []
    
    def _parse_paper(self, paper_data: Dict) -> Optional[Paper]:
        """Parse paper data from API response"""
        try:
            authors = []
            if paper_data.get('authors'):
                authors = [author.get('name', '') for author in paper_data['authors'] if author.get('name')]
            
            # Extract DOI
            doi = None
            external_ids = paper_data.get('externalIds', {})
            if external_ids:
                doi = external_ids.get('DOI')
            
            return Paper(
                title=paper_data.get('title', ''),
                authors=authors,
                year=paper_data.get('year'),
                doi=doi,
                venue=paper_data.get('venue'),
                citation_count=paper_data.get('citationCount'),
                paper_id=paper_data.get('paperId'),
                url=paper_data.get('url'),
                abstract=paper_data.get('abstract')
            )
        except Exception as e:
            logger.error(f"Error parsing paper data: {e}")
            return None
    
    def _is_title_match(self, search_title: str, result_title: str) -> bool:
        """Check if titles match (fuzzy matching)"""
        search_clean = re.sub(r'[^\w\s]', '', search_title.lower()).strip()
        result_clean = re.sub(r'[^\w\s]', '', result_title.lower()).strip()
        
        # Check if 80% of words match
        search_words = set(search_clean.split())
        result_words = set(result_clean.split())
        
        if not search_words or not result_words:
            return False
            
        intersection = search_words.intersection(result_words)
        return len(intersection) / len(search_words) > 0.8

class CrossRefAPI:
    """CrossRef API client for DOI-based searches"""
    
    def __init__(self):
        self.base_url = "https://api.crossref.org"
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'CitationScraper/1.0 (research@nasa.gov)'
        })
    
    def search_paper_by_doi(self, doi: str) -> Optional[Paper]:
        """Search for paper by DOI"""
        try:
            url = f"{self.base_url}/works/{doi}"
            response = self.session.get(url, timeout=10)
            response.raise_for_status()
            
            data = response.json()
            work = data.get('message', {})
            
            return self._parse_crossref_paper(work)
            
        except Exception as e:
            logger.error(f"Error searching DOI {doi}: {e}")
            return None
    
    def search_paper_by_title(self, title: str) -> Optional[Paper]:
        """Search for paper by title"""
        try:
            url = f"{self.base_url}/works"
            params = {
                'query.title': title,
                'rows': 5
            }
            
            # Retry logic for rate limiting
            for retry in range(5):
                response = self.session.get(url, params=params, timeout=15)
                if response.status_code == 429:  # Rate limited
                    wait_time = (retry + 1) * 5  # Exponential backoff
                    logger.warning(f"Rate limited. Waiting {wait_time} seconds...")
                    time.sleep(wait_time)
                    continue
                response.raise_for_status()
                break
            
            data = response.json()
            works = data.get('message', {}).get('items', [])
            
            for work in works:
                if self._is_title_match_crossref(title, work):
                    return self._parse_crossref_paper(work)
            
            return None
            
        except Exception as e:
            logger.error(f"Error searching title '{title}': {e}")
            return None
    
    def _parse_crossref_paper(self, work: Dict) -> Optional[Paper]:
        """Parse CrossRef work data"""
        try:
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
            
            venue = work.get('container-title', [''])[0] if work.get('container-title') else None
            
            return Paper(
                title=title,
                authors=authors,
                year=year,
                doi=work.get('DOI'),
                venue=venue,
                citation_count=work.get('is-referenced-by-count'),
                url=work.get('URL')
            )
            
        except Exception as e:
            logger.error(f"Error parsing CrossRef work: {e}")
            return None
    
    def _is_title_match_crossref(self, search_title: str, work: Dict) -> bool:
        """Check title match for CrossRef results"""
        work_title = work.get('title', [''])[0] if work.get('title') else ''
        return self._fuzzy_title_match(search_title, work_title)
    
    def _fuzzy_title_match(self, title1: str, title2: str) -> bool:
        """Fuzzy title matching"""
        clean1 = re.sub(r'[^\w\s]', '', title1.lower()).strip()
        clean2 = re.sub(r'[^\w\s]', '', title2.lower()).strip()
        
        words1 = set(clean1.split())
        words2 = set(clean2.split())
        
        if not words1 or not words2:
            return False
        
        intersection = words1.intersection(words2)
        return len(intersection) / min(len(words1), len(words2)) > 0.8

class CitationScraper:
    """Main citation scraper class"""
    
    def __init__(self):
        self.semantic_scholar = SemanticScholarAPI()
        self.crossref = CrossRefAPI()
        self.scraped_paper_ids: Set[str] = set()
    
    def scrape_citations_for_team_papers(self, team_papers_file: str, output_file: str, 
                                       max_citations_per_paper: int = 1000) -> Dict:
        """
        Main method to scrape citations for team papers
        
        Args:
            team_papers_file: JSON file with team papers
            output_file: Output JSON file for citations
            max_citations_per_paper: Maximum citations to collect per paper
            
        Returns:
            Dictionary with scraping results
        """
        logger.info(f"Starting citation scraping for {team_papers_file}")
        
        # Load team papers
        team_papers = self._load_team_papers(team_papers_file)
        if not team_papers:
            logger.error(f"No team papers found in {team_papers_file}")
            return {}
        
        all_citations = []
        scraping_stats = {
            'total_team_papers': len(team_papers),
            'papers_found': 0,
            'papers_not_found': 0,
            'total_citations': 0,
            'failed_papers': []
        }
        
        for i, team_paper in enumerate(team_papers):
            logger.info(f"Processing paper {i+1}/{len(team_papers)}: {team_paper.get('title', 'Unknown')}")
            
            # Find the paper in academic databases
            found_paper = self._find_paper(team_paper)
            
            if found_paper and found_paper.paper_id:
                scraping_stats['papers_found'] += 1
                logger.info(f"Found paper with ID: {found_paper.paper_id}")
                
                # Get citations
                citations = self.semantic_scholar.get_citations(
                    found_paper.paper_id, 
                    limit=max_citations_per_paper
                )
                
                # Convert to JSON format compatible with existing pipeline
                for citation in citations:
                    citation_dict = self._paper_to_dict(citation)
                    citation_dict['citing_team_paper'] = team_paper.get('title', '')
                    citation_dict['team_paper_id'] = found_paper.paper_id
                    all_citations.append(citation_dict)
                
                scraping_stats['total_citations'] += len(citations)
                logger.info(f"Collected {len(citations)} citations")
                
            else:
                scraping_stats['papers_not_found'] += 1
                scraping_stats['failed_papers'].append(team_paper.get('title', 'Unknown'))
                logger.warning(f"Could not find paper: {team_paper.get('title', 'Unknown')}")
            
            # Rate limiting between papers
            time.sleep(3)
        
        # Save results
        self._save_citations(all_citations, output_file, scraping_stats)
        
        logger.info(f"Scraping complete. Found {scraping_stats['total_citations']} total citations")
        logger.info(f"Results saved to {output_file}")
        
        return scraping_stats
    
    def _load_team_papers(self, file_path: str) -> List[Dict]:
        """Load team papers from JSON file"""
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            if isinstance(data, list):
                return data
            elif isinstance(data, dict) and 'papers' in data:
                return data['papers']
            else:
                logger.error("Invalid team papers file format")
                return []
                
        except Exception as e:
            logger.error(f"Error loading team papers file: {e}")
            return []
    
    def _find_paper(self, team_paper: Dict) -> Optional[Paper]:
        """Find a team paper in academic databases"""
        title = team_paper.get('title', '')
        authors = team_paper.get('authors', [])
        doi = team_paper.get('doi', '')

        if not title and not doi:
            return None

        # Try DOI-based search first (most reliable)
        if doi:
            # Try Semantic Scholar with DOI
            found_paper = self.semantic_scholar.search_paper_by_doi(doi)
            if found_paper and found_paper.paper_id:
                logger.info(f"Found paper via Semantic Scholar DOI: {doi}")
                return found_paper

            # Try CrossRef with DOI as fallback
            found_paper = self.crossref.search_paper_by_doi(doi)
            if found_paper:
                logger.info(f"Found paper via CrossRef DOI: {doi}")
                return found_paper

        # Fall back to title-based search if DOI fails
        found_paper = self.semantic_scholar.search_paper(title, authors)
        if found_paper and found_paper.paper_id:
            logger.info(f"Found paper via Semantic Scholar title search")
            return found_paper

        # Try CrossRef by title as last resort
        found_paper = self.crossref.search_paper_by_title(title)
        if found_paper:
            logger.info(f"Found paper via CrossRef title search")
        return found_paper
    
    def _paper_to_dict(self, paper: Paper) -> Dict:
        """Convert Paper object to dictionary for JSON serialization"""
        return {
            'title': paper.title,
            'authors': paper.authors,
            'year': paper.year,
            'doi': paper.doi,
            'venue': paper.venue,
            'citation_count': paper.citation_count,
            'paper_id': paper.paper_id,
            'url': paper.url,
            'abstract': paper.abstract,
            'indexed': {
                'date-parts': [[2025, 11, 11]] if not paper.year else [[paper.year, 1, 1]]
            }
        }
    
    def _save_citations(self, citations: List[Dict], output_file: str, stats: Dict):
        """Save citations and statistics"""
        try:
            output_data = {
                'scraping_metadata': {
                    'scraping_date': '2025-11-11',
                    'tool': 'citation_scraper.py',
                    'statistics': stats
                },
                'citations': citations
            }
            
            with open(output_file, 'w', encoding='utf-8') as f:
                json.dump(output_data, f, indent=2, ensure_ascii=False)
                
            # Also save just the citations in the format expected by LLM analytics
            citations_only_file = output_file.replace('.json', '_citations_only.json')
            with open(citations_only_file, 'w', encoding='utf-8') as f:
                json.dump(citations, f, indent=2, ensure_ascii=False)
                
            logger.info(f"Saved {len(citations)} citations to {output_file}")
            logger.info(f"Citations-only file saved to {citations_only_file}")
            
        except Exception as e:
            logger.error(f"Error saving citations: {e}")

def main():
    """Command-line interface"""
    import argparse
    
    parser = argparse.ArgumentParser(description='Scrape citations for team papers')
    parser.add_argument('team_papers', help='JSON file with team papers')
    parser.add_argument('-o', '--output', required=True, help='Output file for citations')
    parser.add_argument('--max-citations', type=int, default=1000, 
                       help='Maximum citations per paper (default: 1000)')
    parser.add_argument('--verbose', action='store_true', help='Verbose logging')
    
    args = parser.parse_args()
    
    if args.verbose:
        logging.getLogger().setLevel(logging.DEBUG)
    
    scraper = CitationScraper()
    stats = scraper.scrape_citations_for_team_papers(
        args.team_papers, 
        args.output, 
        args.max_citations
    )
    
    print(f"\nScraping Statistics:")
    print(f"Team papers processed: {stats.get('total_team_papers', 0)}")
    print(f"Papers found: {stats.get('papers_found', 0)}")
    print(f"Papers not found: {stats.get('papers_not_found', 0)}")
    print(f"Total citations collected: {stats.get('total_citations', 0)}")
    
    if stats.get('failed_papers'):
        print(f"\nFailed papers:")
        for paper in stats['failed_papers']:
            print(f"  - {paper}")

if __name__ == '__main__':
    main()