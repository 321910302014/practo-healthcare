import express from "express";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { v4 as uuidv4 } from "uuid";
import axios from "axios";
import appointmentModel from "../models/appointmentModel.js";

dotenv.config();

const router = express.Router();

const signAppToken = (room_id, user_id, role) => {
  const now = Math.floor(Date.now() / 1000);
  return jwt.sign(
    {
      access_key: process.env.HMS_APP_ACCESS_KEY,
      type: "app",
      version: 2,
      iat: now,
      nbf: now,
      exp: now + 24 * 60 * 60,
      room_id,
      role,
      user_id,
      jti: uuidv4(),
    },
    process.env.HMS_APP_SECRET,
    { algorithm: "HS256" }
  );
};

const signManagementToken = () => {
  const now = Math.floor(Date.now() / 1000);
  return jwt.sign(
    {
      access_key: process.env.HMS_APP_ACCESS_KEY,
      type: "management",
      version: 2,
      iat: now,
      nbf: now,
      exp: now + 10 * 60,
      jti: uuidv4(),
    },
    process.env.HMS_APP_SECRET,
    { algorithm: "HS256" }
  );
};

// Create (or reuse) a dedicated 100ms room for an appointment.
// Falls back to the shared HMS_ROOM_ID room if the 100ms API is unreachable.
const getRoomForAppointment = async (appointment) => {
  if (appointment.hmsRoomId) return appointment.hmsRoomId;

  let roomId = process.env.HMS_ROOM_ID;
  try {
    const mgmtToken = signManagementToken();
    const headers = { Authorization: `Bearer ${mgmtToken}` };

    const template = await axios.get(
      `https://api.100ms.live/v2/rooms/${process.env.HMS_ROOM_ID}`,
      { headers }
    );

    const created = await axios.post(
      "https://api.100ms.live/v2/rooms",
      {
        name: `appt-${appointment._id}`,
        description: `Consultation room for appointment ${appointment._id}`,
        template_id: template.data.template_id,
      },
      { headers }
    );
    roomId = created.data.id;
  } catch (err) {
    // 100ms may reject duplicate room names on retry — look the room up by name.
    const duplicate = err.response?.status === 400;
    if (duplicate) {
      try {
        const mgmtToken = signManagementToken();
        const existing = await axios.get(
          `https://api.100ms.live/v2/rooms?name=appt-${appointment._id}`,
          { headers: { Authorization: `Bearer ${mgmtToken}` } }
        );
        if (existing.data?.data?.[0]?.id) roomId = existing.data.data[0].id;
      } catch (lookupErr) {
        console.error("100ms room lookup failed:", lookupErr.message);
      }
    } else {
      console.error("100ms room creation failed, using shared room:", err.message);
    }
  }

  await appointmentModel.findByIdAndUpdate(appointment._id, { hmsRoomId: roomId });
  return roomId;
};

/**
 * POST /api/100ms/join-appointment
 * Body: { appointmentId }
 * Auth: patient via `token` header, doctor/admin via `Authorization: Bearer`.
 * Returns a 100ms auth token for a room dedicated to that appointment.
 */
router.post("/join-appointment", async (req, res) => {
  try {
    const { appointmentId } = req.body;
    if (!appointmentId) {
      return res.status(400).json({ success: false, message: "appointmentId is required" });
    }

    const rawToken =
      req.headers.token ||
      (req.headers.authorization?.startsWith("Bearer ")
        ? req.headers.authorization.split(" ")[1]
        : null);
    if (!rawToken) {
      return res.status(401).json({ success: false, message: "Not Authorized. Login Again." });
    }

    let decoded;
    try {
      decoded = jwt.verify(rawToken, process.env.JWT_SECRET);
    } catch (e) {
      return res.status(401).json({ success: false, message: "Invalid or expired token." });
    }

    const appointment = await appointmentModel.findById(appointmentId);
    if (!appointment) {
      return res.status(404).json({ success: false, message: "Appointment not found" });
    }
    if (appointment.cancelled) {
      return res.status(400).json({ success: false, message: "This appointment was cancelled" });
    }

    const isPatient = decoded.id && decoded.id === String(appointment.userId);
    const isDoctor = decoded.id && decoded.id === String(appointment.docId);
    const isAdmin = decoded.email && decoded.email === process.env.ADMIN_EMAIL;
    if (!isPatient && !isDoctor && !isAdmin) {
      return res.status(403).json({ success: false, message: "You are not part of this appointment" });
    }

    const roomId = await getRoomForAppointment(appointment);
    const userName = isDoctor
      ? `Dr. ${appointment.docData?.name || "Doctor"}`.replace(/^Dr\. Dr\.?\s*/i, "Dr. ")
      : isAdmin
        ? "Admin"
        : appointment.userData?.name || "Patient";
    const userId = isAdmin ? "admin" : decoded.id;

    const token = signAppToken(roomId, userId, "broadcaster");
    return res.json({ success: true, token, room_id: roomId, userName });
  } catch (err) {
    console.error("join-appointment failed:", err);
    return res.status(500).json({ success: false, message: "Failed to join video call" });
  }
});

router.post("/generate-token", (req, res) => {
  const { room_id, user_id, role = "viewer" } = req.body;

  if (!room_id || !user_id) {
    return res.status(400).json({ error: "room_id and user_id are required" });
  }

  if (!["broadcaster", "viewer", "viewer-on-stage"].includes(role)) {
    return res.status(400).json({ error: "Invalid role provided" });
  }

  const payload = {
    access_key: process.env.HMS_APP_ACCESS_KEY,
    type: "app",
    version: 2,
    iat: Math.floor(Date.now() / 1000),
    nbf: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 24 * 60 * 60, // valid for 24h
    room_id,
    role,
    user_id,
    jti: uuidv4(),
  };

  try {
    const token = jwt.sign(payload, process.env.HMS_APP_SECRET, {
      algorithm: "HS256",
    });
    return res.json({ token });
  } catch (err) {
    console.error("❌ Failed to sign token:", err);
    return res.status(500).json({ error: "Failed to generate token" });
  }
});

export default router;
