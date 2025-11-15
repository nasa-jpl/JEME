#!/usr/bin/env python3
"""
Pipeline Integration Script
Integrates scraped citations into the existing LLM Paper Analytics and Dashboard pipeline
"""

import json
import shutil
from pathlib import Path
import logging
from typing import Dict, List
import subprocess
import sys

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class PipelineIntegrator:
    """Integrates new model data into the existing pipeline"""
    
    def __init__(self, base_dir: str = None):
        if base_dir:
            self.base_dir = Path(base_dir)
        else:
            # Auto-detect base directory
            current_dir = Path(__file__).parent.absolute()
            self.base_dir = current_dir.parent
        
        self.llm_analytics_dir = self.base_dir / "LLM_paper_analytics"
        self.dashboard_dir = self.base_dir / "science-model-dashboard"
        self.pubclassifier_dir = self.base_dir / "pubclassifier"
        
        logger.info(f"Base directory: {self.base_dir}")
        logger.info(f"LLM Analytics: {self.llm_analytics_dir}")
        logger.info(f"Dashboard: {self.dashboard_dir}")
    
    def integrate_new_model(self, model_name: str, citations_file: str, 
                           team_papers_file: str = None, run_analysis: bool = True,
                           add_to_dashboard: bool = True) -> Dict:
        """
        Complete integration of a new model into the pipeline
        
        Args:
            model_name: Name of the new model (e.g., 'LES', 'EDMF')
            citations_file: Path to the scraped citations JSON file
            team_papers_file: Optional path to team papers JSON file
            run_analysis: Whether to run LLM analysis on citations
            add_to_dashboard: Whether to add model to dashboard
            
        Returns:
            Integration results dictionary
        """
        logger.info(f"Starting integration for model: {model_name}")
        
        results = {
            'model_name': model_name,
            'citations_processed': False,
            'analysis_completed': False,
            'dashboard_updated': False,
            'errors': []
        }
        
        try:
            # Step 1: Process citations for LLM analytics
            if citations_file and Path(citations_file).exists():
                citations_result = self._prepare_citations_for_analytics(
                    model_name, citations_file
                )
                results['citations_processed'] = citations_result['success']
                if not citations_result['success']:
                    results['errors'].append(f"Citations processing failed: {citations_result.get('error')}")
            
            # Step 2: Run LLM analysis (optional)
            if run_analysis and results['citations_processed']:
                analysis_result = self._run_llm_analysis(model_name)
                results['analysis_completed'] = analysis_result['success']
                if not analysis_result['success']:
                    results['errors'].append(f"LLM analysis failed: {analysis_result.get('error')}")
            
            # Step 3: Add to dashboard (optional)
            if add_to_dashboard:
                dashboard_result = self._add_to_dashboard(model_name)
                results['dashboard_updated'] = dashboard_result['success']
                if not dashboard_result['success']:
                    results['errors'].append(f"Dashboard update failed: {dashboard_result.get('error')}")
            
            # Step 4: Update configuration files
            self._update_model_config(model_name, team_papers_file)
            
            logger.info(f"Integration completed for {model_name}")
            return results
            
        except Exception as e:
            logger.error(f"Integration failed for {model_name}: {e}")
            results['errors'].append(str(e))
            return results
    
    def _prepare_citations_for_analytics(self, model_name: str, citations_file: str) -> Dict:
        """Prepare citations file for LLM analytics"""
        try:
            logger.info(f"Preparing citations for LLM analytics: {model_name}")
            
            # Load scraped citations
            with open(citations_file, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            # Extract just the citations if the file has metadata wrapper
            if isinstance(data, dict) and 'citations' in data:
                citations = data['citations']
            elif isinstance(data, list):
                citations = data
            else:
                raise ValueError("Invalid citations file format")
            
            # Create LLM analytics data directory if it doesn't exist
            analytics_data_dir = self.llm_analytics_dir / "data"
            analytics_data_dir.mkdir(parents=True, exist_ok=True)
            
            # Save in the format expected by LLM analytics
            output_file = analytics_data_dir / f"{model_name}.json"
            with open(output_file, 'w', encoding='utf-8') as f:
                json.dump(citations, f, indent=2, ensure_ascii=False)
            
            logger.info(f"Saved {len(citations)} citations to {output_file}")
            
            return {
                'success': True,
                'output_file': str(output_file),
                'citations_count': len(citations)
            }
            
        except Exception as e:
            logger.error(f"Error preparing citations: {e}")
            return {'success': False, 'error': str(e)}
    
    def _run_llm_analysis(self, model_name: str) -> Dict:
        """Run LLM analysis on the citations"""
        try:
            logger.info(f"Running LLM analysis for {model_name}")
            
            # Check if Ollama is available
            try:
                subprocess.run(['ollama', '--version'], 
                             capture_output=True, check=True, timeout=5)
            except (subprocess.CalledProcessError, FileNotFoundError, subprocess.TimeoutExpired):
                logger.warning("Ollama not available - skipping LLM analysis")
                return {
                    'success': False, 
                    'error': 'Ollama not available. Install Ollama and ensure it\'s running.'
                }
            
            # Change to LLM analytics directory
            original_dir = Path.cwd()
            analytics_dir = self.llm_analytics_dir
            
            if not analytics_dir.exists():
                return {'success': False, 'error': f'LLM analytics directory not found: {analytics_dir}'}
            
            try:
                # Change to analytics directory
                import os
                os.chdir(analytics_dir)
                
                # Run citation analysis
                input_file = analytics_dir / "data" / f"{model_name}.json"
                output_file = analytics_dir / "results" / f"{model_name}_analyzed.json"
                
                # Create results directory
                results_dir = analytics_dir / "results"
                results_dir.mkdir(exist_ok=True)
                
                # Run the analysis script
                cmd = [
                    sys.executable, 
                    "src/citation_analyzer.py", 
                    str(input_file),
                    "-o", str(output_file),
                    "-m", f"{model_name} methodology",
                    "--model", "deepseek-r1:671b"  # or another available model
                ]
                
                logger.info(f"Running: {' '.join(cmd)}")
                result = subprocess.run(cmd, capture_output=True, text=True, timeout=600)
                
                if result.returncode == 0:
                    logger.info(f"LLM analysis completed for {model_name}")
                    return {
                        'success': True,
                        'output_file': str(output_file),
                        'stdout': result.stdout
                    }
                else:
                    logger.error(f"LLM analysis failed: {result.stderr}")
                    return {
                        'success': False,
                        'error': f"Analysis script failed: {result.stderr}"
                    }
                    
            finally:
                # Change back to original directory
                os.chdir(original_dir)
                
        except Exception as e:
            logger.error(f"Error running LLM analysis: {e}")
            return {'success': False, 'error': str(e)}
    
    def _add_to_dashboard(self, model_name: str) -> Dict:
        """Add model to the dashboard configuration"""
        try:
            logger.info(f"Adding {model_name} to dashboard")
            
            # Copy analyzed data to dashboard
            analytics_output = self.llm_analytics_dir / "results" / f"{model_name}_analyzed.json"
            dashboard_data_dir = self.dashboard_dir / "src" / "data"
            dashboard_output = dashboard_data_dir / f"{model_name}_analyzed.json"
            
            if analytics_output.exists():
                dashboard_data_dir.mkdir(parents=True, exist_ok=True)
                shutil.copy2(analytics_output, dashboard_output)
                logger.info(f"Copied analyzed data to {dashboard_output}")
            else:
                logger.warning(f"No analyzed data found at {analytics_output}")
            
            # Update model configuration
            self._update_dashboard_config(model_name)
            
            return {'success': True, 'data_file': str(dashboard_output)}
            
        except Exception as e:
            logger.error(f"Error adding to dashboard: {e}")
            return {'success': False, 'error': str(e)}
    
    def _update_dashboard_config(self, model_name: str):
        """Update dashboard model configuration"""
        try:
            config_file = self.dashboard_dir / "src" / "config" / "modelConfig.js"
            
            if not config_file.exists():
                logger.warning(f"Model config file not found: {config_file}")
                return
            
            # Read current config
            with open(config_file, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Check if model already exists
            if f'"{model_name}"' in content:
                logger.info(f"Model {model_name} already exists in config")
                return
            
            # Add new model configuration
            # This is a basic template - may need customization
            new_config = f'''  {model_name}: {{
    name: "{model_name}",
    displayName: "{model_name}",
    description: "{model_name} model citation analysis",
    dataPath: "/data/{model_name}_analyzed.json",
    color: "#2E8B57",
    domain: "Earth Science",
    links: {{
      website: "",
      documentation: "",
      github: ""
    }}
  }},'''
            
            # Find insertion point (before the closing brace)
            insertion_point = content.rfind('};')
            if insertion_point > 0:
                # Insert before the closing brace
                new_content = content[:insertion_point] + new_config + '\n' + content[insertion_point:]
                
                # Write back
                with open(config_file, 'w', encoding='utf-8') as f:
                    f.write(new_content)
                
                logger.info(f"Added {model_name} to dashboard config")
            
        except Exception as e:
            logger.error(f"Error updating dashboard config: {e}")
    
    def _update_model_config(self, model_name: str, team_papers_file: str = None):
        """Update CLAUDE.md with new model information"""
        try:
            claude_md = self.base_dir / "CLAUDE.md"
            
            if not claude_md.exists():
                logger.warning("CLAUDE.md not found")
                return
            
            with open(claude_md, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Check if model already mentioned
            if model_name in content:
                logger.info(f"Model {model_name} already in CLAUDE.md")
                return
            
            # Add model to the supported models list
            models_line = "- Each model has display name, description, data path, color theme, domain, and links"
            if models_line in content:
                new_line = f"- Centralized configuration for all supported models (RAPID, CARDAMOM, CMS-Flux, ECCO, ISSM, MOMO-CHEM, {model_name})"
                content = content.replace(
                    "- Centralized configuration for all supported models (RAPID, CARDAMOM, CMS-Flux, ECCO, ISSM, MOMO-CHEM)",
                    new_line
                )
                
                with open(claude_md, 'w', encoding='utf-8') as f:
                    f.write(content)
                
                logger.info(f"Updated CLAUDE.md with {model_name}")
            
        except Exception as e:
            logger.error(f"Error updating CLAUDE.md: {e}")
    
    def validate_integration(self, model_name: str) -> Dict:
        """Validate that integration was successful"""
        validation_results = {
            'model_name': model_name,
            'files_present': {},
            'config_updated': False,
            'ready_for_dashboard': False
        }
        
        # Check file presence
        files_to_check = [
            ('raw_citations', self.llm_analytics_dir / "data" / f"{model_name}.json"),
            ('analyzed_data', self.llm_analytics_dir / "results" / f"{model_name}_analyzed.json"),
            ('dashboard_data', self.dashboard_dir / "src" / "data" / f"{model_name}_analyzed.json"),
        ]
        
        for file_type, file_path in files_to_check:
            validation_results['files_present'][file_type] = file_path.exists()
        
        # Check dashboard config
        config_file = self.dashboard_dir / "src" / "config" / "modelConfig.js"
        if config_file.exists():
            with open(config_file, 'r', encoding='utf-8') as f:
                config_content = f.read()
                validation_results['config_updated'] = model_name in config_content
        
        # Overall readiness
        validation_results['ready_for_dashboard'] = all([
            validation_results['files_present'].get('dashboard_data', False),
            validation_results['config_updated']
        ])
        
        return validation_results

def main():
    """Command-line interface"""
    import argparse
    
    parser = argparse.ArgumentParser(description='Integrate new model into the pipeline')
    parser.add_argument('model_name', help='Model name (e.g., LES, EDMF)')
    parser.add_argument('citations_file', help='Path to scraped citations JSON file')
    parser.add_argument('--team-papers', help='Path to team papers JSON file')
    parser.add_argument('--no-analysis', action='store_true', help='Skip LLM analysis')
    parser.add_argument('--no-dashboard', action='store_true', help='Skip dashboard integration')
    parser.add_argument('--base-dir', help='Base directory of the project')
    parser.add_argument('--validate-only', action='store_true', help='Only validate integration')
    
    args = parser.parse_args()
    
    integrator = PipelineIntegrator(args.base_dir)
    
    if args.validate_only:
        results = integrator.validate_integration(args.model_name)
        print(f"\nValidation Results for {args.model_name}:")
        print(f"Files present: {results['files_present']}")
        print(f"Config updated: {results['config_updated']}")
        print(f"Ready for dashboard: {results['ready_for_dashboard']}")
        return
    
    # Run integration
    results = integrator.integrate_new_model(
        args.model_name,
        args.citations_file,
        args.team_papers,
        run_analysis=not args.no_analysis,
        add_to_dashboard=not args.no_dashboard
    )
    
    # Print results
    print(f"\nIntegration Results for {args.model_name}:")
    print(f"Citations processed: {results['citations_processed']}")
    print(f"Analysis completed: {results['analysis_completed']}")
    print(f"Dashboard updated: {results['dashboard_updated']}")
    
    if results['errors']:
        print(f"\nErrors encountered:")
        for error in results['errors']:
            print(f"  - {error}")
    
    # Run validation
    validation = integrator.validate_integration(args.model_name)
    print(f"\nValidation:")
    print(f"Ready for dashboard: {validation['ready_for_dashboard']}")

if __name__ == '__main__':
    main()