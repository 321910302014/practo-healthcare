import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import doctorModel from '../models/doctorModel.js';
import 'dotenv/config';

const doctors = [
    {
        name: 'Dr. David Chen',
        email: 'chen@gmail.com',
        password: 'password123',
        image: 'https://res.cloudinary.com/dlzcqgsbd/image/upload/v1773200814/doctors/male_general_physician.png',
        speciality: 'General physician',
        degree: 'MBBS',
        experience: '4 Years',
        about: 'Dr. David is committed to delivering comprehensive medical care, focusing on preventive medicine and early diagnosis.',
        fees: 50,
        address: { line1: '17th Cross, Richmond', line2: 'Circle, Ring Road, London' },
        available: true,
        date: Date.now()
    },
    {
        name: 'Dr. Sarah Jenkins',
        email: 'jenkins@gmail.com',
        password: 'password123',
        image: 'https://res.cloudinary.com/dlzcqgsbd/image/upload/v1773200814/doctors/female_gynecologist.png',
        speciality: 'Gynecologist',
        degree: 'MBBS',
        experience: '3 Years',
        about: 'Dr. Sarah specializes in women health and has over 3 years of experience in gynecology.',
        fees: 60,
        address: { line1: '27th Cross, Richmond', line2: 'Circle, Ring Road, London' },
        available: true,
        date: Date.now()
    },
    {
        name: 'Dr. Sarah Jensen',
        email: 'jensen@gmail.com',
        password: 'password123',
        image: 'https://res.cloudinary.com/dlzcqgsbd/image/upload/v1773200815/doctors/female_dermatologist.png',
        speciality: 'Dermatologist',
        degree: 'MBBS',
        experience: '1 Years',
        about: 'Dr. Sarah is an expert in skin treatments and cosmetic procedures.',
        fees: 30,
        address: { line1: '37th Cross, Richmond', line2: 'Circle, Ring Road, London' },
        available: true,
        date: Date.now()
    },
    {
        name: 'Dr. Michael Chen',
        email: 'mchen@gmail.com',
        password: 'password123',
        image: 'https://res.cloudinary.com/dlzcqgsbd/image/upload/v1773200816/doctors/male_pediatrician.png',
        speciality: 'Pediatricians',
        degree: 'MBBS',
        experience: '2 Years',
        about: 'Dr. Michael loves working with children and providing the best pediatric care.',
        fees: 40,
        address: { line1: '47th Cross, Richmond', line2: 'Circle, Ring Road, London' },
        available: true,
        date: Date.now()
    },
    {
        name: 'Dr. Alexander Thorne',
        email: 'thorne@gmail.com',
        password: 'password123',
        image: 'https://res.cloudinary.com/dlzcqgsbd/image/upload/v1773200817/doctors/male_neurologist.png',
        speciality: 'Neurologist',
        degree: 'MBBS',
        experience: '5 Years',
        about: 'Dr. Alexander specializes in complex neurological disorders and brain health.',
        fees: 80,
        address: { line1: '57th Cross, Richmond', line2: 'Circle, Ring Road, London' },
        available: true,
        date: Date.now()
    },
    {
        name: 'Dr. Sarah Parker',
        email: 'parker@gmail.com',
        password: 'password123',
        image: 'https://res.cloudinary.com/dlzcqgsbd/image/upload/v1773200818/doctors/female_gastroenterologist.png',
        speciality: 'Gastroenterologist',
        degree: 'MBBS',
        experience: '4 Years',
        about: 'Dr. Sarah is an expert in digestive system health and modern gastroenterology.',
        fees: 55,
        address: { line1: '67th Cross, Richmond', line2: 'Circle, Ring Road, London' },
        available: true,
        date: Date.now()
    },
    {
        name: 'Dr. Arthur Vance',
        email: 'vance@gmail.com',
        password: 'password123',
        image: 'https://res.cloudinary.com/dlzcqgsbd/image/upload/v1773200819/doctors/male_cardiologist.png',
        speciality: 'Cardiologist',
        degree: 'MBBS',
        experience: '8 Years',
        about: 'Dr. Arthur is a leading expert in heart health and cardiovascular treatments.',
        fees: 90,
        address: { line1: '77th Cross, Richmond', line2: 'Circle, Ring Road, London' },
        available: true,
        date: Date.now()
    },
    {
        name: 'Dr. Laura Jenkins',
        email: 'ljenkins@gmail.com',
        password: 'password123',
        image: 'https://res.cloudinary.com/dlzcqgsbd/image/upload/v1773200819/doctors/female_pulmonologist.png',
        speciality: 'Pulmonologist',
        degree: 'MBBS',
        experience: '3 Years',
        about: 'Dr. Laura provides expert care for respiratory issues and lung health.',
        fees: 50,
        address: { line1: '87th Cross, Richmond', line2: 'Circle, Ring Road, London' },
        available: true,
        date: Date.now()
    }
];

const seedDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI, { dbName: "prescripta" });
        console.log('Connected to DB');

        // 🔥 Clear existing doctors to remove broken entries like "Dr John"
        await doctorModel.deleteMany({});
        console.log('Cleared all existing doctors');

        for (const doc of doctors) {
            doc.password = await bcrypt.hash(doc.password, 10);
            const newDoc = new doctorModel(doc);
            await newDoc.save();
            console.log(`Added professional doctor: ${doc.name}`);
        }

        console.log('Professional seeding completed successfully!');
        process.exit();
    } catch (error) {
        console.error('Error seeding DB:', error);
        process.exit(1);
    }
};

seedDB();
