import jwt from "jsonwebtoken";
import doctorModel from "../models/doctorModel.js";

const authDoctor = async (req, res, next) => {
  try {

    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ success: false, message: "Not authorized" });
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const doctor = await doctorModel.findById(decoded.id).select("-password");

    if (!doctor) {
      return res.status(401).json({ success: false, message: "Doctor not found" });
    }

    req.user = doctor; // ✅ THIS IS THE IMPORTANT LINE

    next();

  } catch (error) {
    console.log(error);
    res.status(401).json({ success: false, message: "Token failed" });
  }
};

export default authDoctor;