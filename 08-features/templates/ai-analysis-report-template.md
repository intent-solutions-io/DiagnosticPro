# DiagnosticPro AI Analysis Report Template
## Proprietary 14-Section Analysis Framework v1.3

**Date**: 2025-09-30
**Purpose**: Template for DiagnosticPro's proprietary AI diagnostic analysis
**Target**: 2000-2500 words comprehensive diagnostic report

---

## Analysis Framework Structure

### 🎯 1. PRIMARY DIAGNOSIS
- Root cause with confidence percentage
- Reference specific error codes if provided
- Component failure analysis
- Age/mileage considerations

### 🔍 2. DIFFERENTIAL DIAGNOSIS
- Alternative causes ranked by likelihood
- Why each cause is ruled in or out
- Equipment-specific failure patterns

### ✅ 3. DIAGNOSTIC VERIFICATION
- Exact tests the shop MUST perform
- Tools needed and expected readings
- Cost estimates for testing procedures

### ❓ 4. SHOP INTERROGATION
- 5 technical questions to expose incompetence
- Specific data they must show you
- Red flag responses to watch for

### 🗣️ 5. CONVERSATION SCRIPTING
- **Opening**: How to present yourself as informed (not confrontational)
- **Phrasing**: Frame questions as "curiosity" not accusations
- **Example dialogue**: Word-for-word scripts for each question
- **Body language**: Professional demeanor tips
- **Response handling**: What to say when they get defensive
- **Exit strategy**: Polite ways to decline and leave
- **NEVER say**: "My AI report says..." or "I got a second opinion online"
- **ALWAYS say**: "I've done some research and want to understand..."

### 💸 6. COST BREAKDOWN
- Fair parts pricing analysis
- Labor hour estimates
- Total price range
- Overcharge identification markers

### 🚩 7. RIPOFF DETECTION
- Parts cannon indicators
- Diagnostic shortcuts to watch for
- Price gouging red flags

### ⚖️ 8. AUTHORIZATION GUIDE
- What to approve immediately
- What to reject outright
- When to get a second opinion

### 🔧 9. TECHNICAL EDUCATION
- System operation explanation
- Failure mechanism details
- Prevention tips for future

### 📦 10. OEM PARTS STRATEGY
- Specific part numbers when possible
- Why OEM is critical for this repair
- Pricing sources and alternatives

### 💬 11. NEGOTIATION TACTICS
- Price comparison strategies
- Labor justification questions
- Walk-away points and leverage

### 🔬 12. LIKELY CAUSES (RANKED)
- Primary cause: X% confidence with reasoning
- Secondary cause: X% confidence with reasoning
- Tertiary cause: X% confidence with reasoning

### 📊 13. RECOMMENDATIONS
- Immediate actions required
- Future maintenance schedule
- Warning signs to monitor

### 🔗 14. SOURCE VERIFICATION
- 2-3 authoritative links confirming diagnosis (OEM TSBs, NHTSA, repair forums)
- Specific manufacturer technical service bulletins if applicable
- Independent verification sources (not sponsored content)
- **NO generic links** - must be directly relevant to this specific diagnosis

---

## Customer Data Variables Used

The AI analysis references these customer-provided data points:

```javascript
CUSTOMER DATA PROVIDED:
- Vehicle: ${payload.make} ${payload.model} ${payload.year}
- Equipment Type: ${payload.equipmentType}
- Mileage/Hours: ${payload.mileageHours}
- Serial Number: ${payload.serialNumber}
- Problem: ${payload.problemDescription}
- Symptoms: ${payload.symptoms}
- Error Codes: ${payload.errorCodes}
- When Started: ${payload.whenStarted}
- Frequency: ${payload.frequency}
- Urgency Level: ${payload.urgencyLevel}
- Location/Environment: ${payload.locationEnvironment}
- Usage Pattern: ${payload.usagePattern}
- Previous Repairs: ${payload.previousRepairs}
- Modifications: ${payload.modifications}
- Troubleshooting Done: ${payload.troubleshootingSteps}
- Shop Quote: ${payload.shopQuoteAmount}
- Shop Recommendation: ${payload.shopRecommendation}
```

---

## Quality Standards

### Analysis Requirements
- **Comprehensive**: 2000-2500 words total
- **Specific**: Reference provided error codes, mileage, equipment type
- **Technical**: Use industry-standard terminology
- **Actionable**: Clear next steps for customer
- **Professional**: Suitable for confronting repair shops

### Conversation Coaching Requirements
- **Non-confrontational**: Frame as curiosity, not accusations
- **Professional**: Maintain respectful demeanor
- **Strategic**: Expose incompetence without revealing AI source
- **Protective**: Guard against defensive shop responses
- **Tactical**: Provide exit strategies and leverage points

### Source Verification Requirements
- **Authoritative**: OEM technical service bulletins, NHTSA, certified forums
- **Specific**: Directly relevant to the diagnosis
- **Independent**: Not sponsored or generic content
- **Verifiable**: Links that actually confirm the diagnosis

---

## Implementation Notes

This template is implemented in the Vertex AI prompt within:
`02-src/backend/services/backend/index.js` (lines 1062-1164)

The AI analysis uses this exact structure to generate comprehensive diagnostic reports that empower customers with professional-grade technical knowledge and conversation strategies for dealing with repair shops.

---

**Maintained By**: Jeremy / DiagnosticPro Team
**Version**: 1.3
**Status**: Production Implementation
**Location**: `callVertexAI()` function