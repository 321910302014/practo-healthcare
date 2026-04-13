import Tesseract from "tesseract.js";

export const extractTextFromImage = async (filePath) => {
  try {
    // Basic check if file is likely an image
    if (!filePath.match(/\.(jpg|jpeg|png|webp)$/i)) {
      console.log("ℹ️ Skipping OCR for non-image file:", filePath);
      return "";
    }

    const { data: { text } } = await Tesseract.recognize(filePath, "eng");
    return text.trim();
  } catch (err) {
    console.error("❌ OCR failed:", err.message);
    return "";
  }
};
