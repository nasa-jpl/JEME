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

const DATA_DIR = path.join(__dirname, '..', 'public', 'data');

// All model data files follow the pattern {MODEL}_analyzed.json
const MODELS = ['ECCO', 'RAPID', 'CARDAMOM', 'CMS-Flux', 'ISSM', 'MOMO-CHEM', 'LES', 'EDMF', 'GRACE', 'SWOT', 'TROPESS'];

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
    title.includes('printer-friendly version interactive discussion') ||
    title.startsWith('supporting information for')
  );
}

function isBookChapter(entry) {
  var doi = (entry.doi || entry.DOI || '').toLowerCase();
  var title = (entry.title || '').toLowerCase().trim();
  var authors = entry.authors || [];
  var year = entry.year;
  // Earth 2020 book chapters
  if (doi.includes('10.11647/obp.0193')) return true;
  // Field to Palette and similar non-research book chapters
  if (doi.includes('10.1201/b22355')) return true;
  // Wiley/Springer book chapters (ISBN-based DOIs) with missing metadata
  if (/^10\.(1002|1007)\/978/.test(doi) && (authors.length === 0 || !year)) return true;
  return false;
}

function isEditorialOrReviewerContent(entry) {
  var title = (entry.title || '').toLowerCase().trim();
  return (
    title.startsWith('response to referee') ||
    title.startsWith('reply to referee') ||
    title.startsWith('response to reviewer') ||
    title.startsWith('reply to reviewer') ||
    title.startsWith('reply on rc') ||
    title.startsWith('reply to rc') ||
    /^comment on [a-z]+-\d/.test(title) ||  // "Comment on egusphere-2022-244"
    /^comment on ``/.test(title) ||
    /^comment on ['"\u2018\u201c]/.test(title) ||  // "Comment on 'Title'" or 'Comment on "Title"'
    title.startsWith('response to comment on') ||
    title.startsWith('discussion on ') ||
    title.startsWith('discussion of ') ||
    title.startsWith('short comment on') ||
    title === 'issue information' ||
    title === 'masthead' ||
    title === 'editorial board' ||
    title.startsWith('editorial:') ||
    title === 'contents' ||
    title === 'open peer review'
  );
}

function isIncompleteMetadata(entry) {
  var title = (entry.title || '').trim();
  var authors = entry.authors || [];
  var year = entry.year;
  var doi = (entry.doi || entry.DOI || '').trim();
  var venue = (entry.venue || '').trim();

  // No authors AND no year AND no DOI — unreliable entry
  if (authors.length === 0 && !year && !doi) return true;
  // Has title but missing year, DOI, AND venue — too little metadata to trust
  if (title && !year && !doi && !venue) return true;
  // Book chapter DOI with empty authors (ISBN-based DOI fallback failure)
  if (authors.length === 0 && /^10\.(1002|1007)\/978/.test(doi)) return true;

  return false;
}

function isFrontMatter(entry) {
  var title = (entry.title || '').toLowerCase().trim();
  var frontMatterTitles = [
    'preface', 'index', 'references', 'foreword', 'introduction',
    'acknowledgements', 'acknowledgments', 'untitled'
  ];
  return frontMatterTitles.includes(title);
}

function isErrataCorrigenda(entry) {
  var title = (entry.title || '').toLowerCase().trim();
  return (
    title.startsWith('erratum to') ||
    title.startsWith('erratum:') ||
    title.startsWith('erratum for') ||
    title === 'erratum' ||
    title.startsWith('corrigendum to') ||
    title.startsWith('corrigendum:') ||
    title === 'corrigendum' ||
    title.startsWith('correction to:') ||
    title.startsWith('correction:') ||
    (title === 'correction' && !title.includes('correction of'))
  );
}

function isFragmentTitle(entry) {
  var title = (entry.title || '').trim();
  // Skip empty titles
  if (!title) return true;
  // Skip very short titles (<=10 chars) but not Chinese/CJK characters
  // CJK titles are short in character count but are full titles
  var hasCJK = /[\u4e00-\u9fff\u3400-\u4dbf\uac00-\ud7af]/.test(title);
  if (hasCJK) return false;
  if (title.length <= 10) return true;
  return false;
}

function shouldRemove(entry) {
  return (
    isReviewOfSpam(entry) ||
    isPlaceholderEntry(entry) ||
    isSupplementaryMetadata(entry) ||
    isBookChapter(entry) ||
    isEditorialOrReviewerContent(entry) ||
    isFrontMatter(entry) ||
    isErrataCorrigenda(entry) ||
    isFragmentTitle(entry) ||
    isIncompleteMetadata(entry)
  );
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
  var removals = {
    review_of: [], placeholder: [], supplementary: [],
    book_chapter: [], editorial: [], front_matter: [],
    errata: [], fragment: [], incomplete_metadata: []
  };

  var cleaned = data.filter(function (entry) {
    var reasons = [];
    if (isReviewOfSpam(entry)) reasons.push('review_of');
    if (isPlaceholderEntry(entry)) reasons.push('placeholder');
    if (isSupplementaryMetadata(entry)) reasons.push('supplementary');
    if (isBookChapter(entry)) reasons.push('book_chapter');
    if (isEditorialOrReviewerContent(entry)) reasons.push('editorial');
    if (isFrontMatter(entry)) reasons.push('front_matter');
    if (isErrataCorrigenda(entry)) reasons.push('errata');
    if (isFragmentTitle(entry)) reasons.push('fragment');
    if (isIncompleteMetadata(entry)) reasons.push('incomplete_metadata');

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

  // Detect preprint DOIs on entries with journal venues (warning only)
  var preprintDoiWarnings = cleaned.filter(function (entry) {
    var doi = (entry.doi || entry.DOI || '').toLowerCase();
    var venue = (entry.venue || '').toLowerCase();
    var isPreprint = /^10\.(48550\/arxiv|1002\/essoar|31223\/|2139\/ssrn)/.test(doi);
    var hasJournalVenue = venue && !/(arxiv|preprint|essoar|ssrn)/.test(venue);
    return isPreprint && hasJournalVenue;
  });

  // Print report
  console.log('\n── ' + modelName + ' ──────────────────────────────────────');
  console.log('  Total entries: ' + originalCount);

  var filterLabels = {
    review_of: 'Filter 1 - "Review of:" spam',
    placeholder: 'Filter 2 - Placeholder/corrupted',
    supplementary: 'Filter 3 - Supplementary/metadata',
    book_chapter: 'Filter 4 - Book chapters (non-research)',
    editorial: 'Filter 5 - Editorial/reviewer content',
    front_matter: 'Filter 6 - Front matter (preface, index, etc.)',
    errata: 'Filter 7 - Errata/corrigenda',
    fragment: 'Filter 8 - Fragment/empty titles',
    incomplete_metadata: 'Filter 9 - Incomplete metadata'
  };

  Object.keys(filterLabels).forEach(function (key) {
    if (removals[key].length > 0) {
      console.log('\n  ' + filterLabels[key] + ': ' + removals[key].length + ' entries');
      removals[key].slice(0, 3).forEach(function (r) {
        console.log('    - "' + r.title + '"' + (r.title.length >= 100 ? '...' : '') + ' (' + r.year + ')');
      });
      if (removals[key].length > 3) {
        console.log('    ... and ' + (removals[key].length - 3) + ' more');
      }
    }
  });

  console.log('\n  Total removed: ' + totalRemoved);
  console.log('  Remaining: ' + cleaned.length);

  if (preprintDoiWarnings.length > 0) {
    console.log('\n  ⚠ Preprint DOI with journal venue: ' + preprintDoiWarnings.length + ' entries');
    preprintDoiWarnings.slice(0, 3).forEach(function (e) {
      console.log('    - "' + (e.title || '').substring(0, 80) + '" (DOI: ' + (e.doi || e.DOI) + ', venue: ' + e.venue + ')');
    });
    if (preprintDoiWarnings.length > 3) {
      console.log('    ... and ' + (preprintDoiWarnings.length - 3) + ' more');
    }
  }

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
