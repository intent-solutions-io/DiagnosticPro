# 🚨 DIAGNOSTIC PLATFORM CLEANUP PLAN
**Date**: September 24, 2025

## Current State: DISASTER
- 997 MD files scattered everywhere
- 1692 JSON files in random locations
- Multiple staging directories with duplicates
- Test files mixed with production code
- No clear separation of concerns

## CORE STRUCTURE (Keep)
```
diagnostic-platform/
├── README.md                 # Project overview
├── CLAUDE.md                 # Main project guidance
├── Makefile                  # Build commands
├── .gitignore                # Git exclusions
├── schema/                   # BigQuery schemas ONLY
│   ├── CLAUDE.md
│   ├── *.json (schema files)
│   └── bigquery_*.py
├── scraper/                  # Data collection ONLY
│   ├── CLAUDE.md
│   ├── youtube_scraper/
│   ├── praw/
│   ├── github_miner/
│   ├── export_gateway/
│   ├── configs/
│   └── scripts/
├── rss_feeds/                # RSS management
├── working-docs/             # Current development
│   └── backend/              # Active backend code
└── archive/                  # Everything else goes here
```

## TRASH TO ARCHIVE (Move)
- deployment/ (old deployment scripts)
- completed-docs/ (old documentation)
- professional-templates/ (templates)
- working-mds/ (random markdown files)
- scraper/scrapers-project/ (staging junk)
- scraper/NMD/ (random directory)
- All test files not in proper test directories
- All .log files
- All debug/temp/backup files
- All duplicate JSON files
- Random scattered MD files

## IMMEDIATE ACTIONS
1. Create archive/cleanup-2025-09-24/ directory
2. Move all non-essential directories to archive
3. Clean up scraper/ directory (remove staging)
4. Keep only essential files in root
5. Verify backend/ is the only working code