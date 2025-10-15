## Layout Overview
- PDF size: US Letter, margin 54 pt.
- Fonts: IBM Plex Mono Regular/Bold (existing assets).
- Typical length: 2–4 pages. Hard cap: 6 pages (truncate with “+N more”).

## Section Mapping
1. **Header**
   - Title: “DiagnosticPro Diagnostic Report”.
   - Generated date from `meta.generated_at_iso` (fallback: current ISO).
   - Submission ID rendered under title.

2. **Customer & Equipment Snapshot**
   - Customer email+name.
   - Equipment type/make/model/year.
   - Reported symptoms (wrap at 80 chars).
   - Reported codes (comma separated).

3. **Most Likely Cause Block**
   - Heading: “Most Likely Cause”.
   - Body: `most_likely_cause`.
   - Confidence line immediately after:  
     `Confidence: {{confidence.score_pct}}% (Target {{confidence.threshold_pct}}%) — {{confidence.assessment}}`
   - If `confidence.score_pct < confidence.threshold_pct`: render boxed list titled “To raise confidence” using `confidence_uplift_requirements` (max 8 bullets). Append “+N more” when truncated.

4. **Root Cause Hypotheses**
   - Table-style bullets: “• {{hypothesis}} — {{likelihood}}” on first line, second line indented: “Evidence: {{evidence}}”.

5. **Recommended Actions**
   - Numbered list. Each item: `{{step}}` followed by italicised “Why: {{why}}”.
   - Truncate beyond 8 with “+N more”.

6. **Tools & Parts**
   - Bullet list from `tools_parts` (limit 12; add “+N more” when truncated).

7. **Safety Notes**
   - Highlighted box titled “Safety First”.
   - Bulleted `safety_notes` (limit 6). If empty, insert “Verify all electrical/fuel safety procedures before servicing.”.

8. **Estimates & References**
   - “Estimated Cost Range”: `$low – $high USD`.
   - “Estimated Time”: `{{estimated_time_hours}} hours`.
   - “Warranty / TSB References”: bullet list (limit 8, note “+N more” if truncated).

9. **Disclaimers**
   - Bulleted `disclaimers` (show all; truncate with “+N more” as needed).

10. **Footer Ribbon**
    - Full-width grey bar: “Customer-readiness: {{customer_readiness_check.verdict}} — {{customer_readiness_check.short_reason}}”.

## Pagination Strategy
- Use flowing content with manual `doc.moveDown()`; insert `doc.addPage()` when vertical space < 120pt before new major section.
- Calculate remaining space using `doc.y`.
- Lists trimmed to keep total characters ≤ 12,000.
- Append “+N more” only once per section when truncation occurs.

## Logging & Telemetry
- After rendering, log:
  - JSON length.
  - Estimated pages (`Math.ceil(textLength / 3000)`).
  - Actual pages from PDF buffer (`doc.bufferedPageRange().count`).

## Overflow Handling
- If estimated pages > 6: abort before rendering and surface validation error.
- For any list or string exceeding length caps, slice to the allowed length and append ellipsis.
