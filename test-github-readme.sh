#!/bin/bash
# Test script to validate GitHub README placement and content
# Usage: ./test-github-readme.sh

set -e

echo "🔍 GitHub README Diagnostic Test"
echo "=================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$REPO_ROOT"

# Test 1: Check .github directory exists
echo "Test 1: .github directory exists"
if [ -d ".github" ]; then
    echo -e "${GREEN}✓ PASS${NC}: .github directory exists"
else
    echo -e "${RED}✗ FAIL${NC}: .github directory not found"
    exit 1
fi

# Test 2: Check .github/README.md exists
echo ""
echo "Test 2: .github/README.md exists"
if [ -f ".github/README.md" ]; then
    echo -e "${GREEN}✓ PASS${NC}: .github/README.md exists"
else
    echo -e "${RED}✗ FAIL${NC}: .github/README.md not found"
    exit 1
fi

# Test 3: Check README has content
echo ""
echo "Test 3: .github/README.md has content"
if [ -s ".github/README.md" ]; then
    LINES=$(wc -l < .github/README.md)
    echo -e "${GREEN}✓ PASS${NC}: .github/README.md has $LINES lines"
else
    echo -e "${RED}✗ FAIL${NC}: .github/README.md is empty"
    exit 1
fi

# Test 4: Check README has proper title
echo ""
echo "Test 4: README has proper title"
if grep -q "^# GitHub Configuration" .github/README.md; then
    echo -e "${GREEN}✓ PASS${NC}: README has proper title"
else
    echo -e "${YELLOW}⚠ WARN${NC}: README title may be incorrect"
fi

# Test 5: Check workflows directory exists
echo ""
echo "Test 5: workflows directory exists"
if [ -d ".github/workflows" ]; then
    echo -e "${GREEN}✓ PASS${NC}: .github/workflows directory exists"
    WORKFLOW_COUNT=$(ls -1 .github/workflows/*.yml 2>/dev/null | wc -l)
    echo "  Found $WORKFLOW_COUNT workflow(s)"
else
    echo -e "${YELLOW}⚠ WARN${NC}: .github/workflows directory not found"
fi

# Test 6: Check if files are committed
echo ""
echo "Test 6: Git status check"
if git rev-parse --git-dir > /dev/null 2>&1; then
    if git status --porcelain | grep -q "README.md"; then
        echo -e "${YELLOW}⚠ WARN${NC}: .github/README.md has uncommitted changes"
        git status --short | grep README.md
    else
        echo -e "${GREEN}✓ PASS${NC}: .github/README.md is committed"
    fi
else
    echo -e "${YELLOW}⚠ WARN${NC}: Not a git repository"
fi

# Test 7: Check if files are pushed to remote
echo ""
echo "Test 7: Remote sync check"
if git rev-parse --git-dir > /dev/null 2>&1; then
    REMOTE=$(git config --get remote.origin.url || echo "none")
    if [ "$REMOTE" != "none" ]; then
        echo "  Remote: $REMOTE"

        # Check if .github/README.md exists in remote
        if git ls-remote --exit-code --heads origin main >/dev/null 2>&1; then
            if git ls-tree -r origin/main --name-only | grep -q "^.github/README.md$"; then
                echo -e "${GREEN}✓ PASS${NC}: .github/README.md exists on remote"
            else
                echo -e "${YELLOW}⚠ WARN${NC}: .github/README.md NOT on remote (needs push)"
            fi
        else
            echo -e "${YELLOW}⚠ WARN${NC}: Cannot access remote branch"
        fi
    else
        echo -e "${YELLOW}⚠ WARN${NC}: No remote configured"
    fi
fi

# Test 8: Check security documentation exists
echo ""
echo "Test 8: Security documentation check"
if [ -f "SECURITY_SETUP.md" ]; then
    echo -e "${GREEN}✓ PASS${NC}: SECURITY_SETUP.md exists"
else
    echo -e "${YELLOW}⚠ WARN${NC}: SECURITY_SETUP.md not found"
fi

if [ -f "SECURITY_QUICK_REFERENCE.md" ]; then
    echo -e "${GREEN}✓ PASS${NC}: SECURITY_QUICK_REFERENCE.md exists"
else
    echo -e "${YELLOW}⚠ WARN${NC}: SECURITY_QUICK_REFERENCE.md not found"
fi

# Test 9: Check workflow files
echo ""
echo "Test 9: Workflow files check"
for workflow in .github/workflows/*.yml; do
    if [ -f "$workflow" ]; then
        FILENAME=$(basename "$workflow")
        if git ls-files --error-unmatch "$workflow" >/dev/null 2>&1; then
            echo -e "${GREEN}✓ PASS${NC}: $FILENAME is tracked by git"
        else
            echo -e "${YELLOW}⚠ WARN${NC}: $FILENAME is NOT tracked by git"
        fi
    fi
done

# Test 10: Check backend secrets integration
echo ""
echo "Test 10: Backend secrets integration check"
if [ -f "02-src/backend/services/backend/config/secrets.js" ]; then
    echo -e "${GREEN}✓ PASS${NC}: secrets.js exists"
else
    echo -e "${YELLOW}⚠ WARN${NC}: secrets.js not found"
fi

# Summary
echo ""
echo "=================================="
echo "📊 Test Summary"
echo "=================================="

UNCOMMITTED=$(git status --porcelain 2>/dev/null | wc -l)
if [ $UNCOMMITTED -gt 0 ]; then
    echo -e "${YELLOW}⚠ ACTION REQUIRED${NC}: $UNCOMMITTED file(s) need to be committed and pushed"
    echo ""
    echo "To fix:"
    echo "  git add .github/README.md .github/workflows/ 02-src/backend/ SECURITY_*.md"
    echo "  git commit -m 'feat: add GitHub Actions workflows and Secret Manager integration'"
    echo "  git push origin main"
else
    echo -e "${GREEN}✓ ALL GOOD${NC}: All files are committed"
fi

echo ""
echo "GitHub repository: https://github.com/jeremylongshore/DiagnosticPro"
echo "Expected README location: https://github.com/jeremylongshore/DiagnosticPro/tree/main/.github#readme"
