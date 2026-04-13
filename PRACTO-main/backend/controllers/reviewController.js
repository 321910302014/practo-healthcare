// backend/controllers/reviewController.js
import Review from "../models/reviewModel.js";
import Doctor from "../models/doctorModel.js";

// Add a new review
export const addReview = async (req, res) => {
  try {
    const { doctorId, rating, comment } = req.body;

    if (!doctorId || !rating) {
      return res.status(400).json({ success: false, message: "Doctor and rating are required" });
    }

    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({ success: false, message: "Doctor not found" });
    }

    const review = await Review.create({
      user: req.user.id,
      doctor: doctorId,
      rating: Number(rating),
      comment: comment || "",
    });

    // Recalculate doctor average rating
    const allReviews = await Review.find({ doctor: doctorId });
    const totalRating = allReviews.reduce((sum, r) => sum + r.rating, 0);
    const avgRating = totalRating / allReviews.length;

    await Doctor.findByIdAndUpdate(doctorId, {
      rating: parseFloat(avgRating.toFixed(1)),
      reviewsCount: allReviews.length,
      $push: {
        reviews: {
          userId: req.user.id,
          rating: Number(rating),
          comment: comment || "",
          date: new Date()
        }
      }
    });

    res.status(201).json({ success: true, message: "Rating submitted successfully", rating: avgRating });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Get all reviews for a doctor
export const getDoctorReviews = async (req, res) => {
  try {
    const { doctorId } = req.params;

    const reviews = await Review.find({ doctor: doctorId })
      .populate("user", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, reviews });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
