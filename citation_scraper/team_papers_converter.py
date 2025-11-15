#!/usr/bin/env python3
"""
Team Papers Converter
Converts team papers from various formats (DOCX, CSV, TXT) to JSON format
compatible with the citation scraper and LLM analytics pipeline
"""

import json
import csv
import re
from pathlib import Path
from typing import List, Dict, Optional
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

try:
    from docx import Document
    DOCX_AVAILABLE = True
except ImportError:
    DOCX_AVAILABLE = False
    logger.warning("python-docx not installed. DOCX files cannot be processed.")
    logger.warning("Install with: pip install python-docx")

class TeamPapersConverter:
    """Converts team papers from various formats to JSON"""
    
    def __init__(self):
        self.output_format = {
            "model_name": "",
            "team_papers_source": "",
            "extraction_date": "2025-11-11",
            "papers": []
        }
    
    def convert_docx_to_json(self, docx_file: str, model_name: str, output_file: str) -> Dict:
        """
        Convert DOCX file with team papers to JSON format
        
        Args:
            docx_file: Path to DOCX file
            model_name: Name of the model (e.g., 'LES', 'EDMF')
            output_file: Output JSON file path
            
        Returns:
            Dictionary with conversion results
        """
        if not DOCX_AVAILABLE:
            raise ImportError("python-docx is required for DOCX processing. Install with: pip install python-docx")
        
        logger.info(f"Converting {docx_file} to JSON for model {model_name}")
        
        try:
            doc = Document(docx_file)
            papers = []
            
            # Extract text from all paragraphs
            full_text = ""
            for paragraph in doc.paragraphs:
                text = paragraph.text.strip()
                if text:
                    full_text += text + "\n"
            
            # Extract papers using various patterns
            extracted_papers = self._extract_papers_from_text(full_text)
            
            # Create output structure
            output_data = {
                "model_name": model_name,
                "team_papers_source": docx_file,
                "extraction_date": "2025-11-11",
                "papers": extracted_papers
            }
            
            # Save to JSON
            with open(output_file, 'w', encoding='utf-8') as f:
                json.dump(output_data, f, indent=2, ensure_ascii=False)
            
            logger.info(f"Converted {len(extracted_papers)} papers to {output_file}")
            
            return {
                'success': True,
                'papers_extracted': len(extracted_papers),
                'output_file': output_file,
                'papers': extracted_papers
            }
            
        except Exception as e:
            logger.error(f"Error converting DOCX file: {e}")
            return {'success': False, 'error': str(e)}
    
    def convert_csv_to_json(self, csv_file: str, model_name: str, output_file: str,
                           title_column: str = 'title', authors_column: str = 'authors',
                           year_column: str = 'year', doi_column: str = 'doi') -> Dict:
        """
        Convert CSV file with team papers to JSON format
        
        Args:
            csv_file: Path to CSV file
            model_name: Name of the model
            output_file: Output JSON file path
            title_column: Name of title column
            authors_column: Name of authors column
            year_column: Name of year column
            doi_column: Name of DOI column
        """
        logger.info(f"Converting {csv_file} to JSON for model {model_name}")
        
        try:
            papers = []
            
            with open(csv_file, 'r', encoding='utf-8') as f:
                reader = csv.DictReader(f)
                
                for row in reader:
                    paper = self._extract_paper_from_row(
                        row, title_column, authors_column, year_column, doi_column
                    )
                    if paper:
                        papers.append(paper)
            
            # Create output structure
            output_data = {
                "model_name": model_name,
                "team_papers_source": csv_file,
                "extraction_date": "2025-11-11",
                "papers": papers
            }
            
            # Save to JSON
            with open(output_file, 'w', encoding='utf-8') as f:
                json.dump(output_data, f, indent=2, ensure_ascii=False)
            
            logger.info(f"Converted {len(papers)} papers to {output_file}")
            
            return {
                'success': True,
                'papers_extracted': len(papers),
                'output_file': output_file,
                'papers': papers
            }
            
        except Exception as e:
            logger.error(f"Error converting CSV file: {e}")
            return {'success': False, 'error': str(e)}
    
    def convert_text_to_json(self, text_file: str, model_name: str, output_file: str) -> Dict:
        """
        Convert text file with team papers to JSON format
        
        Args:
            text_file: Path to text file
            model_name: Name of the model
            output_file: Output JSON file path
        """
        logger.info(f"Converting {text_file} to JSON for model {model_name}")
        
        try:
            with open(text_file, 'r', encoding='utf-8') as f:
                text_content = f.read()
            
            papers = self._extract_papers_from_text(text_content)
            
            # Create output structure
            output_data = {
                "model_name": model_name,
                "team_papers_source": text_file,
                "extraction_date": "2025-11-11",
                "papers": papers
            }
            
            # Save to JSON
            with open(output_file, 'w', encoding='utf-8') as f:
                json.dump(output_data, f, indent=2, ensure_ascii=False)
            
            logger.info(f"Converted {len(papers)} papers to {output_file}")
            
            return {
                'success': True,
                'papers_extracted': len(papers),
                'output_file': output_file,
                'papers': papers
            }
            
        except Exception as e:
            logger.error(f"Error converting text file: {e}")
            return {'success': False, 'error': str(e)}
    
    def manual_paper_entry(self, model_name: str, output_file: str) -> Dict:
        """
        Interactive manual entry of team papers
        
        Args:
            model_name: Name of the model
            output_file: Output JSON file path
        """
        print(f"\n=== Manual Paper Entry for {model_name} ===")
        print("Enter paper information (press Enter with empty title to finish)")
        
        papers = []
        
        while True:
            print(f"\n--- Paper {len(papers) + 1} ---")
            
            title = input("Title: ").strip()
            if not title:
                break
            
            authors_input = input("Authors (comma-separated): ").strip()
            authors = [author.strip() for author in authors_input.split(',') if author.strip()]
            
            year_input = input("Year (optional): ").strip()
            year = None
            if year_input.isdigit():
                year = int(year_input)
            
            doi = input("DOI (optional): ").strip() or None
            venue = input("Journal/Conference (optional): ").strip() or None
            
            paper = {
                "title": title,
                "authors": authors,
                "year": year,
                "doi": doi,
                "venue": venue
            }
            
            papers.append(paper)
            print(f"Added paper: {title}")
        
        if papers:
            # Create output structure
            output_data = {
                "model_name": model_name,
                "team_papers_source": "manual_entry",
                "extraction_date": "2025-11-11",
                "papers": papers
            }
            
            # Save to JSON
            with open(output_file, 'w', encoding='utf-8') as f:
                json.dump(output_data, f, indent=2, ensure_ascii=False)
            
            logger.info(f"Saved {len(papers)} papers to {output_file}")
        
        return {
            'success': True,
            'papers_extracted': len(papers),
            'output_file': output_file,
            'papers': papers
        }
    
    def _extract_papers_from_text(self, text: str) -> List[Dict]:
        """
        Extract paper information from text using various patterns
        """
        papers = []
        
        # Common patterns for academic papers
        patterns = [
            # Pattern 1: Title (Year). Authors. Journal.
            r'([^.]+?)\s*\((\d{4})\)\.\s*([^.]+?)\.\s*([^.]+?)\.',
            
            # Pattern 2: Authors (Year). Title. Journal.
            r'([^.]+?)\s*\((\d{4})\)\.\s*([^.]+?)\.\s*([^.]+?)\.',
            
            # Pattern 3: Title, Authors, Year, Journal
            r'([^,]+?),\s*([^,]+?),\s*(\d{4}),\s*([^,\n]+)',
            
            # Pattern 4: Simple line-by-line format
            r'^(.+?)$'
        ]
        
        lines = text.split('\n')
        
        for line in lines:
            line = line.strip()
            if not line or len(line) < 10:  # Skip short/empty lines
                continue
            
            # Try to extract DOI
            doi_match = re.search(r'doi:?\s*(10\.\d+/[^\s]+)', line, re.IGNORECASE)
            doi = doi_match.group(1) if doi_match else None
            
            # Try to extract year
            year_match = re.search(r'\b(19|20)\d{2}\b', line)
            year = int(year_match.group()) if year_match else None
            
            # For now, treat each non-empty line as a potential paper title
            # This is a basic extraction - may need refinement based on actual format
            
            # Clean up the line (remove DOI, extra whitespace)
            clean_line = re.sub(r'doi:?\s*10\.\d+/[^\s]+', '', line, flags=re.IGNORECASE).strip()
            clean_line = re.sub(r'\s+', ' ', clean_line)
            
            if len(clean_line) > 10:  # Reasonable title length
                paper = {
                    "title": clean_line,
                    "authors": [],  # Will need manual entry or better parsing
                    "year": year,
                    "doi": doi,
                    "venue": None,
                    "extraction_note": "Extracted from text - may need manual review"
                }
                papers.append(paper)
        
        # Remove duplicates based on title similarity
        unique_papers = []
        for paper in papers:
            is_duplicate = False
            for existing in unique_papers:
                if self._titles_similar(paper['title'], existing['title']):
                    is_duplicate = True
                    break
            if not is_duplicate:
                unique_papers.append(paper)
        
        logger.info(f"Extracted {len(unique_papers)} unique papers from text")
        return unique_papers
    
    def _extract_paper_from_row(self, row: Dict, title_col: str, authors_col: str,
                               year_col: str, doi_col: str) -> Optional[Dict]:
        """Extract paper information from CSV row"""
        try:
            title = row.get(title_col, '').strip()
            if not title:
                return None
            
            authors_str = row.get(authors_col, '').strip()
            authors = [author.strip() for author in authors_str.split(',') if author.strip()]
            
            year = None
            year_str = row.get(year_col, '').strip()
            if year_str and year_str.isdigit():
                year = int(year_str)
            
            doi = row.get(doi_col, '').strip() or None
            
            return {
                "title": title,
                "authors": authors,
                "year": year,
                "doi": doi,
                "venue": row.get('venue', None) or row.get('journal', None)
            }
            
        except Exception as e:
            logger.warning(f"Error extracting paper from row: {e}")
            return None
    
    def _titles_similar(self, title1: str, title2: str, threshold: float = 0.8) -> bool:
        """Check if two titles are similar"""
        # Simple word-based similarity
        words1 = set(re.sub(r'[^\w\s]', '', title1.lower()).split())
        words2 = set(re.sub(r'[^\w\s]', '', title2.lower()).split())
        
        if not words1 or not words2:
            return False
        
        intersection = words1.intersection(words2)
        union = words1.union(words2)
        
        return len(intersection) / len(union) > threshold

def main():
    """Command-line interface"""
    import argparse
    
    parser = argparse.ArgumentParser(description='Convert team papers to JSON format')
    parser.add_argument('input_file', nargs='?', help='Input file (DOCX, CSV, or TXT)')
    parser.add_argument('model_name', help='Model name (e.g., LES, EDMF)')
    parser.add_argument('-o', '--output', required=True, help='Output JSON file')
    parser.add_argument('--format', choices=['docx', 'csv', 'txt', 'manual'],
                       help='Input format (auto-detected if not specified)')
    parser.add_argument('--title-column', default='title', help='Title column for CSV')
    parser.add_argument('--authors-column', default='authors', help='Authors column for CSV')
    parser.add_argument('--year-column', default='year', help='Year column for CSV')
    parser.add_argument('--doi-column', default='doi', help='DOI column for CSV')
    
    args = parser.parse_args()
    
    converter = TeamPapersConverter()
    
    # Handle manual entry
    if args.format == 'manual' or not args.input_file:
        result = converter.manual_paper_entry(args.model_name, args.output)
    else:
        # Auto-detect format if not specified
        if not args.format:
            ext = Path(args.input_file).suffix.lower()
            if ext == '.docx':
                args.format = 'docx'
            elif ext == '.csv':
                args.format = 'csv'
            elif ext in ['.txt', '.text']:
                args.format = 'txt'
            else:
                print(f"Cannot auto-detect format for {ext}. Please specify --format")
                return
        
        # Convert based on format
        if args.format == 'docx':
            result = converter.convert_docx_to_json(args.input_file, args.model_name, args.output)
        elif args.format == 'csv':
            result = converter.convert_csv_to_json(
                args.input_file, args.model_name, args.output,
                args.title_column, args.authors_column, args.year_column, args.doi_column
            )
        elif args.format == 'txt':
            result = converter.convert_text_to_json(args.input_file, args.model_name, args.output)
    
    # Print results
    if result['success']:
        print(f"\nConversion successful!")
        print(f"Papers extracted: {result['papers_extracted']}")
        print(f"Output file: {result['output_file']}")
        
        if result['papers_extracted'] > 0:
            print(f"\nSample papers:")
            for i, paper in enumerate(result['papers'][:3]):
                print(f"  {i+1}. {paper['title']}")
    else:
        print(f"Conversion failed: {result['error']}")

if __name__ == '__main__':
    main()