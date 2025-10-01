#!/bin/bash
# DiagnosticPro 14-Section PDF Generator - Taskwarrior Setup
# Creates all tasks with proper dependencies for systematic development

echo "🚀 Setting up DiagnosticPro PDF Generator Taskwarrior Project..."

# Phase 1 - Setup Tasks
echo "📋 Creating Phase 1 - Setup Tasks..."
task add project:diagnosticpro +SETUP priority:H "Verify environment and dependencies"
task add project:diagnosticpro +SETUP priority:H "Install and verify PDFKit" depends:1
task add project:diagnosticpro +SETUP priority:H "Verify IBM Plex Mono fonts in repo" depends:2

# Phase 2 - Build Tasks (14 Sections with Dependencies)
echo "📋 Creating Phase 2 - Build Tasks (14 Sections)..."
task add project:diagnosticpro +PDF section:1 priority:M "Implement 🎯 PRIMARY DIAGNOSIS" depends:3
task add project:diagnosticpro +PDF section:2 priority:M "Implement 🔍 DIFFERENTIAL DIAGNOSIS" depends:4
task add project:diagnosticpro +PDF section:3 priority:M "Implement ✅ DIAGNOSTIC VERIFICATION" depends:5
task add project:diagnosticpro +PDF section:4 priority:M "Implement ❓ SHOP INTERROGATION" depends:6
task add project:diagnosticpro +PDF section:5 priority:M "Implement 🗣️ CONVERSATION SCRIPTING" depends:7
task add project:diagnosticpro +PDF section:6 priority:M "Implement 💸 COST BREAKDOWN" depends:8
task add project:diagnosticpro +PDF section:7 priority:M "Implement 🚩 RIPOFF DETECTION" depends:9
task add project:diagnosticpro +PDF section:8 priority:M "Implement ⚖️ AUTHORIZATION GUIDE" depends:10
task add project:diagnosticpro +PDF section:9 priority:M "Implement 🔧 TECHNICAL EDUCATION" depends:11
task add project:diagnosticpro +PDF section:10 priority:M "Implement 📦 OEM PARTS STRATEGY" depends:12
task add project:diagnosticpro +PDF section:11 priority:M "Implement 💬 NEGOTIATION TACTICS" depends:13
task add project:diagnosticpro +PDF section:12 priority:M "Implement 🔬 LIKELY CAUSES (RANKED)" depends:14
task add project:diagnosticpro +PDF section:13 priority:M "Implement 📊 RECOMMENDATIONS" depends:15
task add project:diagnosticpro +PDF section:14 priority:M "Implement 🔗 SOURCE VERIFICATION" depends:16

# Phase 3 - Verify Tasks
echo "📋 Creating Phase 3 - Verification Tasks..."
task add project:diagnosticpro +VERIFY priority:H "End-to-end test with sample submission" depends:17
task add project:diagnosticpro +VERIFY priority:H "Verify header/footer with page numbers" depends:18
task add project:diagnosticpro +VERIFY priority:H "Confirm contact info block at end" depends:19
task add project:diagnosticpro +VERIFY priority:H "Generate final PDF and verify all sections" depends:20

# Project Summary
echo ""
echo "✅ Taskwarrior Project Setup Complete!"
echo ""
echo "📊 Project Summary:"
task project:diagnosticpro summary
echo ""
echo "📋 Next Steps:"
echo "1. task project:diagnosticpro list     # View all tasks"
echo "2. task 1 start                      # Start first task"
echo "3. task burndown.weekly project:diagnosticpro  # View progress"
echo ""
echo "🎯 Ready to begin Phase 1 - Setup!"