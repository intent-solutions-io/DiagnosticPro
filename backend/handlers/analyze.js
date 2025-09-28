const { VertexAI } = require('@google-cloud/vertexai');
const { Firestore } = require('@google-cloud/firestore');

const firestore = new Firestore();
const projectId = process.env.GCP_PROJECT || 'taveren-prod';
const location = 'us-central1';

// Initialize Vertex AI
const vertexAI = new VertexAI({ project: projectId, location });
const model = vertexAI.getGenerativeModel({
  model: 'gemini-1.5-flash',
  generationConfig: {
    maxOutputTokens: 8192,
    temperature: 0.2,
    topP: 0.95,
  }
});

module.exports = async (req, res) => {
  try {
    const { submissionId, diagnosticData } = req.body;
    console.log('Received diagnostic analysis request:', { submissionId, hasData: !!diagnosticData });

    // Prepare the comprehensive diagnostic prompt
    const prompt = `You are DiagnosticPro's MASTER TECHNICIAN. Use ALL the diagnostic data provided to give the most accurate analysis possible. Reference specific error codes, mileage patterns, and equipment type in your diagnosis.

CUSTOMER DATA PROVIDED:
- Vehicle: ${diagnosticData.make || 'Not specified'} ${diagnosticData.model || 'Not specified'} ${diagnosticData.year || 'Not specified'}
- Equipment Type: ${diagnosticData.equipment_type || 'Not specified'}
- Mileage/Hours: ${diagnosticData.mileage_hours || 'Not specified'}
- Serial Number: ${diagnosticData.serial_number || 'Not specified'}
- Problem: ${diagnosticData.problem_description || 'None provided'}
- Symptoms: ${Array.isArray(diagnosticData.symptoms) ? diagnosticData.symptoms.join(', ') : diagnosticData.symptoms || 'None provided'}
- Error Codes: ${diagnosticData.error_codes || 'None provided'}
- When Started: ${diagnosticData.when_started || 'Not specified'}
- Frequency: ${diagnosticData.frequency || 'Not specified'}
- Urgency Level: ${diagnosticData.urgency_level || 'Normal'}
- Location/Environment: ${diagnosticData.location_environment || 'Not specified'}
- Usage Pattern: ${diagnosticData.usage_pattern || 'Not specified'}
- Previous Repairs: ${diagnosticData.previous_repairs || 'None'}
- Modifications: ${diagnosticData.modifications || 'None'}
- Troubleshooting Done: ${diagnosticData.troubleshooting_steps || 'None'}
- Shop Quote: ${diagnosticData.shop_quote_amount ? `$${diagnosticData.shop_quote_amount}` : 'Not provided'}
- Shop Recommendation: ${diagnosticData.shop_recommendation || 'None'}

📋 COMPREHENSIVE ANALYSIS (2500 words max):

🎯 1. PRIMARY DIAGNOSIS
- Root cause (confidence %)
- Reference specific error codes if provided
- Component failure analysis
- Age/mileage considerations

🔍 2. DIFFERENTIAL DIAGNOSIS
- Alternative causes ranked
- Why each ruled in/out
- Equipment-specific patterns

✅ 3. DIAGNOSTIC VERIFICATION
- Exact tests shop MUST perform
- Tools needed, expected readings
- Cost estimates for testing

❓ 4. SHOP INTERROGATION
- 5 technical questions to expose incompetence
- Specific data they must show you
- Red flag responses

🗣️ 5. CONVERSATION SCRIPTING
- Opening: How to present yourself as informed (not confrontational)
- Phrasing: Frame questions as "curiosity" not accusations
- Example dialogue: Word-for-word scripts for each question
- Body language: Professional demeanor tips
- Response handling: What to say when they get defensive
- Exit strategy: Polite ways to decline and leave
- NEVER say: "My AI report says..." or "I got a second opinion online"
- ALWAYS say: "I've done some research and want to understand..."

💸 6. COST BREAKDOWN
- Fair parts pricing analysis
- Labor hour estimates
- Total price range
- Overcharge identification

🚩 7. RIPOFF DETECTION
- Parts cannon indicators
- Diagnostic shortcuts
- Price gouging red flags

⚖️ 8. AUTHORIZATION GUIDE
- Approve immediately
- Reject outright
- Get 2nd opinion

🔧 9. TECHNICAL EDUCATION
- System operation
- Failure mechanism
- Prevention tips

📦 10. OEM PARTS STRATEGY
- Specific part numbers
- Why OEM critical
- Pricing sources

💬 11. NEGOTIATION TACTICS
- Price comparisons
- Labor justification
- Walk-away points

🔬 12. LIKELY CAUSES
- Primary: 85% confidence
- Secondary: 60% confidence
- Tertiary: 40% confidence

📊 13. RECOMMENDATIONS
- Immediate actions
- Future maintenance
- Warning signs

🔗 14. SOURCE VERIFICATION
- 2-3 authoritative links confirming diagnosis (OEM TSBs, NHTSA, repair forums)
- Specific manufacturer technical service bulletins if applicable
- Independent verification sources (not sponsored content)
- NO generic links - must be directly relevant to this specific diagnosis`;

    console.log('Sending request to Vertex AI Gemini 1.5 Flash...');
    const result = await model.generateContent(prompt);
    const response = result.response;
    const analysisText = response.text();

    console.log('AI analysis complete, length:', analysisText.length);

    // Update Firestore with the analysis
    if (submissionId) {
      await firestore.collection('diagnosticSubmissions').doc(submissionId).update({
        analysisResult: analysisText,
        analysisStatus: 'completed',
        analysisCompletedAt: new Date().toISOString(),
        modelUsed: 'gemini-1.5-flash'
      });
      console.log('Updated submission in Firestore:', submissionId);
    }

    res.status(200).json({
      success: true,
      analysis: analysisText,
      submissionId,
      model: 'gemini-1.5-flash'
    });

  } catch (error) {
    console.error('Error in analyze-diagnostic:', error);
    res.status(500).json({
      error: 'Failed to analyze diagnostic',
      message: error.message
    });
  }
};