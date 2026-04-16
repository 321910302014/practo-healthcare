import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import validator from "validator";
import userModel from "../models/userModel.js";
import doctorModel from "../models/doctorModel.js";
import appointmentModel from "../models/appointmentModel.js";
import { v2 as cloudinary } from 'cloudinary';
import stripe from "stripe";
import Insurance from "../models/Insurance.js";

import nodemailer from 'nodemailer';
import sendEmail from '../utils/emailService.js'; 

// Stripe instance
const stripeInstance = new stripe(process.env.STRIPE_SECRET_KEY);

// Nodemailer transporter
const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 10000,
});

// ========= OTP FUNCTIONS =========

// Send OTP
const sendOTP = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await userModel.findOne({ email });
        if (!user) return res.json({ success: false, message: 'User not found' });

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpires = Date.now() + 5 * 60 * 1000;

        await userModel.updateOne({ email }, { otp, otpExpires });

        transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Your OTP Code',
            text: `Your OTP is ${otp}. It is valid for 5 minutes.`
        }).catch(err => console.error('OTP email failed (non-blocking):', err.message));

        res.json({ success: true, message: 'OTP sent' });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

const sendResetOTP = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await userModel.findOne({ email });
        if (!user) return res.json({ success: false, message: 'User not found' });

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpires = Date.now() + 5 * 60 * 1000;

        user.resetOtp = otp;
        user.resetOtpExpires = otpExpires;
        await user.save();

        transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Password Reset OTP',
            text: `Your password reset OTP is ${otp}. It is valid for 5 minutes.`
        }).catch(err => console.error('Reset OTP email failed (non-blocking):', err.message));

        res.json({ success: true, message: 'OTP sent to email' });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};


const verifyOtp = async (req, res) => {
    try {
        const { email, otp } = req.body;
        const user = await userModel.findOne({ email });

        if (!user) return res.json({ success: false, message: 'User not found' });
        if (user.isEmailVerified) return res.json({ success: false, message: 'User already verified' });
        if (user.otp !== otp) return res.json({ success: false, message: 'Invalid OTP' });
        if (Date.now() > user.otpExpires) return res.json({ success: false, message: 'OTP expired' });

        user.isEmailVerified = true;
        user.otp = undefined;
        user.otpExpires = undefined;
        await user.save();

        res.json({ success: true, message: 'Email verified successfully. You can now log in.' });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};


// Reset Password
const resetPassword = async (req, res) => {
    try {
        const { email, newPassword } = req.body;
        const user = await userModel.findOne({ email });

        if (!user || !user.resetVerified) {
            return res.json({ success: false, message: 'OTP not verified or session expired' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        user.password = hashedPassword;

        // ✅ Reset fields after password is changed
        user.resetOtp = undefined;
        user.resetOtpExpires = undefined;
        user.resetVerified = false;

        await user.save();

        res.json({ success: true, message: 'Password reset successful' });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};


// ========= USER AUTH =========

const registerUser = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.json({ success: false, message: 'Missing Details' });
        }

        if (!validator.isEmail(email)) {
            return res.json({ success: false, message: "Please enter a valid email" });
        }

        if (password.length < 8) {
            return res.json({ success: false, message: "Password must be at least 8 characters" });
        }

        const existingUser = await userModel.findOne({ email });
        if (existingUser) {
            return res.json({ success: false, message: 'Email already registered' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = new userModel({
            name,
            email,
            password: hashedPassword,
            isEmailVerified: true
        });

        await newUser.save();

        const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET);

        res.json({ success: true, token, message: 'Account created successfully' });

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};


const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await userModel.findOne({ email });

        if (!user) return res.json({ success: false, message: "User not found" });

        if (!user.isEmailVerified) {
            return res.json({ success: false, message: "Email not verified. Please complete verification." });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.json({ success: false, message: "Invalid credentials" });

        if (user.twoFactorEnabled) {
            return res.json({ success: true, twoFactorRequired: true, email: user.email });
        }

        // No 2FA, generate token
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
        res.json({ success: true, token });

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};


// ========= USER PROFILE =========

const getProfile = async (req, res) => {
    try {
        const { userId } = req.body;
        const userData = await userModel.findById(userId).select('-password');
        res.json({ success: true, userData });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

const updateProfile = async (req, res) => {
    try {
        const { userId, name, phone, address, dob, gender } = req.body;
        const imageFile = req.file;

        if (!name || !phone || !dob || !gender) {
            return res.json({ success: false, message: "Data Missing" });
        }

        await userModel.findByIdAndUpdate(userId, {
            name,
            phone,
            address: JSON.parse(address),
            dob,
            gender
        });

        if (imageFile) {
            const imageUpload = await cloudinary.uploader.upload(imageFile.path, { resource_type: "image" });
            const imageURL = imageUpload.secure_url;
            await userModel.findByIdAndUpdate(userId, { image: imageURL });
        }

        res.json({ success: true, message: 'Profile Updated' });

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

const getAppointmentById = async (req, res) => {
  try {
    const appointment = await appointmentModel.findById(req.params.id);
    if (!appointment) {
      return res.json({ success: false, message: 'Appointment not found' });
    }
    res.json({ success: true, appointment });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};


// ========= APPOINTMENTS =========

const bookAppointment = async (req, res) => {
  try {
    const {
      userId,
      docId,
      slotDate,
      slotTime,
      insuranceId,
      payInClinic,
      isVideoConsultation
    } = req.body;

    console.log("📌 bookAppointment called", { docId, userId, slotDate, slotTime, insuranceId, payInClinic, isVideoConsultation });

    if (!docId || !slotDate || !slotTime) {
      return res.json({ success: false, message: "Missing required booking fields" });
    }

    const doc = await doctorModel.findById(docId).select("-password");

    if (!doc) {
      console.log("⚠️  bookAppointment: doctor not found", docId);
      return res.json({ success: false, message: "Doctor not found" });
    }
    if (!doc.available) {
      console.log("⚠️  bookAppointment: doctor unavailable", docId);
      return res.json({ success: false, message: "Doctor is currently unavailable" });
    }

    const baseFee = typeof doc.fees === 'number' ? doc.fees : doc.fee;
    if (!baseFee || isNaN(baseFee)) {
      console.log("⚠️  bookAppointment: fee invalid", doc.fees, doc.fee);
      return res.status(400).json({ success: false, message: "Doctor fee is missing or invalid." });
    }

    const slots_booked = { ...doc.slots_booked };
    if (slots_booked[slotDate]?.includes(slotTime)) {
      console.log("⚠️  bookAppointment: slot already booked", slotDate, slotTime);
      return res.json({ success: false, message: "Slot not available" });
    } else {
      slots_booked[slotDate] = [...(slots_booked[slotDate] || []), slotTime];
    }

    const user = await userModel.findById(userId).select("-password");
    if (!user) {
      console.log("⚠️  bookAppointment: user not found", userId);
      return res.json({ success: false, message: "User not found" });
    }

    let finalAmount = baseFee;
    let selectedInsurance = null;

    if (insuranceId) {
      const insurance = await Insurance.findById(insuranceId);
      if (!insurance) {
        console.log("⚠️  bookAppointment: insurance not found", insuranceId);
        return res.json({ success: false, message: "Selected insurance not found" });
      }
      selectedInsurance = insurance.toObject();
      finalAmount = baseFee * 0.1; // 90% off
    }

    if (isNaN(finalAmount)) {
      return res.status(400).json({ success: false, message: "Fee calculation error" });
    }

    // ✅ Enforce rule: Video Consultations require online payment
    if (isVideoConsultation && payInClinic) {
      return res.status(400).json({
        success: false,
        message: "Video consultations require online payment."
      });
    }

    // Build appointment datetime — accepts "10:30 AM", "10:30 am", or "14:30"
    const [day, month, year] = slotDate.split('_').map(Number);
    const timeMatch = String(slotTime).trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
    if (!timeMatch || !day || !month || !year) {
      console.log("⚠️  bookAppointment: bad date/time format", slotDate, slotTime);
      return res.status(400).json({ success: false, message: "Invalid slot date or time format" });
    }
    let hours = parseInt(timeMatch[1], 10);
    const minutes = parseInt(timeMatch[2], 10);
    const modifier = timeMatch[3]?.toUpperCase();
    if (modifier === 'PM' && hours !== 12) hours += 12;
    if (modifier === 'AM' && hours === 12) hours = 0;
    const appointmentDateTime = new Date(year, month - 1, day, hours, minutes, 0);

    const appointment = new appointmentModel({
      userId,
      docId,
      userData: user.toObject(),
      docData: { ...doc.toObject(), slots_booked: undefined },
      amount: Number(finalAmount),
      slotDate,
      slotTime,
      date: appointmentDateTime,
      insurance: selectedInsurance || undefined,
      payment: payInClinic ? false : undefined, // leave undefined for Stripe until verified
      videoConsultation: isVideoConsultation || false
    });

    await appointment.save();
    await doctorModel.findByIdAndUpdate(docId, { slots_booked });

    // Fire-and-forget confirmation email (don't block booking response on SMTP latency)
    if (user?.email && (!isVideoConsultation || (isVideoConsultation && !payInClinic))) {
      const subject = '✅ Appointment Confirmed - Prescripta HealthCare';
      const message = `
Hi ${user.name || 'Patient'},

Your appointment with Dr. ${doc.name} is confirmed.

🗓 Date: ${slotDate}
⏰ Time: ${slotTime}
💳 Fee: ${Number(finalAmount).toFixed(2)} ${process.env.CURRENCY?.toUpperCase() || 'USD'}
${isVideoConsultation ? '📹 This is a video consultation.\n' : ''}
${payInClinic ? '💡 Please pay at the clinic reception during your visit.\n' : ''}

Thank you for choosing Prescripta HealthCare.
      `;
      sendEmail(user.email, subject, message).catch(err =>
        console.error('Confirmation email failed (non-blocking):', err.message)
      );
    }

    console.log("✅ bookAppointment: saved", appointment._id.toString());
    return res.json({ success: true, message: "Appointment Booked", appointment });

  } catch (error) {
    console.error("❌ bookAppointment error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};


const cancelAppointment = async (req, res) => {
  try {
    const { userId, appointmentId } = req.body;
    const appointmentData = await appointmentModel.findById(appointmentId);

    if (!appointmentData) {
      return res.json({ success: false, message: 'Appointment not found' });
    }

    if (appointmentData.userId !== userId) {
      return res.json({ success: false, message: 'Unauthorized action' });
    }

    await appointmentModel.findByIdAndUpdate(appointmentId, { cancelled: true });

    const { docId, slotDate, slotTime, userData, docData } = appointmentData;

    const doctorData = await doctorModel.findById(docId);

    if (!doctorData) {
      return res.json({ success: false, message: 'Doctor not found' });
    }

    let slots_booked = doctorData.slots_booked || {};
    if (slots_booked[slotDate]) {
      slots_booked[slotDate] = slots_booked[slotDate].filter(e => e !== slotTime);

      // If the array is now empty, delete the key
      if (slots_booked[slotDate].length === 0) {
        delete slots_booked[slotDate];
      }
    }

    await doctorModel.findByIdAndUpdate(docId, { slots_booked });

    // ✅ Send cancellation email to user
    if (userData?.email && docData?.name) {
      const subject = "❌ Appointment Cancelled - Prescripta HealthCare";
      const message = `
Hi ${userData.name || "Patient"},

Your appointment with Dr. ${docData.name} has been cancelled.

🗓 Date: ${slotDate}
⏰ Time: ${slotTime}

If this was a mistake, you may book another appointment anytime.

Regards,  
Prescripta HealthCare Team
      `;

      sendEmail(userData.email, subject, message).catch(err =>
        console.error('Cancellation email failed (non-blocking):', err.message)
      );
    }

    res.json({ success: true, message: 'Appointment Cancelled' });
  } catch (error) {
    console.log("❌ cancelAppointment error:", error);
    res.json({ success: false, message: error.message });
  }
};

const listAppointment = async (req, res) => {
    try {

        const { userId } = req.body; // from auth middleware (sets req.body.userId)

        const appointments = await appointmentModel.find({ userId });

        res.json({
            success: true,
            appointments
        });

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

const switchAppointmentMode = async (req, res) => {
  try {
    const { appointmentId, newMode } = req.body;

    const appointment = await appointmentModel.findById(appointmentId);
    if (!appointment || appointment.cancelled) {
      return res.status(404).json({ success: false, message: "Appointment not found" });
    }

    // Validate switch
    if (newMode !== "video" && newMode !== "in-clinic") {
      return res.status(400).json({ success: false, message: "Invalid mode" });
    }

    const alreadyPaid = appointment.payment === true;

    // Video consultation switch
    if (newMode === "video") {
      if (!alreadyPaid) {
        appointment.videoConsultation = true;
        await appointment.save();
        return res.json({ success: true, message: "Switched to video mode. Please pay online." });
      } else {
        appointment.videoConsultation = true;
        await appointment.save();

        // Send confirmation email (non-blocking)
        if (appointment.userData?.email) {
          sendEmail(appointment.userData.email, '✅ Video Appointment Confirmed', `
Hi ${appointment.userData.name},

Your appointment with Dr. ${appointment.docData.name} has been changed to a video consultation.

🗓 Date: ${appointment.slotDate}
⏰ Time: ${appointment.slotTime}
✅ Paid already — Join link will be available at the appointment time.

Prescripta HealthCare
          `).catch(err => console.error('Switch-mode email failed (non-blocking):', err.message));
        }

        return res.json({ success: true, message: "Switched to video mode. You can join directly." });
      }
    }

    // In-clinic switch
    if (newMode === "in-clinic") {
      appointment.videoConsultation = false;
      await appointment.save();

      if (appointment.userData?.email) {
        sendEmail(appointment.userData.email, '✅ In-Clinic Appointment Confirmed', `
Hi ${appointment.userData.name},

Your appointment with Dr. ${appointment.docData.name} has been changed to an in-clinic visit.

🗓 Date: ${appointment.slotDate}
⏰ Time: ${appointment.slotTime}
💡 You may pay in clinic or keep your online payment.

Prescripta HealthCare
        `).catch(err => console.error('Switch-mode email failed (non-blocking):', err.message));
      }

      return res.json({ success: true, message: "Switched to in-clinic mode." });
    }

  } catch (err) {
    console.error("❌ switchAppointmentMode error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};


// ========= PAYMENTS =========

const paymentStripe = async (req, res) => {
  try {
    const { appointmentId } = req.body;
    const { origin } = req.headers;

    const appointmentData = await appointmentModel.findById(appointmentId);

    if (!appointmentData || appointmentData.cancelled) {
      return res.json({ success: false, message: 'Appointment Cancelled or not found' });
    }

    const amount = Number(appointmentData.amount);

    if (isNaN(amount) || amount <= 0) {
      console.log('❌ Invalid appointment amount:', appointmentData.amount);
      return res.json({ success: false, message: 'Invalid appointment amount' });
    }

    const currency = (process.env.CURRENCY || 'usd').toLowerCase();

    const line_items = [{
      price_data: {
        currency,
        product_data: { name: "Appointment Fees" },
        unit_amount: Math.round(amount * 100), // Stripe wants amount in cents
      },
      quantity: 1,
    }];

    const session = await stripeInstance.checkout.sessions.create({
      success_url: `${origin}/verify?success=true&appointmentId=${appointmentData._id}`,
      cancel_url: `${origin}/verify?success=false&appointmentId=${appointmentData._id}`,
      line_items,
      mode: 'payment',
    });

    res.json({ success: true, session_url: session.url });
  } catch (error) {
    console.error('Stripe payment error:', error);
    res.json({ success: false, message: error.message });
  }
};


const verifyResetOTP = async (req, res) => {
    const { email, otp } = req.body;

    try {
        const user = await userModel.findOne({ email });
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        if (user.resetOtp !== otp || Date.now() > user.resetOtpExpires) {
            return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
        }

        user.resetVerified = true; // ✅ Mark user as verified
        await user.save();

        res.json({ success: true, message: 'OTP verified. You can now reset your password.' });
    } catch (error) {
        console.error('Error verifying reset OTP:', error);
        res.status(500).json({ success: false, message: 'Server error verifying OTP' });
    }
};


  
const verifyStripe = async (req, res) => {
  try {
    const { appointmentId, success } = req.body;

    if (success === "true") {
      const updatedAppointment = await appointmentModel.findByIdAndUpdate(
        appointmentId,
        { payment: true },
        { new: true } // ✅ returns the updated document
      );

      if (!updatedAppointment) {
        return res.status(404).json({ success: false, message: 'Appointment not found' });
      }

      // ✅ Send confirmation email AFTER payment is marked
      const { userData, docData, slotDate, slotTime, amount } = updatedAppointment;

      if (userData?.email) {
        const subject = "✅ Appointment Confirmed - Prescripta HealthCare";
        const message = `
Hi ${userData.name || "Patient"},

🎉 Your payment was successful, and your appointment with Dr. ${docData?.name} is now confirmed.

🗓 Date: ${slotDate}
⏰ Time: ${slotTime}
💳 Paid: ${amount} ${process.env.CURRENCY?.toUpperCase() || 'USD'}

Thank you for choosing Prescripta HealthCare.

Regards,  
Prescripta HealthCare Team
        `;

        sendEmail(userData.email, subject, message).catch(err =>
          console.error('Payment confirmation email failed (non-blocking):', err.message)
        );
      }

      return res.json({ success: true, message: 'Payment Successful & Appointment Confirmed' });
    }

    return res.json({ success: false, message: 'Payment Failed' });

  } catch (error) {
    console.log("❌ verifyStripe error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const rescheduleAppointment = async (req, res) => {
  try {
    const { appointmentId, newSlotDate, newSlotTime } = req.body;

    const appointment = await appointmentModel.findById(appointmentId);
    if (!appointment || appointment.cancelled) {
      return res.status(404).json({ success: false, message: "Appointment not found" });
    }

    const doctor = await doctorModel.findById(appointment.docId);
    if (!doctor) return res.status(404).json({ success: false, message: "Doctor not found" });

    const slots_booked = { ...doctor.slots_booked };

    // Remove old slot
    const oldSlotList = slots_booked[appointment.slotDate] || [];
    slots_booked[appointment.slotDate] = oldSlotList.filter(t => t !== appointment.slotTime);
    if (slots_booked[appointment.slotDate].length === 0) delete slots_booked[appointment.slotDate];

    // Add new slot
    if (slots_booked[newSlotDate]?.includes(newSlotTime)) {
      return res.status(400).json({ success: false, message: "New slot already booked" });
    }
    slots_booked[newSlotDate] = [...(slots_booked[newSlotDate] || []), newSlotTime];

    // Update doctor slot record
    await doctorModel.findByIdAndUpdate(doctor._id, { slots_booked });

    // Update appointment details
    appointment.slotDate = newSlotDate;
    appointment.slotTime = newSlotTime;

    // ✅ Set correct appointment.date for reminder scheduler
    const [day, month, year] = newSlotDate.split('_').map(Number);
    const [time, meridian] = newSlotTime.split(' ');
    let [hours, minutes] = time.split(':').map(Number);
    if (meridian.toLowerCase() === 'pm' && hours !== 12) hours += 12;
    if (meridian.toLowerCase() === 'am' && hours === 12) hours = 0;

    appointment.date = new Date(year, month - 1, day, hours, minutes, 0);

    await appointment.save();

    // Send reschedule confirmation email
    if (appointment.userData?.email) {
      const subject = "🕐 Appointment Rescheduled - Prescripta HealthCare";
      const message = `
Hi ${appointment.userData.name},

Your appointment with Dr. ${appointment.docData.name} has been rescheduled.

New Slot:
🗓 ${newSlotDate}
⏰ ${newSlotTime}

Thank you for choosing Prescripta HealthCare.
      `;
      sendEmail(appointment.userData.email, subject, message).catch(err =>
        console.error('Reschedule email failed (non-blocking):', err.message)
      );
    }

    res.json({ success: true, message: "Appointment rescheduled", appointment });
  } catch (error) {
    console.error("❌ rescheduleAppointment error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};


// ========= EXPORT ALL =========

export {
    loginUser,
    registerUser,
    getProfile,
    updateProfile,
    bookAppointment,
    listAppointment,
    cancelAppointment,
    paymentStripe,
    verifyStripe,
    sendOTP,
    resetPassword,
    verifyOtp,
    sendResetOTP,
    rescheduleAppointment,
    getAppointmentById,
    verifyResetOTP,
    switchAppointmentMode
};
