import axios from 'axios';
import medicalReportModel from "../models/medicalReportModel.js";
import { v2 as cloudinary } from "cloudinary";
import userModel from "../models/userModel.js";
import sendEmail from "../utils/emailService.js";
import { getReportHTML } from "../utils/reportTemplate.js";
import { generateReportPDF } from "../utils/generateReportPDF.js";
import { validatePrescription } from "../utils/aiPrescriptionValidator.js";
import { extractTextFromImage } from "../utils/ocrService.js"; // 🆕 OCR

// ✅ Upload Medical Report with AI validation (only for prescriptions)
export const uploadMedicalReport = async (req, res) => {
  try {
    const { userId, chartData, chartImages, type } = req.body;
    const file = req.file;

    if (!file || !userId || !type) {
      return res.status(400).json({ success: false, message: "Missing file, userId, or type" });
    }

    // ✅ Upload to Cloudinary
    const result = await cloudinary.uploader.upload(file.path, {
      resource_type: "auto",
      type: "upload",
      access_mode: "public",
      folder: "medical-reports",
      use_filename: true,
      unique_filename: false
    });

    // ✅ Parse chart data/images
    const parsedChartData = chartData ? JSON.parse(chartData) : {};
    const parsedChartImages = chartImages ? JSON.parse(chartImages) : {};

    // ✅ Create base report object
    const report = new medicalReportModel({
      userId,
      reportName: file.originalname,
      fileUrl: result.secure_url,
      chartData: parsedChartData,
      type
    });

    // ✅ Run AI validation only for prescriptions
    try {
      if (type === "prescription") {
        // Extract text from uploaded file using OCR
        const extractedText = await extractTextFromImage(file.path);

        if (extractedText) {
          // Fetch user details for context (age/history)
          const user = await userModel.findById(userId);

          // Run AI validation
          const validationResult = await validatePrescription(extractedText, {
            age: user?.age,
            history: user?.medicalHistory
          });

          report.aiValidation = validationResult;
        }
      }
    } catch (aiErr) {
      console.error("⚠️ AI validation failed but continuing upload:", aiErr.message);
    }

    await report.save();

    // ✅ Email notification (Optional, shouldn't crash upload)
    try {
      const user = await userModel.findById(userId);
      if (user?.email) {
        const subject = '📄 New Medical Report Uploaded';
        const message = `Hi ${user.name || 'User'},\n\nYour new report "${file.originalname}" has been uploaded. \n\nYou can view it in your account under "My Reports".\n\nThank you,\nPrescripta HealthCare`;

        let attachments = [
          {
            path: result.secure_url,
            filename: file.originalname
          }
        ];

        // Try adding AI-generated PDF if possible
        try {
          const htmlContent = getReportHTML(user, report, parsedChartData, parsedChartImages);
          const pdfBuffer = await generateReportPDF(htmlContent);
          attachments.push({
            content: pdfBuffer,
            filename: `${file.originalname.replace(/\.[^/.]+$/, '')}-summary.pdf`
          });
        } catch (pdfErr) {
          console.error("⚠️ PDF generation failed for email attachment:", pdfErr.message);
        }

        await sendEmail(user.email, subject, message, attachments);
        console.log(`📧 Report email sent to ${user.email}`);
      }
    } catch (emailErr) {
      console.error("⚠️ Email notification failed:", emailErr.message);
    }

    res.status(201).json({ success: true, message: "Report uploaded", report });

  } catch (err) {
    console.error("❌ Upload failed:", err.message);
    res.status(500).json({ success: false, message: "Server error. Upload failed." });
  }
};

// ✅ Fetch user-specific reports
export const getUserReports = async (req, res) => {
  try {
    const { userId } = req.body;
    const reports = await medicalReportModel.find({ userId }).sort({ uploadedAt: -1 });
    res.json({ success: true, reports });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
