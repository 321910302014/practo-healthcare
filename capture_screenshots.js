const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const BASE_URL = 'http://localhost:5179';
const SCREENSHOTS_DIR = path.join(__dirname, 'screenshots');

// Create screenshots directory
if (!fs.existsSync(SCREENSHOTS_DIR)) {
    fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

const screens = [
    { name: '01_home_page', url: '/', description: 'Home Page - Landing screen with hero banner and featured doctors' },
    { name: '02_doctors_listing', url: '/doctors', description: 'Doctors Listing - Browse and search healthcare providers' },
    { name: '03_doctors_speciality', url: '/doctors/Dermatologist', description: 'Doctors by Speciality - Filtered view of specialists' },
    { name: '04_login_page', url: '/login', description: 'Login/Registration - User authentication screen' },
    { name: '05_about_page', url: '/about', description: 'About Page - Platform information and mission' },
    { name: '06_contact_page', url: '/contact', description: 'Contact Page - Support and communication' },
];

async function captureScreenshots() {
    console.log('Starting screenshot capture...');

    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1920,1080']
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });

    const results = [];

    for (const screen of screens) {
        try {
            console.log(`Capturing: ${screen.name}...`);
            await page.goto(`${BASE_URL}${screen.url}`, {
                waitUntil: 'networkidle2',
                timeout: 30000
            });

            // Wait a bit for animations/images to load
            await page.evaluate(() => new Promise(resolve => setTimeout(resolve, 2000)));

            const filepath = path.join(SCREENSHOTS_DIR, `${screen.name}.png`);
            await page.screenshot({
                path: filepath,
                fullPage: false,
                type: 'png'
            });

            console.log(`  ✓ Saved: ${filepath}`);
            results.push({
                name: screen.name,
                path: filepath,
                description: screen.description,
                success: true
            });
        } catch (error) {
            console.error(`  ✗ Failed: ${screen.name} - ${error.message}`);
            results.push({
                name: screen.name,
                description: screen.description,
                success: false,
                error: error.message
            });
        }
    }

    // Capture a scroll of the home page for full content
    try {
        console.log('Capturing: Full Home Page (scrolled)...');
        await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle2', timeout: 30000 });
        await page.evaluate(() => new Promise(resolve => setTimeout(resolve, 2000)));

        const filepath = path.join(SCREENSHOTS_DIR, '07_home_full.png');
        await page.screenshot({
            path: filepath,
            fullPage: true,
            type: 'png'
        });
        console.log(`  ✓ Saved: ${filepath}`);
    } catch (error) {
        console.error(`  ✗ Failed: Full Home Page - ${error.message}`);
    }

    await browser.close();

    console.log('\nScreenshot capture complete!');
    console.log(`Screenshots saved to: ${SCREENSHOTS_DIR}`);

    // Write results to JSON for reference
    fs.writeFileSync(
        path.join(SCREENSHOTS_DIR, 'screenshot_info.json'),
        JSON.stringify(results, null, 2)
    );

    return results;
}

captureScreenshots().catch(console.error);
