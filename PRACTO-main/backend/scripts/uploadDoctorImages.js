import { v2 as cloudinary } from 'cloudinary';
import 'dotenv/config';

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_SECRET_KEY
});

const images = [
    { name: 'male_general_physician', path: '/Users/venkatagunasundhargrandhe/.gemini/antigravity/brain/e8730b74-58d8-4ca2-9532-105d8e417f6e/male_general_physician_1773200683276.png' },
    { name: 'female_gynecologist', path: '/Users/venkatagunasundhargrandhe/.gemini/antigravity/brain/e8730b74-58d8-4ca2-9532-105d8e417f6e/female_gynecologist_1773200697972.png' },
    { name: 'female_dermatologist', path: '/Users/venkatagunasundhargrandhe/.gemini/antigravity/brain/e8730b74-58d8-4ca2-9532-105d8e417f6e/female_dermatologist_1773200711867.png' },
    { name: 'male_pediatrician', path: '/Users/venkatagunasundhargrandhe/.gemini/antigravity/brain/e8730b74-58d8-4ca2-9532-105d8e417f6e/male_pediatrician_1773200728378.png' },
    { name: 'male_neurologist', path: '/Users/venkatagunasundhargrandhe/.gemini/antigravity/brain/e8730b74-58d8-4ca2-9532-105d8e417f6e/male_neurologist_1773200739895.png' },
    { name: 'female_gastroenterologist', path: '/Users/venkatagunasundhargrandhe/.gemini/antigravity/brain/e8730b74-58d8-4ca2-9532-105d8e417f6e/female_gastroenterologist_1773200752026.png' },
    { name: 'male_cardiologist', path: '/Users/venkatagunasundhargrandhe/.gemini/antigravity/brain/e8730b74-58d8-4ca2-9532-105d8e417f6e/male_cardiologist_1773200766120.png' },
    { name: 'female_pulmonologist', path: '/Users/venkatagunasundhargrandhe/.gemini/antigravity/brain/e8730b74-58d8-4ca2-9532-105d8e417f6e/female_pulmonologist_1773200778572.png' }
];

const uploadImages = async () => {
    console.log('Starting image upload to Cloudinary...');
    const results = {};
    for (const img of images) {
        try {
            const result = await cloudinary.uploader.upload(img.path, {
                folder: 'doctors',
                public_id: img.name
            });
            results[img.name] = result.secure_url;
            console.log(`✅ Uploaded ${img.name}: ${result.secure_url}`);
        } catch (error) {
            console.error(`❌ Failed to upload ${img.name}:`, error.message);
        }
    }
    console.log('\n--- Final URLs ---');
    console.log(JSON.stringify(results, null, 2));
    process.exit();
};

uploadImages();
