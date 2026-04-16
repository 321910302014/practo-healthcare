import express from "express";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { v4 as uuidv4 } from "uuid";
import appointmentModel from "../models/appointmentModel.js";
import authDoctorOrAdmin from "../middleware/authDoctorOrAdmin.js";
import authUser from "../middleware/authUser.js";

dotenv.config();

const router = express.Router();

const HMS_API_BASE = "https://api.100ms.live/v2";

const buildManagementToken = () => {
  if (!process.env.HMS_APP_ACCESS_KEY || !process.env.HMS_APP_SECRET) return null;
  return jwt.sign(
    {
      access_key: process.env.HMS_APP_ACCESS_KEY,
      type: "management",
      version: 2,
      iat: Math.floor(Date.now() / 1000),
      nbf: Math.floor(Date.now() / 1000),
    },
    process.env.HMS_APP_SECRET,
    { algorithm: "HS256", expiresIn: "24h", jwtid: uuidv4() }
  );
};

const createHmsRoom = async (name) => {
  const managementToken = buildManagementToken();
  if (!managementToken) return null;

  const body = { name, description: "Prescripta video consultation" };
  if (process.env.HMS_TEMPLATE_ID) body.template_id = process.env.HMS_TEMPLATE_ID;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const response = await fetch(`${HMS_API_BASE}/rooms`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${managementToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    if (!response.ok) {
      const text = await response.text();
      console.warn("100ms room create failed:", response.status, text);
      return null;
    }
    const data = await response.json();
    return data?.id || null;
  } catch (err) {
    console.warn("100ms room create error:", err.name === 'AbortError' ? 'timeout' : err.message);
    return null;
  } finally {
    clearTimeout(timeout);
  }
};

const resolveRoomForAppointment = async (appointmentId) => {
  const appointment = await appointmentModel.findById(appointmentId);
  if (!appointment) return { error: "Appointment not found", status: 404 };

  if (appointment.hmsRoomId) {
    return { roomId: appointment.hmsRoomId, appointment, fallback: false };
  }

  const created = await createHmsRoom(`appointment-${appointmentId}`);
  if (created) {
    appointment.hmsRoomId = created;
    await appointment.save();
    return { roomId: created, appointment, fallback: false };
  }

  if (process.env.HMS_ROOM_ID) {
    return { roomId: process.env.HMS_ROOM_ID, appointment, fallback: true };
  }

  return { error: "Video service not configured", status: 500 };
};

const signAppToken = ({ roomId, userId, role }) => {
  const payload = {
    access_key: process.env.HMS_APP_ACCESS_KEY,
    type: "app",
    version: 2,
    iat: Math.floor(Date.now() / 1000),
    nbf: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 24 * 60 * 60,
    room_id: roomId,
    user_id: userId,
    role,
    jti: uuidv4(),
  };
  return jwt.sign(payload, process.env.HMS_APP_SECRET, { algorithm: "HS256" });
};

// Patient joining their own appointment
router.post("/appointment-token", authUser, async (req, res) => {
  try {
    const { appointmentId } = req.body;
    if (!appointmentId) {
      return res.status(400).json({ success: false, message: "appointmentId is required" });
    }

    const resolved = await resolveRoomForAppointment(appointmentId);
    if (resolved.error) {
      return res.status(resolved.status || 500).json({ success: false, message: resolved.error });
    }

    if (String(resolved.appointment.userId) !== String(req.body.userId)) {
      return res.status(403).json({ success: false, message: "Not authorized for this appointment" });
    }

    const token = signAppToken({
      roomId: resolved.roomId,
      userId: req.body.userId,
      role: "broadcaster",
    });

    return res.json({ success: true, token, roomId: resolved.roomId, fallback: resolved.fallback });
  } catch (err) {
    console.error("Patient appointment-token error:", err);
    return res.status(500).json({ success: false, message: "Failed to issue video token" });
  }
});

// Doctor or admin joining an appointment's call
router.post("/appointment-token-clinician", authDoctorOrAdmin, async (req, res) => {
  try {
    const { appointmentId } = req.body;
    if (!appointmentId) {
      return res.status(400).json({ success: false, message: "appointmentId is required" });
    }

    const resolved = await resolveRoomForAppointment(appointmentId);
    if (resolved.error) {
      return res.status(resolved.status || 500).json({ success: false, message: resolved.error });
    }

    if (req.user) {
      if (String(resolved.appointment.docId) !== String(req.user._id)) {
        return res.status(403).json({ success: false, message: "Not authorized for this appointment" });
      }
    }

    const userId = req.user?._id?.toString() || req.admin?.email || `clinician-${uuidv4()}`;
    const token = signAppToken({
      roomId: resolved.roomId,
      userId,
      role: "broadcaster",
    });

    return res.json({ success: true, token, roomId: resolved.roomId, fallback: resolved.fallback });
  } catch (err) {
    console.error("Clinician appointment-token error:", err);
    return res.status(500).json({ success: false, message: "Failed to issue video token" });
  }
});

// Legacy raw token endpoint — kept for backwards compatibility
router.post("/generate-token", (req, res) => {
  const { room_id, user_id, role = "viewer" } = req.body;

  if (!room_id || !user_id) {
    return res.status(400).json({ error: "room_id and user_id are required" });
  }

  if (!["broadcaster", "viewer", "viewer-on-stage"].includes(role)) {
    return res.status(400).json({ error: "Invalid role provided" });
  }

  try {
    const token = signAppToken({ roomId: room_id, userId: user_id, role });
    return res.json({ token });
  } catch (err) {
    console.error("Failed to sign token:", err);
    return res.status(500).json({ error: "Failed to generate token" });
  }
});

export default router;
