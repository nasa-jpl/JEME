#!/bin/bash
# Process all team papers files and generate citation data for each model

# Set up directories
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
TEAM_PAPERS_DIR="/home/ks/science-model-dashboard/public/data"
OUTPUT_DIR="/home/ks/science-model-dashboard/citation_scraper/output"
SCRAPER_SCRIPT="$SCRIPT_DIR/citation_scraper.py"

# Create output directory if it doesn't exist
mkdir -p "$OUTPUT_DIR"

# Color output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Citation Scraper Batch Processing${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Define models and their team papers files
declare -A models=(
    ["CARDAMOM"]="cardamom_team_papers.json"
    ["CMS-Flux"]="cms_flux_team_papers.json"
    ["ECCO"]="ecco_team_papers.json"
    ["ISSM"]="issm_team_papers.json"
    ["MOMO-CHEM"]="momo_chem_team_papers.json"
    ["RAPID"]="rapid_team_papers.json"
    ["LES"]="LES_team_papers.json"
    ["EDMF"]="EDMF_team_papers.json"
)

# Process each model
for model in "${!models[@]}"; do
    input_file="${TEAM_PAPERS_DIR}/${models[$model]}"
    output_file="${OUTPUT_DIR}/${model}_citations.json"

    echo -e "${YELLOW}Processing: $model${NC}"
    echo -e "  Input:  $input_file"
    echo -e "  Output: $output_file"
    echo ""

    # Check if input file exists
    if [ ! -f "$input_file" ]; then
        echo -e "${YELLOW}  ⚠ Warning: Input file not found, skipping...${NC}"
        echo ""
        continue
    fi

    # Run the citation scraper
    python3 "$SCRAPER_SCRIPT" "$input_file" -o "$output_file" --max-citations 1000

    if [ $? -eq 0 ]; then
        echo -e "${GREEN}  ✓ Successfully processed $model${NC}"
    else
        echo -e "${YELLOW}  ✗ Failed to process $model${NC}"
    fi

    echo ""
    echo "----------------------------------------"
    echo ""

    # Add delay to avoid rate limiting
    echo "Waiting 10 seconds before next model..."
    sleep 10
done

echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}Batch processing complete!${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo "Output files saved to: $OUTPUT_DIR"
echo ""
echo "Next steps:"
echo "1. Review the citation data in $OUTPUT_DIR"
echo "2. Copy *_citations_only.json files to the dashboard data directory"
echo "3. Run LLM analysis on the citation data if needed"
