const nodemailer = require('nodemailer');
const { Firestore } = require('@google-cloud/firestore');
const axios = require('axios');

const firestore = new Firestore();

// Create email transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: 'reports@diagnosticpro.io',
      pass: process.env.GMAIL_APP_PASSWORD
    }
  });
};

// Send diagnostic email with PDF report
const sendDiagnostic = async (req, res) => {
  try {
    const { submissionId, customerEmail, orderId } = req.body;
    console.log('Sending diagnostic email:', { submissionId, customerEmail, orderId });

    // Get submission data
    const submissionDoc = await firestore.collection('diagnosticSubmissions').doc(submissionId).get();
    if (!submissionDoc.exists) {
      throw new Error(`Submission ${submissionId} not found`);
    }
    const submission = submissionDoc.data();

    // Generate PDF if analysis is complete
    let pdfBuffer;
    if (submission.analysisResult) {
      try {
        const pdfResponse = await axios.post(
          `${process.env.API_URL || 'http://localhost:8080'}/api/generate-report-pdf`,
          {
            submissionId,
            analysisResult: submission.analysisResult,
            diagnosticData: submission
          },
          {
            headers: { 'Content-Type': 'application/json' },
            responseType: 'arraybuffer',
            timeout: 30000
          }
        );
        pdfBuffer = Buffer.from(pdfResponse.data);
        console.log('PDF generated successfully');
      } catch (pdfError) {
        console.error('Failed to generate PDF:', pdfError.message);
      }
    }

    // Create email content
    const emailContent = {
      from: '"DiagnosticPro AI" <reports@diagnosticpro.io>',
      to: customerEmail,
      subject: `Your DiagnosticPro Report - ${submission.make || ''} ${submission.model || ''} ${submission.year || ''}`.trim(),
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #2563eb;">Your DiagnosticPro Report is Ready!</h1>
          
          <p>Thank you for using DiagnosticPro AI. Your comprehensive diagnostic analysis is attached to this email.</p>
          
          <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h2 style="color: #1f2937; margin-top: 0;">Equipment Details:</h2>
            <ul style="color: #4b5563;">
              <li><strong>Vehicle:</strong> ${submission.make || 'N/A'} ${submission.model || ''} ${submission.year || ''}</li>
              <li><strong>Mileage/Hours:</strong> ${submission.mileageHours || submission.mileage_hours || 'N/A'}</li>
              <li><strong>Problem:</strong> ${submission.problemDescription || submission.problem_description || 'N/A'}</li>
            </ul>
          </div>
          
          <h3 style="color: #1f2937;">What's Next?</h3>
          <ol style="color: #4b5563;">
            <li>Review your detailed PDF report attached to this email</li>
            <li>Use our analysis to understand your repair options</li>
            <li>Compare quotes from shops with our cost breakdown</li>
            <li>Ask shops our recommended technical questions</li>
          </ol>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
            <p style="color: #6b7280; font-size: 14px;">
              <strong>Need help?</strong> Reply to this email with any questions about your report.
            </p>
            <p style="color: #6b7280; font-size: 14px;">
              Order ID: ${orderId}<br>
              Submission ID: ${submissionId}
            </p>
          </div>
          
          <div style="margin-top: 20px; padding: 15px; background: #fef3c7; border-radius: 8px;">
            <p style="color: #92400e; margin: 0; font-size: 14px;">
              <strong>⚠️ Important:</strong> This report is for informational purposes only. 
              Always consult with a qualified mechanic for final diagnosis and repairs.
            </p>
          </div>
        </div>
      `,
      attachments: pdfBuffer ? [
        {
          filename: `DiagnosticPro_Report_${submissionId}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf'
        }
      ] : []
    };

    // Send email
    const transporter = createTransporter();
    const info = await transporter.sendMail(emailContent);
    console.log('Email sent:', info.messageId);

    // Log to Firestore
    await firestore.collection('emailLogs').add({
      submissionId,
      orderId,
      customerEmail,
      messageId: info.messageId,
      subject: emailContent.subject,
      sentAt: new Date().toISOString(),
      status: 'sent',
      type: 'diagnostic_report'
    });

    res.status(200).json({
      success: true,
      messageId: info.messageId
    });

  } catch (error) {
    console.error('Error sending diagnostic email:', error);
    res.status(500).json({
      error: 'Failed to send email',
      message: error.message
    });
  }
};

// Manual send email
const manualSend = async (req, res) => {
  try {
    const { to, subject, html, text } = req.body;
    
    const transporter = createTransporter();
    const info = await transporter.sendMail({
      from: '"DiagnosticPro Support" <reports@diagnosticpro.io>',
      to,
      subject,
      text,
      html
    });

    res.status(200).json({
      success: true,
      messageId: info.messageId
    });
  } catch (error) {
    console.error('Error sending manual email:', error);
    res.status(500).json({
      error: 'Failed to send email',
      message: error.message
    });
  }
};

// Test email
const testEmail = async (req, res) => {
  try {
    const { to = 'test@diagnosticpro.io' } = req.body;
    
    const transporter = createTransporter();
    const info = await transporter.sendMail({
      from: '"DiagnosticPro Test" <reports@diagnosticpro.io>',
      to,
      subject: 'Test Email from DiagnosticPro',
      text: 'This is a test email to verify email configuration.',
      html: '<p>This is a <strong>test email</strong> to verify email configuration.</p>'
    });

    res.status(200).json({
      success: true,
      messageId: info.messageId,
      message: 'Test email sent successfully'
    });
  } catch (error) {
    console.error('Error sending test email:', error);
    res.status(500).json({
      error: 'Failed to send test email',
      message: error.message
    });
  }
};

module.exports = {
  sendDiagnostic,
  manualSend,
  testEmail
};