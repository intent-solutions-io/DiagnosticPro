#!/usr/bin/env bash
set -euo pipefail
echo "Setting up Taskwarrior tasks for DiagnosticPro PDF Generator..."

task add project:diagnosticpro +SETUP priority:H "Verify environment (Node, pdfkit, fonts)"
task add project:diagnosticpro +SETUP priority:H "Fix variable naming: equipmentType vs equipment_type"
task add project:diagnosticpro +SETUP priority:H "Convert CommonJS to ES6 modules for verification"

# 14 build tasks
task add project:diagnosticpro +BUILD priority:M "Implement 🎯 PRIMARY DIAGNOSIS"
task add project:diagnosticpro +BUILD priority:M "Implement 🔍 DIFFERENTIAL DIAGNOSIS"
task add project:diagnosticpro +BUILD priority:M "Implement ✅ DIAGNOSTIC VERIFICATION"
task add project:diagnosticpro +BUILD priority:M "Implement ❓ SHOP INTERROGATION"
task add project:diagnosticpro +BUILD priority:M "Implement 🗣️ CONVERSATION SCRIPTING"
task add project:diagnosticpro +BUILD priority:M "Implement 💸 COST BREAKDOWN"
task add project:diagnosticpro +BUILD priority:M "Implement 🚩 RIPOFF DETECTION"
task add project:diagnosticpro +BUILD priority:M "Implement ⚖️ AUTHORIZATION GUIDE"
task add project:diagnosticpro +BUILD priority:M "Implement 🔧 TECHNICAL EDUCATION"
task add project:diagnosticpro +BUILD priority:M "Implement 📦 OEM PARTS STRATEGY"
task add project:diagnosticpro +BUILD priority:M "Implement 💬 NEGOTIATION TACTICS"
task add project:diagnosticpro +BUILD priority:M "Implement 🔬 LIKELY CAUSES (RANKED)"
task add project:diagnosticpro +BUILD priority:M "Implement 📊 RECOMMENDATIONS"
task add project:diagnosticpro +BUILD priority:M "Implement 🔗 SOURCE VERIFICATION"

# verify tasks
task add project:diagnosticpro +VERIFY priority:H "Run verification script and confirm report.pdf"
task add project:diagnosticpro +VERIFY priority:H "Check header/footer/disclaimer/contact info"

echo "✅ Taskwarrior tasks created. Use: task project:diagnosticpro list"
