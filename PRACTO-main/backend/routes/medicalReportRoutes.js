import express from "express";
import upload from "../middleware/multer.js";
import authDoctorOrAdmin from "../middleware/authDoctorOrAdmin.js";
import authUser from "../middleware/authUser.js";
import { uploadMedicalReport, getUserReports } from "../controllers/medicalReportController.js";

const router = express.Router();

// Admin or Doctor uploads report for a user
router.post("/upload", authDoctorOrAdmin, upload.single("report"), uploadMedicalReport);

// User views their own reports
router.get("/user", authUser, getUserReports);

export default router;
