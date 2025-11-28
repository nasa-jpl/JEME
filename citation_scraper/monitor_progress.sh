#!/bin/bash
# Monitor citation scraper progress

OUTPUT_DIR="/home/ks/science-model-dashboard/citation_scraper/output"
TEMP_DIR="/home/ks/science-model-dashboard/citation_scraper/temp"

echo "Citation Scraper Progress Monitor"
echo "=================================="
echo ""

# Check if process is running
if pgrep -f "citation_scraper.py" > /dev/null; then
    echo "✓ Citation scraper is RUNNING"
    echo ""

    # Show current process
    echo "Current process:"
    ps aux | grep "citation_scraper.py" | grep -v grep | awk '{print "  " $11, $12, $13, $14}'
    echo ""
else
    echo "✗ Citation scraper is NOT running"
    echo ""
fi

# Show normalized files
echo "Normalized files (temp):"
ls -lh "$TEMP_DIR"/*.json 2>/dev/null | awk '{print "  " $9, "(" $5 ")"}'
echo ""

# Show output files
echo "Output files generated:"
if ls "$OUTPUT_DIR"/*.json &> /dev/null; then
    for file in "$OUTPUT_DIR"/*.json; do
        size=$(du -h "$file" | cut -f1)
        lines=$(wc -l < "$file")
        echo "  $(basename "$file") ($size, $lines lines)"
    done
else
    echo "  (none yet)"
fi
echo ""

# Count citations collected so far
echo "Citations collected:"
for file in "$OUTPUT_DIR"/*_citations_only.json; do
    if [ -f "$file" ]; then
        model=$(basename "$file" | sed 's/_citations_only.json//')
        count=$(jq '. | length' "$file" 2>/dev/null || echo "0")
        echo "  $model: $count citations"
    fi
done
echo ""

echo "=================================="
echo "Run this script again to check progress"
echo "Or use: watch -n 30 ./monitor_progress.sh"
