# 0079-AI-PROMPTS-AND-TEMPLATES.md

**Date**: 2025-09-27
**Phase**: ENT
**Status**: ✅ PROPRIETARY INTELLECTUAL PROPERTY

## DiagnosticPro AI Analysis System - Proprietary Prompts & Templates

**⚠️ CONFIDENTIAL - Core Business Intelligence**

This document contains DiagnosticPro's proprietary AI system prompts and PDF report templates that distinguish our diagnostic service from competitors.

---

## 1. AI Model Configuration

**Model**: Gemini 1.5 Flash (Google Vertex AI)
**Location**: `/backend/handlers/analyze.js` lines 10-17

```javascript
const vertexAI = new VertexAI({ project: projectId, location: 'us-central1' });
const model = vertexAI.getGenerativeModel({
  model: 'gemini-1.5-flash',
  generationConfig: {
    maxOutputTokens: 8192,      // ~2,500 words
    temperature: 0.2,            // Low for consistency (updated from 0.7)
    topP: 0.95,
  }
});
```

**Why These Settings:**
- **Temperature 0.2**: Ensures consistent, factual analysis (not creative speculation)
- **8,192 tokens**: Allows comprehensive 2,500-word reports
- **Gemini 1.5 Flash**: Cost-effective while maintaining quality

---

## 2. Master System Prompt (Proprietary)

**Location**: `/backend/handlers/analyze.js` lines 25-108

### System Identity
```
You are DiagnosticPro's MASTER TECHNICIAN. Use ALL the diagnostic data provided
to give the most accurate analysis possible. Reference specific error codes,
mileage patterns, and equipment type in your diagnosis.
```

### Data Injection Template
```
CUSTOMER DATA PROVIDED:
- Vehicle: ${diagnosticData.make} ${diagnosticData.model} ${diagnosticData.year}
- Equipment Type: ${diagnosticData.equipment_type}
- Mileage/Hours: ${diagnosticData.mileage_hours}
- Serial Number: ${diagnosticData.serial_number}
- Problem: ${diagnosticData.problem_description}
- Symptoms: ${diagnosticData.symptoms}
- Error Codes: ${diagnosticData.error_codes}
- When Started: ${diagnosticData.when_started}
- Frequency: ${diagnosticData.frequency}
- Urgency Level: ${diagnosticData.urgency_level}
- Location/Environment: ${diagnosticData.location_environment}
- Usage Pattern: ${diagnosticData.usage_pattern}
- Previous Repairs: ${diagnosticData.previous_repairs}
- Modifications: ${diagnosticData.modifications}
- Troubleshooting Done: ${diagnosticData.troubleshooting_steps}
- Shop Quote: ${diagnosticData.shop_quote_amount}
- Shop Recommendation: ${diagnosticData.shop_recommendation}
```

### 14-Section Analysis Framework (PROPRIETARY)

**Version**: v1.3 (2025-09-27)
**Target Length**: 2,500 words maximum

**Key Enhancements in v1.3:**
- 🗣️ Section 5: Conversation Scripting (teaches customers how to talk to mechanics without confrontation)
- 🔗 Section 14: Source Verification (provides 2-3 authoritative links to confirm AI findings)

#### 🎯 1. PRIMARY DIAGNOSIS
- Root cause (confidence %)
- Reference specific error codes if provided
- Component failure analysis
- Age/mileage considerations

#### 🔍 2. DIFFERENTIAL DIAGNOSIS
- Alternative causes ranked
- Why each ruled in/out
- Equipment-specific patterns

#### ✅ 3. DIAGNOSTIC VERIFICATION
- Exact tests shop MUST perform
- Tools needed, expected readings
- Cost estimates for testing

#### ❓ 4. SHOP INTERROGATION
- 5 technical questions to expose incompetence
- Specific data they must show you
- Red flag responses

#### 🗣️ 5. CONVERSATION SCRIPTING (NEW - v1.3)
- Opening: How to present yourself as informed (not confrontational)
- Phrasing: Frame questions as "curiosity" not accusations
- Example dialogue: Word-for-word scripts for each question
- Body language: Professional demeanor tips
- Response handling: What to say when they get defensive
- Exit strategy: Polite ways to decline and leave
- NEVER say: "My AI report says..." or "I got a second opinion online"
- ALWAYS say: "I've done some research and want to understand..."

#### 💸 6. COST BREAKDOWN
- Fair parts pricing analysis
- Labor hour estimates
- Total price range
- Overcharge identification

#### 🚩 7. RIPOFF DETECTION
- Parts cannon indicators
- Diagnostic shortcuts
- Price gouging red flags

#### ⚖️ 8. AUTHORIZATION GUIDE
- Approve immediately
- Reject outright
- Get 2nd opinion

#### 🔧 9. TECHNICAL EDUCATION
- System operation
- Failure mechanism
- Prevention tips

#### 📦 10. OEM PARTS STRATEGY
- Specific part numbers
- Why OEM critical
- Pricing sources

#### 💬 11. NEGOTIATION TACTICS
- Price comparisons
- Labor justification
- Walk-away points

#### 🔬 12. LIKELY CAUSES
- Primary: 85% confidence
- Secondary: 60% confidence
- Tertiary: 40% confidence

#### 📊 13. RECOMMENDATIONS
- Immediate actions
- Future maintenance
- Warning signs

#### 🔗 14. SOURCE VERIFICATION (NEW - v1.3)
- 2-3 authoritative links confirming diagnosis (OEM TSBs, NHTSA, repair forums)
- Specific manufacturer technical service bulletins if applicable
- Independent verification sources (not sponsored content)
- NO generic links - must be directly relevant to this specific diagnosis

---

## 3. PDF Report Template (Proprietary)

**Location**: `/backend/templates/pdf-template.js`

### Template Structure

```javascript
function generatePdfContent(submission, order) {
  const currentDate = new Date().toLocaleDateString();

  return `
DIAGNOSTIC REPORT
================

Report Date: ${currentDate}
Report ID: ${submission.id}

EQUIPMENT INFORMATION
--------------------
Make: ${submission.make || 'N/A'}
Model: ${submission.model || 'N/A'}
Year: ${submission.year || 'N/A'}
Equipment Type: ${submission.equipment_type || 'N/A'}
Serial Number: ${submission.serial_number || 'N/A'}
Mileage/Hours: ${submission.mileage_hours || 'N/A'}

CUSTOMER INFORMATION
-------------------
Name: ${submission.full_name}
Email: ${submission.email}
Phone: ${submission.phone || 'N/A'}

PROBLEM DESCRIPTION
------------------
${submission.problem_description || 'No description provided'}

SYMPTOMS
--------
${submission.symptoms ? submission.symptoms.join('\n- ') : 'No symptoms listed'}

ERROR CODES
-----------
${submission.error_codes || 'No error codes reported'}

USAGE PATTERNS
--------------
When Started: ${submission.when_started || 'N/A'}
Frequency: ${submission.frequency || 'N/A'}
Usage Pattern: ${submission.usage_pattern || 'N/A'}

ENVIRONMENT & CONTEXT
--------------------
Location/Environment: ${submission.location_environment || 'N/A'}
Urgency Level: ${submission.urgency_level || 'N/A'}

MAINTENANCE HISTORY
------------------
Previous Repairs: ${submission.previous_repairs || 'No previous repairs listed'}
Modifications: ${submission.modifications || 'No modifications listed'}

TROUBLESHOOTING ATTEMPTED
------------------------
${submission.troubleshooting_steps || 'No troubleshooting steps documented'}

SHOP RECOMMENDATIONS
-------------------
${submission.shop_recommendation || 'No shop recommendations provided'}
Quoted Amount: ${submission.shop_quote_amount ? `${submission.shop_quote_amount}` : 'No quote provided'}

COMPREHENSIVE AI ANALYSIS
=========================
${order?.analysis ? order.analysis : 'AI analysis is being processed. If you see this message, please contact support for immediate assistance.'}

DISCLAIMER
----------
This diagnostic report is based on the information provided and should be used as a guide only.
Professional mechanical inspection and diagnosis are recommended before performing any repairs.
This report does not guarantee specific outcomes or repair costs.

Generated by DiagnosticPro AI
Report ID: ${submission.id}
Generated: ${currentDate}

© 2025 DiagnosticPro AI. All rights reserved.
`;
}
```

---

## 4. Competitive Differentiation

### What Makes This Proprietary:

1. **14-Section Framework**: Comprehensive structure covering diagnosis, cost, negotiation, scam detection, and conversation coaching
2. **Shop Interrogation**: 5 technical questions customers can ask mechanics to verify competence
3. **Ripoff Detection**: Specific red flags for parts cannon approach and price gouging
4. **Authorization Guide**: Clear approve/reject/2nd-opinion recommendations
5. **OEM Parts Strategy**: Specific part numbers and sourcing guidance
6. **Negotiation Tactics**: Price comparison and walk-away points
7. **Confidence Percentages**: Ranked likely causes with specific confidence levels
8. **Conversation Scripting** (NEW): Word-for-word scripts teaching customers how to sound informed without being confrontational
9. **Source Verification** (NEW): 2-3 authoritative links (OEM TSBs, NHTSA, repair forums) confirming diagnosis

### Value Proposition:

**Standard competitors provide**: Basic diagnosis ("probably the alternator")

**DiagnosticPro provides**:
- Ranked causes with confidence percentages
- Exact diagnostic tests mechanics should perform
- Fair price ranges for parts and labor
- 5 questions to ask the shop (with word-for-word scripts)
- Warning signs of incompetence/scams
- Negotiation strategies
- OEM part numbers
- **How to have the conversation** (professional, non-confrontational approach)
- **Verification links** (2-3 authoritative sources confirming diagnosis)

---

## 5. Prompt Engineering Best Practices

### Key Techniques Used:

1. **Role Assignment**: "You are DiagnosticPro's MASTER TECHNICIAN"
2. **Data Grounding**: Injects all customer data with explicit field references
3. **Structured Output**: 12 emoji-prefixed sections for clear organization
4. **Specificity Requirements**: "Reference specific error codes", "exact tests", "5 questions"
5. **Confidence Metrics**: Requires percentage-based likelihood rankings
6. **Adversarial Framing**: "expose incompetence", "ripoff detection", "red flags"

### Temperature Rationale:

- **0.2 (Current)**: Factual, consistent, technical
- **0.7 (Previous)**: Too creative, inconsistent diagnoses
- **Why Low Temperature**: Customers need reliable facts, not creative speculation

---

## 6. Integration Points

### Where This Executes:

1. **Stripe Webhook** → Payment confirmed
2. **Cloud Run Backend** → `/stripeWebhookForward` endpoint
3. **Analysis Handler** → `/backend/handlers/analyze.js`
4. **Vertex AI Call** → Gemini 1.5 Flash processes prompt
5. **Firestore Update** → Stores analysis in `diagnosticSubmissions` collection
6. **PDF Generation** → Uses template to create report
7. **Cloud Storage** → Saves PDF to `diagnostic-pro-prod-reports-us-central1`
8. **Signed URL Generation** → Customer downloads via auto-retry

---

## 7. Future Enhancements (Roadmap)

### Planned Improvements:

1. **Dynamic Section Weighting**: Adjust prompt based on equipment type
2. **Multi-Model Comparison**: Compare Gemini vs Claude outputs for quality
3. **RAG Integration**: Pull from BigQuery repair database for historical patterns
4. **Image Analysis**: Add Gemini Vision for photo-based diagnosis
5. **Voice Notes**: Transcribe and analyze customer voice descriptions
6. **Follow-up Questions**: Interactive clarification before final analysis
7. **Shop Rating Integration**: Cross-reference with shop reputation data

---

## 8. Prompt Versioning

**Current Version**: v1.2 (2025-09-27)

**Changelog**:
- v1.0 (2025-09-20): Initial 12-section framework
- v1.1 (2025-09-24): Added confidence percentages
- v1.2 (2025-09-27): Lowered temperature from 0.7 → 0.2
- v1.3 (2025-09-27): Added Conversation Scripting (Section 5) and Source Verification (Section 14)

**Version Control**: All prompt changes must be documented here with date and rationale.

---

## 9. Quality Metrics

**Target Outcomes**:
- Analysis length: 2,000-2,500 words
- Confidence scoring: Present in 95%+ of reports
- Specific error code reference: 80%+ when codes provided
- Part number recommendations: 70%+ when applicable
- Customer satisfaction: >4.5/5 stars

**Monitoring**: Track these metrics via Firestore analytics queries

---

## 10. Legal & Compliance

**Copyright**: © 2025 Intent Solutions Inc / DiagnosticPro AI
**Proprietary Status**: Trade secret - do not disclose
**DMCA Protection**: Registered with US Copyright Office
**Usage Rights**: Licensed exclusively to DiagnosticPro platform

**Disclaimer Integration**: Every PDF includes liability disclaimer (see template)

---

## File Locations Reference

| Component | File Path | Lines |
|-----------|-----------|-------|
| **Model Config** | `/backend/handlers/analyze.js` | 10-17 |
| **System Prompt** | `/backend/handlers/analyze.js` | 25-108 |
| **PDF Template** | `/backend/templates/pdf-template.js` | 1-95 |
| **Analysis Handler** | `/backend/handlers/analyze.js` | Full file |

---

## Access Control

**Who Can Modify**:
- Owner: Jeremy (Intent Solutions Inc)
- Senior Engineers: With approval only
- AI Assistants: Read-only documentation

**Version Control**:
- All changes committed to git with descriptive messages
- Deploy only after testing with sample diagnostics
- Maintain previous versions in `archive/` directory

---

**Last Updated**: 2025-09-27 21:15 UTC
**Maintained By**: Jeremy / DiagnosticPro Team
**Next Review**: 2025-10-27 (monthly cadence)