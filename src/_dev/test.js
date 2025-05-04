import { chromium } from 'playwright';
async function bookTatkalTicket() {
    // Launch the browser
    const browser = await chromium.connectOverCDP('http://localhost:9222');

    // Create a new context with desktop user agent
    const context = await browser.newContext({
        viewport: { width: 1680, height: 1050 }, // Set viewport size
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36', // Desktop user agent
    });
    const page = await context.newPage();

    // Navigate to the IRCTC website
    await page.goto('https://www.irctc.co.in/nget/train-search');

}
(async () => {
    try {
        await bookTatkalTicket();
    } catch (error) {
        console.error('Error:', error);
    }
})();