#!/bin/bash
# Monitor ECCO citation scraper progress

LOG_FILE="/home/ks/science-model-dashboard/citation_scraper/ecco_scraper.log"
OUTPUT_FILE="/home/ks/science-model-dashboard/citation_scraper/output/ECCO_citations_citations_only.json"

echo "ECCO Citation Scraper Progress Monitor"
echo "======================================="
echo ""

# Check if process is running
if pgrep -f "ECCO_normalized.json" > /dev/null; then
    echo "✓ ECCO citation scraper is RUNNING"
    echo ""

    # Get current progress from log
    if [ -f "$LOG_FILE" ]; then
        echo "Latest activity:"
        tail -5 "$LOG_FILE" | grep "Processing paper" | tail -1
        echo ""

        # Extract paper number
        CURRENT=$(tail -100 "$LOG_FILE" | grep "Processing paper" | tail -1 | sed 's/.*Processing paper \([0-9]*\).*/\1/')
        TOTAL=2038

        if [ ! -z "$CURRENT" ]; then
            PERCENT=$(awk "BEGIN {printf \"%.1f\", ($CURRENT / $TOTAL) * 100}")
            REMAINING=$((TOTAL - CURRENT))

            echo "Progress: Paper $CURRENT / $TOTAL ($PERCENT%)"
            echo "Remaining: $REMAINING papers"
            echo ""

            # Estimate time (rough estimate: 3 seconds per paper)
            EST_SECONDS=$((REMAINING * 3))
            EST_HOURS=$((EST_SECONDS / 3600))
            EST_MINS=$(( (EST_SECONDS % 3600) / 60 ))

            echo "Estimated time remaining: ~${EST_HOURS}h ${EST_MINS}m"
            echo "(Based on 3 sec/paper average)"
        fi
    fi

    echo ""

    # Show citation count if file exists
    if [ -f "$OUTPUT_FILE" ]; then
        CITATIONS=$(jq '. | length' "$OUTPUT_FILE" 2>/dev/null || echo "0")
        SIZE=$(du -h "$OUTPUT_FILE" | cut -f1)
        echo "Citations collected so far: $CITATIONS"
        echo "Output file size: $SIZE"
    else
        echo "Citations: Collecting..."
    fi
else
    echo "✗ ECCO citation scraper is NOT running"

    if [ -f "$OUTPUT_FILE" ]; then
        CITATIONS=$(jq '. | length' "$OUTPUT_FILE" 2>/dev/null || echo "0")
        SIZE=$(du -h "$OUTPUT_FILE" | cut -f1)
        echo ""
        echo "Final results:"
        echo "  Citations collected: $CITATIONS"
        echo "  Output file size: $SIZE"
    fi
fi

echo ""
echo "======================================="
echo "Log file: $LOG_FILE"
echo "Output: $OUTPUT_FILE"
echo ""
echo "Run: watch -n 60 ./monitor_ecco.sh"
echo "  (Updates every 60 seconds)"
