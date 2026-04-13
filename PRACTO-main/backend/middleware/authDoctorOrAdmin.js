import jwt from "jsonwebtoken";
import doctorModel from "../models/doctorModel.js";

const authDoctorOrAdmin = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({ success: false, message: "Not Authorized" });
        }

        const token = authHeader.split(" ")[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Check if it's an admin
        if (decoded.email === process.env.ADMIN_EMAIL) {
            req.admin = decoded;
            return next();
        }

        // Check if it's a doctor
        const doctor = await doctorModel.findById(decoded.id).select("-password");
        if (doctor) {
            req.user = doctor;
            return next();
        }

        return res.status(401).json({ success: false, message: "Not Authorized" });

    } catch (error) {
        console.error(error);
        res.status(401).json({ success: false, message: "Token failed" });
    }
};

export default authDoctorOrAdmin;
