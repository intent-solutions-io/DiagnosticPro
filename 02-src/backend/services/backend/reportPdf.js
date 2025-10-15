// backend/services/reportPdf.js
const PDFDocument = require("pdfkit");
const fs = require("fs");

/**
 * Generate DiagnosticPro PDF (IBM Plex Mono, headers/footers, 14 sections, disclaimer)
 * @param {object} submission  // your existing submission object
 * @param {object} analysis    // optional AI-filled content; falls back to template bullets
 * @param {string} filePath    // output path (e.g., "/tmp/report.pdf")
 */
function generateDiagnosticProPDF(submission, analysis = {}, filePath = "/tmp/report.pdf") {
  const doc = new PDFDocument({
    margin: 54,
    size: "LETTER",
    bufferPages: true
  });
  const stream = fs.createWriteStream(filePath);
  doc.pipe(stream);

  // ---------- REGISTER MONOSPACE FONTS ----------
  // Use relative paths from current script location
  const path = require('path');
  const fontDir = path.join(__dirname, 'fonts');
  doc.registerFont("IBMMono", path.join(fontDir, "IBMPlexMono-Regular.ttf"));
  doc.registerFont("IBMMonoBold", path.join(fontDir, "IBMPlexMono-Bold.ttf"));
  doc.font("IBMMono");

  // ---------- HELPERS ----------
  const today = new Date().toLocaleDateString();

  const h1 = (t) => {
    doc.addPage();
    doc.font("IBMMonoBold").fontSize(18).fillColor("black").text(t, { align: "center" });
    doc.moveDown(1);
    doc.font("IBMMono");
  };
  const h2 = (t) => {
    doc.moveDown(0.6);
    doc.font("IBMMonoBold").fontSize(14).text(t, { underline: true });
    doc.moveDown(0.3);
    doc.font("IBMMono");
  };
  const p  = (t) => { if (t) doc.fontSize(11).fillColor("black").text(t, { align: "left", paragraphGap: 8 }); };
  const bullets = (arr) => { if (arr?.length) doc.fontSize(11).list(arr, { bulletRadius: 2 }).moveDown(0.4); };
  const ensureArray = (v) => Array.isArray(v) ? v : (v ? [String(v)] : []);

  // ---------- HEADER + FOOTER STAMP ----------
  const addHeaderFooter = () => {
    const range = doc.bufferedPageRange(); // { start, count }
    for (let i = range.start; i < range.start + range.count; i++) {
      doc.switchToPage(i);
      const prevX = doc.x;
      const prevY = doc.y;
      doc.save();

      // header
      doc.font("IBMMono").fontSize(9).fillColor("gray")
        .text("DiagnosticPro — Proprietary AI Diagnostic Report", 54, 30, { align: "center" });

      // footer disclaimer (top line)
      doc.font("IBMMono").fontSize(7).fillColor("gray")
        .text(
          "Disclaimer: AI-generated for informational purposes only. Not a substitute for licensed professional repair advice.",
          54,
          doc.page.height - 50,
          { width: doc.page.width - 108, align: "left" }
        );

      // footer page number (bottom line)
      const pageNum = i + 1;
      doc.font("IBMMono").fontSize(9).fillColor("gray")
        .text(`Page ${pageNum}`, 54, doc.page.height - 30, { align: "right" });

      doc.restore();
      doc.x = prevX;
      doc.y = prevY;
    }
  };

  // ---------- TITLE PAGE ----------
  doc.font("IBMMonoBold").fontSize(22).text("DiagnosticPro AI Analysis Report", { align: "center" });
  doc.moveDown(2);
  doc.font("IBMMono").fontSize(14).text(`Date: ${today}`, { align: "center" });
  doc.moveDown(4);
  doc.fontSize(11).text(
    "Proprietary 14-Section Analysis Framework v1.3\n\n" +
    "This report is generated using DiagnosticPro's AI system. It equips customers with professional-grade insights, " +
    "shop interrogation tactics, and fraud-protection strategies. The structure below is preserved verbatim; formatting only.",
    { align: "center", width: 430 }
  );

  // ---------- VEHICLE + CUSTOMER INFO ----------
  h1("Submission Summary");
  h2("Vehicle Information");
  bullets([
    `Make: ${submission?.make ?? "N/A"}`,
    `Model: ${submission?.model ?? "N/A"}`,
    `Year: ${submission?.year ?? "N/A"}`,
    `Equipment Type: ${submission?.equipment_type ?? "N/A"}`,
    `Serial Number: ${submission?.serial_number ?? "N/A"}`,
    `Mileage/Hours: ${submission?.mileage_hours ?? "N/A"}`
  ]);

  h2("Customer Information");
  bullets([
    `Name: ${submission?.full_name ?? "N/A"}`,
    `Email: ${submission?.email ?? "N/A"}`,
    `Phone: ${submission?.phone ?? "N/A"}`
  ]);

  h2("Problem Description");
  p(submission?.problem_description || "No description provided.");

  h2("Reported Symptoms");
  if (submission?.symptoms?.length) bullets(submission.symptoms);
  else p("No symptoms listed.");

  h2("Error Messages / Codes");
  if (submission?.error_codes?.length) bullets(submission.error_codes);
  else p("No error codes provided.");

  // ---------- 14-SECTION FRAMEWORK ----------
  h1("Comprehensive AI Diagnostic Analysis");

  // 1. PRIMARY DIAGNOSIS
  h2("1. PRIMARY DIAGNOSIS");
  if (analysis.primaryDiagnosis) {
    p(analysis.primaryDiagnosis);
  } else {
    bullets([
      "Root cause with confidence percentage.",
      "Reference specific error codes if provided.",
      "Component failure analysis.",
      "Age/mileage considerations."
    ]);
  }

  // 2. DIFFERENTIAL DIAGNOSIS
  h2("2. DIFFERENTIAL DIAGNOSIS");
  const diffDiag = ensureArray(analysis.differentialDiagnosis);
  if (diffDiag.length) {
    bullets(diffDiag);
  } else {
    bullets([
      "Alternative causes ranked by likelihood.",
      "Why each cause is ruled in or out.",
      "Equipment-specific failure patterns."
    ]);
  }

  // 3. DIAGNOSTIC VERIFICATION
  h2("3. DIAGNOSTIC VERIFICATION");
  if (typeof analysis.diagnosticVerification === "string") {
    p(analysis.diagnosticVerification);
  } else if (analysis.diagnosticVerification) {
    const dv = analysis.diagnosticVerification;
    if (dv.text) p(dv.text);
    const verificationItems = [
      ...(dv.tools ? dv.tools.map(x => `Tools: ${x}`) : []),
      ...(dv.expectedReadings ? dv.expectedReadings.map(x => `Expected: ${x}`) : []),
      ...(dv.costs ? dv.costs.map(x => `Cost: ${x}`) : [])
    ];
    if (verificationItems.length) bullets(verificationItems);
  } else {
    bullets([
      "Exact tests the shop MUST perform.",
      "Tools needed and expected readings.",
      "Cost estimates for testing procedures."
    ]);
  }

  // 4. SHOP INTERROGATION
  h2("4. SHOP INTERROGATION");
  const shopQuestions = ensureArray(analysis.shopInterrogation);
  if (shopQuestions.length) {
    bullets(shopQuestions);
  } else {
    bullets([
      "5 technical questions to expose incompetence.",
      "Specific data they must show you.",
      "Red flag responses to watch for."
    ]);
  }

  // 5. CONVERSATION SCRIPTING
  h2("5. CONVERSATION SCRIPTING");
  {
    const cs = analysis.conversationScripting;
    if (typeof cs === "string") {
      p(cs);
    } else if (cs) {
      if (cs.opening) p(`Opening: ${cs.opening}`);
      if (cs.phrasing) p(`Phrasing: ${cs.phrasing}`);
      if (cs.dialogue) p(`Example dialogue: ${cs.dialogue}`);
      if (cs.bodyLanguage) p(`Body language: ${cs.bodyLanguage}`);
      if (cs.responseHandling) p(`Response handling: ${cs.responseHandling}`);
      if (cs.exitStrategy) p(`Exit strategy: ${cs.exitStrategy}`);
      if (cs.neverSay?.length) bullets(cs.neverSay.map(s => `NEVER say: ${s}`));
      if (cs.alwaysSay?.length) bullets(cs.alwaysSay.map(s => `ALWAYS say: ${s}`));
    } else {
      bullets([
        "Opening: how to present yourself as informed (not confrontational).",
        "Phrasing: frame questions as curiosity, not accusations.",
        "Example dialogue: word-for-word scripts for each question.",
        "Body language: professional demeanor tips.",
        "Response handling: what to say when they get defensive.",
        "Exit strategy: polite ways to decline and leave.",
        'NEVER say: "My AI report says..." or "I got a second opinion online".',
        'ALWAYS say: "I have done some research and want to understand..."'
      ]);
    }
  }

  // 6. COST BREAKDOWN
  h2("6. COST BREAKDOWN");
  {
    const arr = ensureArray(analysis.costBreakdown);
    if (arr.length) bullets(arr);
    else bullets([
      "Fair parts pricing analysis.",
      "Labor hour estimates.",
      "Total price range.",
      "Overcharge identification markers."
    ]);
  }

  // 7. RIPOFF DETECTION
  h2("7. RIPOFF DETECTION");
  {
    const arr = ensureArray(analysis.ripoffDetection);
    if (arr.length) bullets(arr);
    else bullets([
      "Parts cannon indicators.",
      "Diagnostic shortcuts to watch for.",
      "Price gouging red flags."
    ]);
  }

  // 8. AUTHORIZATION GUIDE
  h2("8. AUTHORIZATION GUIDE");
  {
    const ag = analysis.authorizationGuide;
    if (typeof ag === "string") {
      p(ag);
    } else if (ag) {
      if (ag.approve?.length) bullets(ag.approve.map(x => `Approve immediately: ${x}`));
      if (ag.reject?.length) bullets(ag.reject.map(x => `Reject outright: ${x}`));
      if (ag.secondOpinion?.length) bullets(ag.secondOpinion.map(x => `Second opinion: ${x}`));
    } else {
      bullets([
        "What to approve immediately.",
        "What to reject outright.",
        "When to get a second opinion."
      ]);
    }
  }

  // 9. TECHNICAL EDUCATION
  h2("9. TECHNICAL EDUCATION");
  {
    const arr = ensureArray(analysis.technicalEducation);
    if (arr.length) bullets(arr);
    else bullets([
      "System operation explanation.",
      "Failure mechanism details.",
      "Prevention tips for future."
    ]);
  }

  // 10. OEM PARTS STRATEGY
  h2("10. OEM PARTS STRATEGY");
  {
    const arr = ensureArray(analysis.oemPartsStrategy);
    if (arr.length) bullets(arr);
    else bullets([
      "Specific part numbers when possible.",
      "Why OEM is critical for this repair.",
      "Pricing sources and alternatives."
    ]);
  }

  // 11. NEGOTIATION TACTICS
  h2("11. NEGOTIATION TACTICS");
  {
    const arr = ensureArray(analysis.negotiationTactics);
    if (arr.length) bullets(arr);
    else bullets([
      "Price comparison strategies.",
      "Labor justification questions.",
      "Walk-away points and leverage."
    ]);
  }

  // 12. LIKELY CAUSES (RANKED)
  h2("12. LIKELY CAUSES (RANKED)");
  {
    const arr = ensureArray(analysis.likelyCausesRanked);
    if (arr.length) bullets(arr);
    else bullets([
      "Primary cause: X% confidence with reasoning.",
      "Secondary cause: X% confidence with reasoning.",
      "Tertiary cause: X% confidence with reasoning."
    ]);
  }

  // 13. RECOMMENDATIONS
  h2("13. RECOMMENDATIONS");
  {
    const arr = ensureArray(analysis.recommendations);
    if (arr.length) bullets(arr);
    else bullets([
      "Immediate actions required.",
      "Future maintenance schedule.",
      "Warning signs to monitor."
    ]);
  }

  // 14. SOURCE VERIFICATION
  h2("14. SOURCE VERIFICATION");
  {
    const arr = ensureArray(analysis.sourceVerification);
    if (arr.length) bullets(arr);
    else bullets([
      "2–3 authoritative links confirming diagnosis (OEM TSBs, NHTSA, reputable forums).",
      "Specific manufacturer TSBs if applicable.",
      "Independent verification sources (not sponsored).",
      "No generic links — must be directly relevant."
    ]);
  }

  // NEXT STEPS SUMMARY (optional but preferred)
  const nextSteps = ensureArray(analysis.nextStepsSummary);
  if (nextSteps.length) {
    h2("Next Steps Summary");
    bullets(nextSteps);
  }

  // ---------- CUSTOMER DATA VARIABLES USED ----------
  h1("Customer Data Variables Used");
  doc.fontSize(10).text(
    [
      `Vehicle: ${[submission?.make, submission?.model, submission?.year].filter(Boolean).join(" ") || "N/A"}`,
      `Equipment Type: ${submission?.equipment_type ?? "N/A"}`,
      `Mileage/Hours: ${submission?.mileage_hours ?? "N/A"}`,
      `Serial Number: ${submission?.serial_number ?? "N/A"}`,
      `Problem: ${submission?.problem_description ?? "N/A"}`,
      `Symptoms: ${Array.isArray(submission?.symptoms) ? submission.symptoms.join(", ") : (submission?.symptoms || "N/A")}`,
      `Error Codes: ${Array.isArray(submission?.error_codes) ? submission.error_codes.join(", ") : (submission?.error_codes || "N/A")}`,
      `When Started: ${submission?.when_started ?? "N/A"}`,
      `Frequency: ${submission?.frequency ?? "N/A"}`,
      `Urgency Level: ${submission?.urgency_level ?? "N/A"}`,
      `Location/Environment: ${submission?.location_environment ?? "N/A"}`,
      `Usage Pattern: ${submission?.usage_pattern ?? "N/A"}`,
      `Previous Repairs: ${submission?.previous_repairs ?? "N/A"}`,
      `Modifications: ${submission?.modifications ?? "N/A"}`,
      `Troubleshooting Done: ${submission?.troubleshooting_steps ?? "N/A"}`,
      `Shop Quote: ${submission?.shop_quote_amount ?? "N/A"}`,
      `Shop Recommendation: ${submission?.shop_recommendation ?? "N/A"}`
    ].join("\n"),
    { paragraphGap: 6 }
  );

  // ---------- DISCLAIMER PAGE ----------
  h1("Disclaimer & Legal Notice");
  doc.fontSize(10).text(
`This report is generated by the DiagnosticPro AI platform, built by intent solutions io.
It is intended strictly for informational purposes and consumer protection guidance.
It does not replace diagnosis or repair advice from a licensed automotive professional.

DiagnosticPro and intent solutions io assume no liability for decisions made based on this report.
Customers are advised to verify all findings with certified repair shops and follow manufacturer service bulletins.

© ${new Date().getFullYear()} DiagnosticPro. All rights reserved.

Contact & Support:
- Email: support@diagnosticpro.io
- Website: https://intentsolutions.io
- Website: https://startaitools.com`,
    { align: "justify", paragraphGap: 10 }
  );

  // ---------- FINALIZE ----------
  addHeaderFooter();
  doc.end();
  return stream; // listen for 'finish' on the caller side
}

module.exports = { generateDiagnosticProPDF };
