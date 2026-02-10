#!/usr/bin/env node

/**
 * Citation Data Cleanup Script
 * Removes spam, placeholder, and metadata entries from model citation JSON files.
 *
 * Usage:
 *   node scripts/clean_citation_data.js --model ECCO --dry-run   # preview only
 *   node scripts/clean_citation_data.js --model ECCO              # apply cleanup
 *   node scripts/clean_citation_data.js --all --dry-run           # preview all models
 *   node scripts/clean_citation_data.js --all                     # clean all models
 */

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'src', 'data');

// All model data files follow the pattern {MODEL}_analyzed.json
const MODELS = ['ECCO', 'RAPID', 'CARDAMOM', 'CMS-Flux', 'ISSM', 'MOMO-CHEM'];

// ── Filter functions ────────────────────────────────────────────────────────

function isReviewOfSpam(entry) {
  var title = (entry.title || '').toLowerCase().trim();
  return title.startsWith('review of:');
}

function isPlaceholderEntry(entry) {
  var title = (entry.title || '').toLowerCase().trim();
  return (
    title === 'insight review articles' ||
    title.includes('digital commons') ||
    title.startsWith('non-commercial research and educational use') ||
    title.startsWith('provided for non-commercial research')
  );
}

function isSupplementaryMetadata(entry) {
  var title = (entry.title || '').toLowerCase().trim();
  return (
    title.startsWith('supplementary material') ||
    title.startsWith('supplementary information') ||
    title.endsWith('- supplementary material') ||
    title.includes('interactive comment') ||
    title.includes('printer-friendly version interactive discussion')
  );
}

function shouldRemove(entry) {
  return isReviewOfSpam(entry) || isPlaceholderEntry(entry) || isSupplementaryMetadata(entry);
}

// ── Processing ──────────────────────────────────────────────────────────────

function cleanModel(modelName, dryRun) {
  var fileName = modelName + '_analyzed.json';
  var filePath = path.join(DATA_DIR, fileName);

  if (!fs.existsSync(filePath)) {
    console.log('\n  ' + modelName + ': file not found (' + fileName + '), skipping');
    return null;
  }

  var rawData = fs.readFileSync(filePath, 'utf-8');
  var data = JSON.parse(rawData);

  if (!Array.isArray(data)) {
    console.log('\n  ' + modelName + ': data is not an array, skipping');
    return null;
  }

  var originalCount = data.length;
  var removals = { review_of: [], placeholder: [], supplementary: [] };

  var cleaned = data.filter(function (entry) {
    var reasons = [];
    if (isReviewOfSpam(entry)) reasons.push('review_of');
    if (isPlaceholderEntry(entry)) reasons.push('placeholder');
    if (isSupplementaryMetadata(entry)) reasons.push('supplementary');

    if (reasons.length > 0) {
      var info = {
        title: (entry.title || '').substring(0, 100),
        year: entry.year,
        citations: entry.citation_count
      };
      reasons.forEach(function (r) { removals[r].push(info); });
      return false;
    }
    return true;
  });

  var totalRemoved = originalCount - cleaned.length;

  // Print report
  console.log('\n── ' + modelName + ' ──────────────────────────────────────');
  console.log('  Total entries: ' + originalCount);

  if (removals.review_of.length > 0) {
    console.log('\n  Filter 1 - "Review of:" spam: ' + removals.review_of.length + ' entries');
    removals.review_of.slice(0, 3).forEach(function (r) {
      console.log('    - ' + r.title + (r.title.length >= 100 ? '...' : ''));
    });
    if (removals.review_of.length > 3) {
      console.log('    ... and ' + (removals.review_of.length - 3) + ' more');
    }
  }

  if (removals.placeholder.length > 0) {
    console.log('\n  Filter 2 - Placeholder/corrupted: ' + removals.placeholder.length + ' entries');
    removals.placeholder.slice(0, 5).forEach(function (r) {
      console.log('    - ' + r.title + ' (year: ' + r.year + ', citations: ' + r.citations + ')');
    });
    if (removals.placeholder.length > 5) {
      console.log('    ... and ' + (removals.placeholder.length - 5) + ' more');
    }
  }

  if (removals.supplementary.length > 0) {
    console.log('\n  Filter 3 - Supplementary/metadata: ' + removals.supplementary.length + ' entries');
    removals.supplementary.slice(0, 3).forEach(function (r) {
      console.log('    - ' + r.title + (r.title.length >= 100 ? '...' : ''));
    });
    if (removals.supplementary.length > 3) {
      console.log('    ... and ' + (removals.supplementary.length - 3) + ' more');
    }
  }

  console.log('\n  Total removed: ' + totalRemoved);
  console.log('  Remaining: ' + cleaned.length);

  if (totalRemoved === 0) {
    console.log('  No changes needed.');
    return { model: modelName, removed: 0, remaining: originalCount };
  }

  if (dryRun) {
    console.log('  [DRY RUN - no changes written]');
  } else {
    fs.writeFileSync(filePath, JSON.stringify(cleaned, null, 2), 'utf-8');
    // Verify
    var verify = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    console.log('  Written to ' + fileName + ' (verified: ' + verify.length + ' entries)');
  }

  return { model: modelName, removed: totalRemoved, remaining: cleaned.length };
}

// ── Main ────────────────────────────────────────────────────────────────────

function main() {
  var args = process.argv.slice(2);
  var dryRun = args.includes('--dry-run');
  var allModels = args.includes('--all');
  var modelIdx = args.indexOf('--model');
  var modelName = modelIdx >= 0 ? args[modelIdx + 1] : null;

  if (!allModels && !modelName) {
    console.log('Usage:');
    console.log('  node scripts/clean_citation_data.js --model ECCO [--dry-run]');
    console.log('  node scripts/clean_citation_data.js --all [--dry-run]');
    console.log('\nAvailable models: ' + MODELS.join(', '));
    process.exit(1);
  }

  var modelsToClean = allModels ? MODELS : [modelName];

  console.log('Citation Data Cleanup' + (dryRun ? ' (DRY RUN)' : ''));
  console.log('=====================');

  var results = [];
  modelsToClean.forEach(function (m) {
    var result = cleanModel(m, dryRun);
    if (result) results.push(result);
  });

  if (results.length > 1) {
    console.log('\n── Summary ──────────────────────────────────────');
    var totalRemoved = 0;
    results.forEach(function (r) {
      console.log('  ' + r.model + ': removed ' + r.removed + ', remaining ' + r.remaining);
      totalRemoved += r.removed;
    });
    console.log('  Total removed across all models: ' + totalRemoved);
  }
}

main();
