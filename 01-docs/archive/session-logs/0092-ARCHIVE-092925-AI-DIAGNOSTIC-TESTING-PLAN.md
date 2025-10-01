# AI DIAGNOSTIC TESTING PLAN

**Date:** September 29, 2025
**Purpose:** End-to-end testing of AI diagnostic flow to prevent data transmission issues

---

## 🎯 **TESTING OBJECTIVES**

1. **Verify complete data flow:** Frontend → API → Firestore → AI → PDF → Email
2. **Test CORS with real diagnostic submissions**
3. **Validate AI analysis receives proper data format**
4. **Confirm PDF generation and email delivery**
5. **Ensure no data loss or corruption in the pipeline**

---

## 📋 **TEST PLAN PHASES**

### **PHASE 1: SUBMISSION CREATION TESTING**
Test the diagnostic form submission and Firestore storage.

#### Test 1.1: Create Real Diagnostic Submission
```bash
# Test diagnostic submission creation
curl -H "Origin: https://diagnosticpro.io" \
  -H "x-api-key: AIzaSyBgoJITYrqOcMx69HKa1_CzCkQNlVm66Co" \
  -H "Content-Type: application/json" \
  -X POST \
  -d '{
    "equipmentType": "Vehicle",
    "make": "Toyota",
    "model": "Camry",
    "year": "2020",
    "symptoms": "Engine making unusual noise, rough idle",
    "troubleCodes": ["P0300", "P0171"],
    "contact": {
      "email": "test@diagnosticpro.io",
      "name": "Test User"
    }
  }' \
  "https://diagpro-gw-3tbssksx-3tbssksx.uc.gateway.dev/saveSubmission"
```

**Expected Result:**
- HTTP 200 response
- Returns submissionId (format: `diag_xxxxx`)
- Data stored in Firestore `diagnosticSubmissions` collection

#### Test 1.2: Verify Firestore Storage
```bash
# Check Firestore for the submission
gcloud firestore collections documents list diagnosticSubmissions \
  --project diagnostic-pro-prod \
  --limit 1
```

### **PHASE 2: STRIPE PAYMENT TESTING**
Test Stripe session creation with real submission data.

#### Test 2.1: Create Checkout Session with Real Submission
```bash
# Use submissionId from Test 1.1
SUBMISSION_ID="[from_test_1.1]"

curl -H "Origin: https://diagnosticpro.io" \
  -H "x-api-key: AIzaSyBgoJITYrqOcMx69HKa1_CzCkQNlVm66Co" \
  -H "Content-Type: application/json" \
  -X POST \
  -d "{\"submissionId\": \"$SUBMISSION_ID\"}" \
  "https://diagpro-gw-3tbssksx-3tbssksx.uc.gateway.dev/createCheckoutSession"
```

**Expected Result:**
- HTTP 200 response
- Returns `sessionId` and `url`
- Session includes `client_reference_id: submissionId`

#### Test 2.2: Test Session Retrieval
```bash
SESSION_ID="[from_test_2.1]"

curl -H "Origin: https://diagnosticpro.io" \
  -H "x-api-key: AIzaSyBgoJITYrqOcMx69HKa1_CzCkQNlVm66Co" \
  "https://diagpro-gw-3tbssksx-3tbssksx.uc.gateway.dev/checkout/session?id=$SESSION_ID"
```

**Expected Result:**
- HTTP 200 response
- Returns session data with `submissionId`
- No CORS errors

### **PHASE 3: AI ANALYSIS TESTING**
Test the complete AI diagnostic flow.

#### Test 3.1: Trigger AI Analysis (Manual)
```bash
# Manually trigger AI analysis for submission
curl -H "Origin: https://diagnosticpro.io" \
  -H "x-api-key: AIzaSyBgoJITYrqOcMx69HKa1_CzCkQNlVm66Co" \
  -H "Content-Type: application/json" \
  -X POST \
  -d "{\"submissionId\": \"$SUBMISSION_ID\"}" \
  "https://diagpro-gw-3tbssksx-3tbssksx.uc.gateway.dev/triggerAnalysis"
```

#### Test 3.2: Monitor AI Processing
```bash
# Check logs for AI processing
gcloud logging read 'resource.labels.service_name="diagnosticpro-vertex-ai-backend" AND (jsonPayload.submissionId="'$SUBMISSION_ID'" OR textPayload=~"'$SUBMISSION_ID'")' \
  --project diagnostic-pro-prod \
  --limit 20
```

**Expected Log Entries:**
- Submission data retrieved from Firestore
- Vertex AI API call initiated
- AI response received and processed
- Analysis stored back to Firestore

### **PHASE 4: PDF AND EMAIL TESTING**
Test report generation and delivery.

#### Test 4.1: Check PDF Generation
```bash
# Check if PDF was generated and stored
curl -H "x-api-key: AIzaSyBgoJITYrqOcMx69HKa1_CzCkQNlVm66Co" \
  "https://diagpro-gw-3tbssksx-3tbssksx.uc.gateway.dev/reports/signed-url?submissionId=$SUBMISSION_ID"
```

**Expected Result:**
- HTTP 200 response
- Returns `downloadUrl` and `viewUrl`
- PDF accessible via URLs

#### Test 4.2: Verify Email Delivery
```bash
# Check email logs
gcloud logging read 'resource.labels.service_name="diagnosticpro-vertex-ai-backend" AND jsonPayload.phase="sendEmail" AND jsonPayload.submissionId="'$SUBMISSION_ID'"' \
  --project diagnostic-pro-prod \
  --limit 5
```

**Expected Result:**
- Email sent successfully
- No delivery errors
- Customer receives diagnostic report

---

## 🔧 **DATA VALIDATION TESTS**

### **Data Integrity Checks**

#### Check 1: Submission Data Completeness
```javascript
// Verify all required fields are stored correctly
const submission = await firestore.collection('diagnosticSubmissions').doc(submissionId).get();
const data = submission.data();

// Verify required fields
assert(data.equipmentType === "Vehicle");
assert(data.make === "Toyota");
assert(data.symptoms.length > 0);
assert(data.troubleCodes.includes("P0300"));
assert(data.contact.email === "test@diagnosticpro.io");
```

#### Check 2: AI Input Format
```javascript
// Verify AI receives properly formatted data
const aiInput = {
  equipmentType: data.equipmentType,
  make: data.make,
  model: data.model,
  year: data.year,
  symptoms: data.symptoms,
  troubleCodes: data.troubleCodes,
  // Ensure no undefined or null values
  // Ensure proper data types
};
```

#### Check 3: AI Output Validation
```javascript
// Verify AI response format
const aiResponse = analysis.content;
assert(aiResponse.includes("Initial Assessment"));
assert(aiResponse.includes("Diagnostic Tests"));
assert(aiResponse.includes("Root Cause Analysis"));
assert(aiResponse.length > 1000); // Ensure substantial content
```

---

## 🚨 **FAILURE SCENARIOS TO TEST**

### **Error Handling Tests**

#### Test E1: Invalid Submission Data
```bash
# Test with missing required fields
curl -X POST -H "Content-Type: application/json" \
  -d '{"make": "Toyota"}' \
  "https://diagpro-gw-3tbssksx-3tbssksx.uc.gateway.dev/saveSubmission"
```
**Expected:** HTTP 400 with validation errors

#### Test E2: Non-existent Submission ID
```bash
# Test with fake submission ID
curl -X POST -H "Content-Type: application/json" \
  -d '{"submissionId": "fake_12345"}' \
  "https://diagpro-gw-3tbssksx-3tbssksx.uc.gateway.dev/createCheckoutSession"
```
**Expected:** HTTP 404 "Submission not found"

#### Test E3: AI Service Failure
- Test with malformed data to AI
- Test AI timeout scenarios
- Test AI service unavailability

#### Test E4: PDF Generation Failure
- Test with corrupted analysis data
- Test storage bucket issues
- Test PDF rendering errors

---

## 📊 **SUCCESS CRITERIA**

### **All Tests Must Pass:**
1. ✅ Diagnostic submission creates valid Firestore document
2. ✅ Stripe session creation works with real submission data
3. ✅ Session retrieval returns correct submission ID
4. ✅ AI analysis triggers and completes successfully
5. ✅ PDF generation produces downloadable report
6. ✅ Email delivery confirms successful send
7. ✅ No CORS errors throughout the entire flow
8. ✅ All error scenarios handle gracefully

### **Performance Benchmarks:**
- Submission creation: < 1 second
- Stripe session creation: < 3 seconds
- AI analysis: < 30 seconds
- PDF generation: < 10 seconds
- Email delivery: < 5 seconds
- Total end-to-end: < 60 seconds

### **Data Quality Validation:**
- No data loss between API calls
- All required fields preserved through pipeline
- AI receives properly formatted diagnostic data
- Generated reports contain meaningful analysis
- Customer emails include correct diagnostic information

---

## 🔍 **MONITORING DURING TESTS**

### **Key Logs to Watch:**
```bash
# Real-time monitoring during testing
gcloud logging tail 'resource.labels.service_name="diagnosticpro-vertex-ai-backend"' \
  --project diagnostic-pro-prod
```

### **Metrics to Track:**
- Request latency at each stage
- Error rates per endpoint
- Firestore read/write operations
- Vertex AI API usage and latency
- Email delivery success rates

---

## 📝 **TEST EXECUTION CHECKLIST**

- [ ] Phase 1: Submission Creation (Tests 1.1, 1.2)
- [ ] Phase 2: Stripe Payment (Tests 2.1, 2.2)
- [ ] Phase 3: AI Analysis (Tests 3.1, 3.2)
- [ ] Phase 4: PDF & Email (Tests 4.1, 4.2)
- [ ] Data Validation (Checks 1, 2, 3)
- [ ] Error Handling (Tests E1, E2, E3, E4)
- [ ] Performance Validation
- [ ] End-to-end Success Confirmation

---

**CRITICAL:** Do not proceed to production customer traffic until ALL tests pass and data flow is validated end-to-end.

**Next Action:** Execute Phase 1 testing to validate submission creation and Firestore storage.