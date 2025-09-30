const PDFDocument = require('pdfkit');
const { Firestore } = require('@google-cloud/firestore');

const firestore = new Firestore();

module.exports = async (req, res) => {
  try {
    const { submissionId, analysisResult, diagnosticData } = req.body;
    console.log('Generating PDF report for submission:', submissionId);

    // Create PDF document
    const doc = new PDFDocument({
      size: 'A4',
      margins: { top: 50, left: 50, right: 50, bottom: 50 }
    });

    // Collect PDF data
    const buffers = [];
    doc.on('data', buffers.push.bind(buffers));
    
    // Header
    doc.fontSize(24)
       .fillColor('#2563eb')
       .text('DiagnosticPro AI', { align: 'center' });
    
    doc.fontSize(18)
       .fillColor('#1f2937')
       .text('Comprehensive Diagnostic Report', { align: 'center' })
       .moveDown();

    // Report metadata
    doc.fontSize(10)
       .fillColor('#6b7280')
       .text(`Report Generated: ${new Date().toLocaleDateString()}`, { align: 'right' })
       .text(`Report ID: ${submissionId}`, { align: 'right' })
       .moveDown();

    // Equipment information box
    doc.fillColor('#f3f4f6')
       .rect(50, doc.y, 495, 100)
       .fill();
    
    doc.fillColor('#1f2937')
       .fontSize(14)
       .text('Equipment Information', 60, doc.y + 10, { width: 475 })
       .fontSize(11)
       .fillColor('#4b5563')
       .moveDown(0.5);

    const equipmentInfo = [
      `Vehicle: ${diagnosticData.make || 'N/A'} ${diagnosticData.model || ''} ${diagnosticData.year || ''}`,
      `Mileage/Hours: ${diagnosticData.mileageHours || diagnosticData.mileage_hours || 'N/A'}`,
      `VIN/Serial: ${diagnosticData.serialNumber || diagnosticData.serial_number || 'N/A'}`,
      `Equipment Type: ${diagnosticData.equipmentType || diagnosticData.equipment_type || 'N/A'}`
    ];

    equipmentInfo.forEach(info => {
      doc.text(`• ${info}`, 60, doc.y, { width: 475 });
    });

    doc.moveDown(2);

    // Problem description
    doc.fontSize(14)
       .fillColor('#1f2937')
       .text('Problem Description', { underline: true })
       .fontSize(11)
       .fillColor('#4b5563')
       .moveDown(0.5)
       .text(diagnosticData.problemDescription || diagnosticData.problem_description || 'No description provided')
       .moveDown();

    // Symptoms
    if (diagnosticData.symptoms) {
      doc.fontSize(14)
         .fillColor('#1f2937')
         .text('Reported Symptoms', { underline: true })
         .fontSize(11)
         .fillColor('#4b5563')
         .moveDown(0.5);
      
      const symptoms = Array.isArray(diagnosticData.symptoms) 
        ? diagnosticData.symptoms 
        : [diagnosticData.symptoms];
      
      symptoms.forEach(symptom => {
        doc.text(`• ${symptom}`);
      });
      doc.moveDown();
    }

    // Error codes
    if (diagnosticData.errorCodes || diagnosticData.error_codes) {
      doc.fontSize(14)
         .fillColor('#1f2937')
         .text('Error Codes', { underline: true })
         .fontSize(11)
         .fillColor('#4b5563')
         .moveDown(0.5)
         .text(diagnosticData.errorCodes || diagnosticData.error_codes)
         .moveDown();
    }

    // Add new page for analysis
    doc.addPage();

    // Analysis header
    doc.fontSize(18)
       .fillColor('#2563eb')
       .text('AI Diagnostic Analysis', { align: 'center' })
       .moveDown();

    // Analysis content
    if (analysisResult) {
      // Split analysis into sections
      const sections = analysisResult.split(/\n(?=[🌀-🏿]|[🐀-🙏]|[🚀-🛿]|\d+\.|[A-Z][A-Z]+:)/g);
      
      sections.forEach(section => {
        const lines = section.trim().split('\n');
        if (lines.length > 0) {
          // Check if it's a header (starts with emoji or number)
          const isHeader = /^([🌀-🏿]|[🐀-🙏]|[🚀-🛿]|\d+\.|[A-Z][A-Z]+:)/.test(lines[0]);
          
          if (isHeader) {
            doc.fontSize(13)
               .fillColor('#1f2937')
               .text(lines[0], { continued: false })
               .moveDown(0.3);
            
            // Rest of the section
            if (lines.length > 1) {
              doc.fontSize(10)
                 .fillColor('#4b5563')
                 .text(lines.slice(1).join('\n'), { 
                   width: 495, 
                   align: 'justify',
                   indent: 10
                 })
                 .moveDown(0.8);
            }
          } else {
            doc.fontSize(10)
               .fillColor('#4b5563')
               .text(section, { 
                 width: 495, 
                 align: 'justify' 
               })
               .moveDown(0.8);
          }
        }
      });
    } else {
      doc.fontSize(12)
         .fillColor('#6b7280')
         .text('Analysis pending or not available.', { align: 'center' });
    }

    // Footer on last page
    doc.fontSize(9)
       .fillColor('#9ca3af')
       .text('\n\nThis report is for informational purposes only. Always consult with a qualified mechanic for final diagnosis and repairs.', {
         align: 'center',
         width: 495
       });

    // Finalize PDF
    doc.end();

    // Wait for PDF generation to complete
    const pdfBuffer = await new Promise((resolve) => {
      doc.on('end', () => {
        resolve(Buffer.concat(buffers));
      });
    });

    console.log('PDF generated successfully, size:', pdfBuffer.length);

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="DiagnosticPro_Report_${submissionId}.pdf"`);
    res.setHeader('Content-Length', pdfBuffer.length);

    // Send PDF
    res.status(200).send(pdfBuffer);

  } catch (error) {
    console.error('Error generating PDF:', error);
    res.status(500).json({
      error: 'Failed to generate PDF',
      message: error.message
    });
  }
};