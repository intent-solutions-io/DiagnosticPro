#!/usr/bin/env python3
"""
DiagnosticPro Offline Report Renderer
Reads JSON diagnostic data and renders to Markdown (and optionally PDF via pandoc).
Merges with 14-point template while respecting length and truncation rules.
"""

import json
import sys
from pathlib import Path
from datetime import datetime

def truncate_list(items: list, max_items: int, label: str) -> tuple[list, str]:
    """Truncate list to max_items and return remainder note."""
    if len(items) <= max_items:
        return items, ""

    remaining = len(items) - max_items
    note = f"*+{remaining} more {label} omitted for brevity*"
    return items[:max_items], note

def render_markdown(data: dict) -> str:
    """Render diagnostic JSON to Markdown using 14-point framework."""

    lines = []

    # Header
    lines.append("# DiagnosticPro Diagnostic Report")
    lines.append("")
    generated_at = data.get("meta", {}).get("generated_at_iso", datetime.utcnow().isoformat() + "Z")
    lines.append(f"**Generated:** {generated_at}")
    lines.append(f"**Submission ID:** {data.get('submissionId', 'UNKNOWN')}")
    lines.append("")
    lines.append("---")
    lines.append("")

    # Customer & Equipment Snapshot
    lines.append("## Customer & Equipment Information")
    lines.append("")
    customer = data.get("customer", {})
    lines.append(f"**Customer:** {customer.get('name', 'N/A')} ({customer.get('email', 'N/A')})")

    equipment = data.get("equipment", {})
    eq_parts = []
    if equipment.get("year"): eq_parts.append(equipment["year"])
    if equipment.get("make"): eq_parts.append(equipment["make"])
    if equipment.get("model"): eq_parts.append(equipment["model"])
    eq_str = " ".join(eq_parts) if eq_parts else f"{equipment.get('type', 'Unknown')} equipment"
    lines.append(f"**Equipment:** {eq_str}")

    lines.append("")
    lines.append(f"**Reported Symptoms:** {data.get('symptoms', 'None provided')}")
    lines.append("")

    codes = data.get("codes", [])
    if codes:
        lines.append(f"**Diagnostic Codes:** {', '.join(codes)}")
    else:
        lines.append("**Diagnostic Codes:** None reported")
    lines.append("")
    lines.append("---")
    lines.append("")

    # 1. PRIMARY DIAGNOSIS
    lines.append("## 1. PRIMARY DIAGNOSIS")
    lines.append("")
    lines.append("**Most Likely Root Cause:**")
    lines.append("")
    lines.append(data.get("most_likely_cause", "Analysis incomplete"))
    lines.append("")

    confidence = data.get("confidence", {})
    score = confidence.get("score_pct", 0)
    threshold = confidence.get("threshold_pct", 85)
    assessment = confidence.get("assessment", "No assessment provided")

    lines.append(f"**Confidence:** {score}% (Target: {threshold}%)")
    lines.append(f"*{assessment}*")
    lines.append("")

    uplift_reqs = data.get("confidence_uplift_requirements", [])
    if uplift_reqs and score < threshold:
        lines.append("### To Raise Confidence:")
        lines.append("")
        uplift_display, uplift_note = truncate_list(uplift_reqs, 8, "requirements")
        for req in uplift_display:
            lines.append(f"- {req}")
        if uplift_note:
            lines.append("")
            lines.append(uplift_note)
        lines.append("")

    lines.append("---")
    lines.append("")

    # 2. DIFFERENTIAL DIAGNOSIS
    lines.append("## 2. DIFFERENTIAL DIAGNOSIS")
    lines.append("")
    lines.append("**Alternative Causes Ranked by Likelihood:**")
    lines.append("")

    hypotheses = data.get("root_cause_hypotheses", [])
    hypotheses_display, hyp_note = truncate_list(hypotheses, 5, "hypotheses")

    for idx, hyp in enumerate(hypotheses_display, 1):
        likelihood = hyp.get("likelihood", "unknown").upper()
        lines.append(f"**{idx}. {hyp.get('hypothesis', 'Unknown')}** — *{likelihood} likelihood*")
        lines.append(f"   Evidence: {hyp.get('evidence', 'No evidence provided')}")
        lines.append("")

    if hyp_note:
        lines.append(hyp_note)
        lines.append("")

    lines.append("---")
    lines.append("")

    # 3. DIAGNOSTIC VERIFICATION
    lines.append("## 3. DIAGNOSTIC VERIFICATION")
    lines.append("")
    lines.append("**Required Tests & Procedures:**")
    lines.append("")

    actions = data.get("recommended_actions", [])
    actions_display, actions_note = truncate_list(actions, 8, "actions")

    for idx, action in enumerate(actions_display, 1):
        lines.append(f"{idx}. **{action.get('step', 'Unknown step')}**")
        lines.append(f"   *Why:* {action.get('why', 'No reason provided')}")
        lines.append("")

    if actions_note:
        lines.append(actions_note)
        lines.append("")

    lines.append("---")
    lines.append("")

    # 4. SHOP INTERROGATION
    lines.append("## 4. SHOP INTERROGATION")
    lines.append("")
    lines.append("**Critical Questions to Ask Your Mechanic:**")
    lines.append("")
    lines.append("1. What exact diagnostic tests did you perform to isolate this issue?")
    lines.append("2. Can you show me the freeze-frame data or live sensor readings?")
    lines.append("3. What are the specific test values that confirm your diagnosis?")
    lines.append("4. Have you checked TSBs and known failure patterns for this symptom?")
    lines.append("5. What's your confidence level, and what would increase it to 100%?")
    lines.append("")
    lines.append("---")
    lines.append("")

    # 5. CONVERSATION SCRIPTING
    cost_low = data.get("estimated_cost_range_usd", {}).get("low", 0)
    cost_high = data.get("estimated_cost_range_usd", {}).get("high", 0)

    lines.append("## 5. CONVERSATION SCRIPTING")
    lines.append("")
    lines.append("**What to Say to Protect Yourself:**")
    lines.append("")
    lines.append(f"- \"Before authorizing any repair over ${cost_low}, I need to see the diagnostic data that confirms this issue.\"")
    lines.append("- \"Can you explain why [alternative hypothesis] isn't the cause?\"")
    lines.append(f"- \"I'd like a second opinion before proceeding with repairs exceeding ${cost_high}.\"")
    lines.append("- \"Show me the exact test results that rule out warranty coverage or TSB applicability.\"")
    lines.append("")
    lines.append("---")
    lines.append("")

    # 6. COST BREAKDOWN
    lines.append("## 6. COST BREAKDOWN")
    lines.append("")
    lines.append("**Fair Price Expectations:**")
    lines.append("")
    lines.append(f"- **Parts & Labor Range:** ${cost_low} – ${cost_high} USD")
    time_hours = data.get("estimated_time_hours", 0)
    lines.append(f"- **Estimated Time:** {time_hours} hours")
    red_flag_cost = int(cost_high * 1.5)
    lines.append(f"- **Red Flags:** Any quote exceeding ${red_flag_cost} without additional failures found")
    lines.append("")
    lines.append("---")
    lines.append("")

    # 7. RIPOFF DETECTION
    lines.append("## 7. RIPOFF DETECTION")
    lines.append("")
    lines.append("**Watch Out For:**")
    lines.append("")

    safety_notes = data.get("safety_notes", [])
    safety_display, safety_note = truncate_list(safety_notes, 6, "safety notes")

    for note in safety_display:
        lines.append(f"- {note}")

    if safety_note:
        lines.append("")
        lines.append(safety_note)

    lines.append("")
    lines.append("**Common Scams:**")
    lines.append("")
    lines.append("- Replacing parts \"just in case\" without diagnostic confirmation")
    lines.append("- Charging diagnostic fees without isolating root cause")
    lines.append("- Recommending unnecessary preventive maintenance during urgent repairs")
    lines.append("")
    lines.append("---")
    lines.append("")

    # 8. AUTHORIZATION GUIDE
    lines.append("## 8. AUTHORIZATION GUIDE")
    lines.append("")
    lines.append("**Decision Matrix:**")
    lines.append("")
    lines.append("| Scenario | Your Response |")
    lines.append("|----------|---------------|")
    lines.append("| Diagnosis matches this report + cost within range | ✅ **APPROVE** with confidence |")
    lines.append("| Diagnosis differs but mechanic shows test data | ⚠️ **REQUEST EXPLANATION** before proceeding |")
    threshold_cost = int(cost_high * 1.3)
    lines.append(f"| Quote exceeds ${threshold_cost} | 🔴 **SECOND OPINION REQUIRED** |")
    lines.append("| Shop refuses to show diagnostic data | 🚫 **REJECT & LEAVE** immediately |")
    lines.append("")
    lines.append("---")
    lines.append("")

    # 9. TECHNICAL EDUCATION
    lines.append("## 9. TECHNICAL EDUCATION")
    lines.append("")
    lines.append("**How This System Works & Why It Fails:**")
    lines.append("")
    lines.append(data.get("symptoms", "Symptom information not provided"))
    lines.append("")
    lines.append("**Failure Mechanisms:**")
    lines.append("")
    for hyp in hypotheses_display:
        lines.append(f"- {hyp.get('hypothesis', 'Unknown')}: {hyp.get('evidence', 'No evidence')}")
    lines.append("")
    lines.append("---")
    lines.append("")

    # 10. OEM PARTS STRATEGY
    lines.append("## 10. OEM PARTS STRATEGY")
    lines.append("")
    lines.append("**Recommended Parts & Tools:**")
    lines.append("")

    tools_parts = data.get("tools_parts", [])
    tools_display, tools_note = truncate_list(tools_parts, 12, "tools/parts")

    for tool in tools_display:
        lines.append(f"- {tool}")

    if tools_note:
        lines.append("")
        lines.append(tools_note)

    lines.append("")
    lines.append("### Warranty & Technical Service Bulletins:")
    lines.append("")

    warranty_refs = data.get("warranty_or_tsb_refs", [])
    if warranty_refs:
        warranty_display, warranty_note = truncate_list(warranty_refs, 8, "references")
        for ref in warranty_display:
            lines.append(f"- {ref}")
        if warranty_note:
            lines.append("")
            lines.append(warranty_note)
    else:
        lines.append("- No active TSBs or warranty coverage identified for this symptom pattern")

    lines.append("")
    lines.append("---")
    lines.append("")

    # 11. NEGOTIATION TACTICS
    lines.append("## 11. NEGOTIATION TACTICS")
    lines.append("")
    lines.append("**Professional Price Discussion:**")
    lines.append("")
    lines.append(f"1. **Establish Baseline:** \"Your quote of $X is above the industry average of ${cost_high} for this repair.\"")
    lines.append("2. **Request Itemization:** \"Can you break down parts cost vs labor separately?\"")
    lines.append("3. **Leverage Competition:** \"I have quotes from two other shops—can you match or explain the difference?\"")
    lines.append("4. **Time-Based Discounts:** \"If I authorize this today, can you reduce the rate?\"")
    lines.append("")
    lines.append("---")
    lines.append("")

    # 12. LIKELY CAUSES (RANKED BY CONFIDENCE)
    lines.append("## 12. LIKELY CAUSES (RANKED BY CONFIDENCE)")
    lines.append("")
    for idx, hyp in enumerate(hypotheses_display, 1):
        likelihood = hyp.get("likelihood", "unknown").upper()
        lines.append(f"{idx}. **{hyp.get('hypothesis', 'Unknown')}** — {likelihood} ({hyp.get('evidence', 'No evidence')})")
    lines.append("")
    lines.append("---")
    lines.append("")

    # 13. RECOMMENDATIONS
    lines.append("## 13. RECOMMENDATIONS")
    lines.append("")
    lines.append("**Immediate Actions:**")
    lines.append("")
    for action in actions_display:
        lines.append(f"- {action.get('step', 'Unknown step')}")
    lines.append("")
    lines.append("**Future Preventive Maintenance:**")
    lines.append("")
    lines.append("- Monitor related systems for early warning signs")
    lines.append("- Document all repairs for pattern analysis")
    lines.append("- Follow OEM maintenance intervals strictly")
    lines.append("")
    lines.append("---")
    lines.append("")

    # 14. SOURCE VERIFICATION
    lines.append("## 14. SOURCE VERIFICATION")
    lines.append("")
    lines.append("**Authoritative References:**")
    lines.append("")

    if warranty_refs:
        for ref in warranty_display:
            lines.append(f"- {ref}")
    else:
        lines.append("- OEM Service Manual (specific VIN lookup required)")
        lines.append("- NHTSA Complaints Database")
        lines.append("- Technical Service Bulletin Archives")

    lines.append("")
    lines.append("---")
    lines.append("")

    # DISCLAIMERS
    lines.append("## DISCLAIMERS")
    lines.append("")
    disclaimers = data.get("disclaimers", [])
    for disclaimer in disclaimers[:10]:  # Max 10
        lines.append(f"- {disclaimer}")

    if len(disclaimers) > 10:
        lines.append("")
        lines.append(f"*+{len(disclaimers) - 10} more disclaimers omitted*")

    lines.append("")
    lines.append("---")
    lines.append("")

    # Footer
    readiness = data.get("customer_readiness_check", {})
    verdict = readiness.get("verdict", "unknown")
    reason = readiness.get("short_reason", "No reason provided")

    lines.append(f"**Customer Readiness Status:** {verdict}")
    lines.append(f"*Reason:* {reason}")
    lines.append("")
    lines.append("---")
    lines.append("")

    submission_id = data.get("submissionId", "UNKNOWN")
    lines.append(f"*Report generated by DiagnosticPro AI | Submission ID: {submission_id} | {generated_at}*")

    return "\n".join(lines)

def main():
    """Read JSON input, render to Markdown, optionally convert to PDF."""
    if len(sys.argv) < 2:
        print("Usage: render_from_json.py <input.json> [output_base_name]", file=sys.stderr)
        print("  Output will be: <output_base_name>.md (and .pdf if pandoc available)", file=sys.stderr)
        sys.exit(1)

    input_path = Path(sys.argv[1])
    if not input_path.exists():
        print(f"Error: Input file not found: {input_path}", file=sys.stderr)
        sys.exit(1)

    # Determine output base name
    if len(sys.argv) > 2:
        output_base = sys.argv[2]
    else:
        output_base = input_path.stem

    # Read JSON
    with open(input_path, 'r') as f:
        data = json.load(f)

    # Render Markdown
    markdown = render_markdown(data)

    # Write Markdown
    output_md = Path("docs/out") / f"{output_base}.md"
    output_md.parent.mkdir(parents=True, exist_ok=True)

    with open(output_md, 'w') as f:
        f.write(markdown)

    print(f"✅ Rendered Markdown: {output_md}")

    # Calculate stats
    char_count = len(markdown)
    estimated_pages = char_count / 3000

    print(f"📊 Stats: {char_count} chars, ~{estimated_pages:.1f} pages")

    if estimated_pages > 6:
        print("⚠️  WARNING: Estimated pages exceed 6-page hard cap!")

    # Optionally render PDF via pandoc
    try:
        import subprocess
        output_pdf = Path("docs/out") / f"{output_base}.pdf"
        subprocess.run([
            "pandoc",
            str(output_md),
            "-o", str(output_pdf),
            "--pdf-engine=xelatex",
            "-V", "geometry:margin=0.75in"
        ], check=True, capture_output=True)
        print(f"✅ Rendered PDF: {output_pdf}")
    except (subprocess.CalledProcessError, FileNotFoundError):
        print("ℹ️  Pandoc not available; skipping PDF generation")

if __name__ == "__main__":
    main()
