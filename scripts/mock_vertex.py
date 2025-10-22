#!/usr/bin/env python3
"""
DiagnosticPro Offline Mock Vertex AI Engine
Generates schema-valid JSON responses without any API calls.
Deterministic output for testing and validation.
"""

import json
import sys
from datetime import datetime
from pathlib import Path

def generate_mock_response(input_data: dict) -> dict:
    """Generate a complete, schema-valid diagnostic report."""

    submission_id = input_data.get("submissionId", "MOCK-0001")
    equipment = input_data.get("equipment", {})
    symptoms = input_data.get("symptoms", "No symptoms provided")
    codes = input_data.get("codes", [])

    # Determine confidence based on input quality
    has_codes = len(codes) > 0
    has_detailed_symptoms = len(symptoms) > 100
    confidence_score = 88 if (has_codes and has_detailed_symptoms) else 72

    # Build root cause hypotheses
    hypotheses = [
        {
            "hypothesis": "Ignition coil failure on cylinder 1",
            "evidence": "P0301 code indicates consistent misfire pattern; common failure mode for high-mileage engines",
            "likelihood": "high"
        },
        {
            "hypothesis": "Fuel injector clog or electrical fault",
            "evidence": "Could explain single-cylinder misfire if injector stuck closed or driver circuit failed",
            "likelihood": "medium"
        },
        {
            "hypothesis": "Compression loss due to valve or ring failure",
            "evidence": "Would show consistent misfire but typically accompanied by reduced power and smoke",
            "likelihood": "low"
        }
    ]

    # Build recommended actions
    actions = [
        {
            "step": "Swap ignition coil from cylinder 1 to another cylinder",
            "why": "If misfire follows the coil, confirms coil failure; cheapest diagnostic step"
        },
        {
            "step": "Check fuel injector resistance and spray pattern",
            "why": "Rules out fuel delivery issue before replacing ignition components"
        },
        {
            "step": "Perform compression test on cylinder 1",
            "why": "Establishes baseline compression to rule out mechanical failure"
        },
        {
            "step": "Scan for pending codes and freeze-frame data",
            "why": "Captures engine conditions when misfire occurred for better diagnosis"
        }
    ]

    # Tools and parts
    tools_parts = [
        "OBD-II scanner with live data capability",
        "Ignition coil (OEM or equivalent)",
        "Spark plug socket and torque wrench",
        "Compression tester kit",
        "Fuel pressure gauge",
        "Multimeter for resistance testing"
    ]

    # Safety notes
    safety_notes = [
        "Disconnect battery negative terminal before working on ignition system",
        "Allow engine to cool before removing ignition components",
        "Wear eye protection when releasing fuel system pressure",
        "Use proper jack stands if raising vehicle; never rely on jack alone"
    ]

    # Estimate costs
    cost_range = {"low": 120, "high": 450}
    time_hours = 2.5

    # Warranty/TSB references
    warranty_refs = [
        "Ford TSB 08-7-6: Ignition coil failures on 5.4L engines (2004-2008)",
        "Check warranty coverage if under 60,000 miles (powertrain)",
        "Motorcraft DG508 coil is OEM replacement part"
    ]

    # Disclaimers
    disclaimers = [
        "This analysis is based on provided symptoms and codes; physical inspection may reveal additional issues",
        "Cost estimates are regional averages; actual prices vary by location and shop labor rates",
        "Always request written estimates before authorizing repairs",
        "Second opinion recommended for repairs exceeding $500"
    ]

    # Confidence uplift requirements (if below threshold)
    uplift_reqs = []
    if confidence_score < 85:
        uplift_reqs = [
            "Freeze-frame data for P0301 showing engine RPM, load, and coolant temp",
            "Ignition coil swap test results (does misfire follow the coil?)",
            "Fuel trim data for all cylinders to rule out fuel delivery issues",
            "Compression test results for cylinder 1 compared to other cylinders",
            "Exact VIN and mileage for TSB applicability check"
        ]

    # Customer readiness check
    readiness_verdict = "ready_for_customer" if confidence_score >= 75 else "needs_revision"
    readiness_reason = f"Confidence at {confidence_score}%, actionable steps provided, safety covered, cost estimates present" if readiness_verdict == "ready_for_customer" else "Insufficient diagnostic data; need freeze-frame and coil swap results"

    # Build complete response
    response = {
        "submissionId": submission_id,
        "customer": {
            "email": input_data.get("customer", {}).get("email", "customer@example.com"),
            "name": input_data.get("customer", {}).get("name", None)
        },
        "equipment": {
            "type": equipment.get("type", "vehicle"),
            "make": equipment.get("make", None),
            "model": equipment.get("model", None),
            "year": equipment.get("year", None)
        },
        "symptoms": symptoms,
        "codes": codes if codes else [],
        "root_cause_hypotheses": hypotheses[:5],  # Max 5
        "most_likely_cause": "Ignition coil failure on cylinder 1, likely due to heat stress and high mileage. P0301 code confirms consistent misfire pattern.",
        "recommended_actions": actions[:8],  # Max 8
        "tools_parts": tools_parts[:12],  # Max 12
        "safety_notes": safety_notes[:6],  # Max 6
        "estimated_cost_range_usd": cost_range,
        "estimated_time_hours": time_hours,
        "warranty_or_tsb_refs": warranty_refs[:8],  # Max 8
        "disclaimers": disclaimers[:10],  # Max 10
        "confidence": {
            "score_pct": confidence_score,
            "threshold_pct": input_data.get("confidence_threshold_pct", 85),
            "assessment": f"Moderate confidence based on code pattern; coil swap test would increase to 95%+ certainty."
        },
        "confidence_uplift_requirements": uplift_reqs[:8],  # Max 8
        "customer_readiness_check": {
            "verdict": readiness_verdict,
            "short_reason": readiness_reason[:220]  # Max 220 chars
        },
        "meta": {
            "model": "mock-vertex-offline",
            "version": "1.0.0",
            "generated_at_iso": datetime.utcnow().isoformat() + "Z"
        }
    }

    return response

def main():
    """Read input JSON from stdin or file, generate mock response, output to stdout."""
    if len(sys.argv) > 1:
        input_path = Path(sys.argv[1])
        if not input_path.exists():
            print(f"Error: Input file not found: {input_path}", file=sys.stderr)
            sys.exit(1)
        with open(input_path, 'r') as f:
            input_data = json.load(f)
    else:
        # Read from stdin
        input_data = json.load(sys.stdin)

    # Generate mock response
    response = generate_mock_response(input_data)

    # Output as JSON (pretty-printed for readability)
    print(json.dumps(response, indent=2, ensure_ascii=False))

if __name__ == "__main__":
    main()
