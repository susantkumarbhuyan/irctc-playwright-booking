import { chromium } from 'playwright';
import { passenger_data } from '../../booking/passenger_data.js';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat.js';
import axios from "axios";

dayjs.extend(customParseFormat);

const {
    USERNAME,
    PASSWORD,
    SOURCE_STATION,
    DESTINATION_STATION,
    TRAIN_NO,
    TRAIN_COACH,
    TRAVEL_DATE,
    PASSENGER_DETAILS,
    DATE,
    MONTH,
    BOOKING_TYPE,
    UPI_ID
} = passenger_data;


const upiRegex = /^[a-zA-Z0-9]+@[a-zA-Z0-9.]+$/;
const isValidUpiId = upiRegex.test(UPI_ID);


const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Tatkal timings
const tatkalOpenTimings = {
    "2A": "10:00",
    "3A": "10:00",
    "3E": "10:00",
    "1A": "10:00",
    "CC": "10:00",
    "EC": "10:00",
    "2S": "11:00",
    "SL": "11:00",
};


// Utility functions
function formatDate(inputDate) {
    return dayjs(inputDate, 'DD/MM/YYYY').format('ddd, DD MMM');
}

function hasTatkalAlreadyOpened(TRAIN_COACH) {
    const openTime = tatkalOpenTimings[TRAIN_COACH];
    const targetTime = dayjs().set('hour', openTime.split(':')[0]).set('minute', openTime.split(':')[1]).set('second', 0);
    const currentTime = dayjs();
    return currentTime.isAfter(targetTime);
}

function tatkalOpenTimeForToday(TRAIN_COACH) {
    const openTime = tatkalOpenTimings[TRAIN_COACH];
    return `${openTime}`;
}

// await waitForTatkalOpen(TRAIN_COACH);

await bookTatkalTicket();

export async function waitForTatkalOpen(TRAIN_COACH) {
    if (!hasTatkalAlreadyOpened(TRAIN_COACH)) {
        const exactTimeToOpen = tatkalOpenTimeForToday(TRAIN_COACH);
        console.log(`Waiting for Tatkal opening at ${exactTimeToOpen}...`);

        while (!hasTatkalAlreadyOpened(TRAIN_COACH)) {
            await delay(1000); // Wait 1 second before checking again
        }

        console.log("Tatkal booking is now open!");
        await bookTatkalTicket();
    } else {
        console.log("Tatkal booking is already open.");
    }
}

async function bookTatkalTicket() {

    let IS_SIGNED_IN = false;
    const ONE_SECOND = 1000;
    const SCREEN_WAITING_TIME = ONE_SECOND * 60 * 5 //min
    const TEN_SECOND = ONE_SECOND * 6;
    // Launch the browser
    const browser = await chromium.launch({ headless: false });

    // Create a new context with desktop user agent
    const context = await browser.newContext({
        viewport: { width: 1920, height: 1080 }, // Set viewport size
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36', // Desktop user agent
    });



    const page = await context.newPage();

    // Navigate to the IRCTC website
    await page.goto('https://www.irctc.co.in/nget/train-search');
    try {

        //<------------------------SECTION : 1 - Fill Source-Destination ------------------------------------------------------------->
        await fillJournyDetils(page, SCREEN_WAITING_TIME);

        try {
            // Wait for the login popup to appear
            await page.waitForSelector('input[formcontrolname="userid"]', { timeout: TEN_SECOND });

            // Fill in the username
            await page.fill('input[formcontrolname="userid"]', USERNAME, { timeout: TEN_SECOND });

            // Fill in the password
            await page.fill('input[formcontrolname="password"]', PASSWORD, { timeout: TEN_SECOND });

            let isCaptchaResolved = await solveCaptcha(page, 1);
            if (isCaptchaResolved) {
                // throw Error("MyCustome");
                await page.click('text=SIGN IN', { timeout: TEN_SECOND });
                IS_SIGNED_IN = true
                console.log('Success Login filled successfully.');
                await fillJournyDetils(page, SCREEN_WAITING_TIME);
            } else {
                IS_SIGNED_IN = false
            }
        } catch (e) {
            console.error("ERROR - SECTION : GAUST - Sign and Captch Solving")
        }

        try {
            await page.click('button[type="submit"]', { timeout: TEN_SECOND });
        } catch (error) {
            console.error("ERROR - SECTION 1 : Continue BTN CLick")
        }

        //<------------------------SECTION : 2 - Select Train And Coach ------------------------------------------------------------->

        try {
            // await page.waitForNavigation({ timeout: TEN_SECOND }); // 60 seconds
            await page.waitForURL('**\/train-list', { timeout: SCREEN_WAITING_TIME }); // 60 seconds
            console.error("SECTION : 2 - Fill Source-Destination Entered")
            await page.locator("//button[contains(., 'Next Day')]").click({ timeout: TEN_SECOND });
            await delay(800);

            // Step 1: Find the div containing (18463)
            const divTrainNo = await page.locator('app-train-avl-enq', { hasText: `(${TRAIN_NO})` }).first();

            // Step 2: Within that div, find the div containing (3A)
            const divCoachType = await divTrainNo.locator('td', { hasText: TRAIN_COACH }).first();

            // Step 3: Click on the (3A) div twice with a 500ms gap
            await divCoachType.click({ timeout: TEN_SECOND });
            await delay(500); // Wait for 500ms
            const div3aDate = await divTrainNo.locator('td', { hasText: `${DATE} ${MONTH}` }).first();
            await div3aDate.click({ timeout: TEN_SECOND });
            const bookNowButton = await divTrainNo.locator('button.btnDefault.train_Search', { hasText: 'Book Now' }).first();
            await bookNowButton.click({ timeout: TEN_SECOND }); // Increase timeout if needed

            const yesButton = await page.locator('span.ui-button-text.ui-clickable', { hasText: 'Yes' }).first();
            await yesButton.click({ timeout: TEN_SECOND });
        } catch (e) {
            console.error("ERROR - SECTION : 2 - Select Train And Coach")
            console.log('------------------ Enter Mannualy Train Selection ------------------------------');
        }

        //<------------------------SECTION : 3 - Sign and Captch Solving ------------------------------------------------------------->
        try {
            if (!IS_SIGNED_IN) {
                // Wait for the login popup to appear
                await page.waitForSelector('input[formcontrolname="userid"]', { timeout: TEN_SECOND });

                // Fill in the username
                await page.fill('input[formcontrolname="userid"]', USERNAME, { timeout: TEN_SECOND });

                // Fill in the password
                await page.fill('input[formcontrolname="password"]', PASSWORD, { timeout: TEN_SECOND });

                let isCaptchaResolved = await solveCaptcha(page, 1)
                if (isCaptchaResolved) {
                    await page.click('text=SIGN IN', { timeout: TEN_SECOND });
                    console.log('Success Login filled successfully.');
                } else {
                    throw Error(' ------------------------- Fill Captcha Mannualy. ------ ');
                }
            }
        } catch (e) {
            console.error("ERROR - SECTION : 3 - Sign and Captch Solving")
            console.log('------------------ Enter Mannualy Sign Form------------------------------');
        }
        //<------------------------SECTION : 4 - Passengger Details Filling -------------------------------------------------------------> 

        try {

            await page.waitForURL("**\/booking/psgninput", { timeout: SCREEN_WAITING_TIME }); // 60 seconds


            // Step 1: Check if the `app-passenger` element exists
            await page.waitForSelector('app-passenger', { timeout: TEN_SECOND });
            const appPassenger = await page.locator('app-passenger').first();
            if (await appPassenger.isVisible()) {
                console.log('app-passenger element found.');
                await addPassengers(page, PASSENGER_DETAILS);
            } else {
                console.log('app-passenger element not found');
                console.log('------------------ Enter Passenger Mannualy------------------------------');
            }

            try {
                // Get the text content of the <body> element
                const bodyText = await page.textContent('body');

                // Check if the text contains specific strings and perform actions
                if (bodyText.includes('Book only if confirm berths are allotted')) {
                    await page.locator(':nth-child(2) > .css-label_c').click(); // Click the element
                    console.log('Clicked "Book only if confirm berths are allotted" checkbox.');
                }

                if (bodyText.includes('Consider for Auto Upgradation.')) {
                    await page.locator('text=Consider for Auto Upgradation.').click(); // Click the element containing the text
                    console.log('Clicked "Consider for Auto Upgradation." checkbox.');
                }
            } catch (error) {
                console.error('An error occurred:', error);
            }

            const trWithBHIMUPI = await page.locator('tr', { hasText: "BHIM" }).first();
            // Step 2: Ensure the <tr> is visible and stable
            await trWithBHIMUPI.waitFor({ state: 'visible' });
            await trWithBHIMUPI.scrollIntoViewIfNeeded();
            const radioBtn = await trWithBHIMUPI.locator('p-radiobutton').first();

            // Step 3: Click on the (3A) div twice with a 500ms gap
            await radioBtn.click({ timeout: TEN_SECOND });

            console.log('Selected "Pay through BHIM/UPI" successfully!');


            // Step 3: Click the "Continue" button
            const continueButton = await page.waitForSelector('button.train_Search.btnDefault >> text=Continue', { timeout: TEN_SECOND });
            await continueButton.click({ timeout: TEN_SECOND });
            console.log('Clicked the "Continue" button successfully!');
        } catch (e) {
            console.error("ERROR - SECTION : 4 - Passengger Details Filling")
            console.log('------------------ Enter Mannualy Passengger Details ------------------------------');
        }
        //<------------------------SECTION : 5 - Data View and Final Captcha Filling ------------------------------------------------------------->
        try {
            await page.waitForURL("**\/booking/reviewBooking", { timeout: SCREEN_WAITING_TIME }); // 60 seconds

            let isCaptchaResolved = await solveCaptcha(page, 2);
            if (isCaptchaResolved) {
                await page.click('button[type="submit"]', { timeout: TEN_SECOND });
                console.log('Clicked filled successfully.');
            } else {
                throw Error(' ------------------------- Fill Captcha Mannualy. ------ ');
            }
        } catch (e) {
            console.error("ERROR - SECTION : 5 - Data View and Final Captcha Filling")
            console.log('------------------ Enter Mannualy 2nd Captcha Filling ------------------------------');
        }

        //<------------------------SECTION : 6 - Payment Type Selection ------------------------------------------------------------->
        // We can implement for Select  only BHIM UPI and QR payment 
        //--------------------------------------------------Not Verified START ----------------------
        try {
            await page.waitForURL("**\/payment/bkgPaymentOptions", { timeout: SCREEN_WAITING_TIME }); // 60 seconds

            await page.waitForSelector('div.bank-type', { state: 'visible', timeout: TEN_SECOND });
            // BHIM UPI At Gateway Confirmation
            const bhimOption = await page.locator('div.bank-type:has-text("BHIM/ UPI/ USSD")');
            await bhimOption.click();

            await page.waitForSelector('button.btn-primary:has-text("Pay & Book")', { state: 'visible', timeout: TEN_SECOND });

            // Step 3: Click the "Pay & Book" button
            const payAndBookButton = await page.locator('button.btn-primary:has-text("Pay & Book")');
            await payAndBookButton.click({ timeout: TEN_SECOND });

            // Clicking Pay And book
            console.log('Clicked the "Pay And Book" button.');

        } catch (error) {
            console.error("ERROR - SECTION : 6 - Payment Type Selection");
            console.log('------------------ Enter Mannualy Select  Payment Type  ------------------------------');
        }


        //<------------------------SECTION : 7 - Payment  ------------------------------------------------------------->
        // We can implement for Select  only BHIM UPI and QR payment 

        try {
            await page.waitForURL("**\/jsp/surchargePaymentPage.jsp", { timeout: SCREEN_WAITING_TIME }); // 60 seconds

            // MAKE SURE UPI ID EXISTS THEN PROCEED
            if (UPI_ID && IS_UPI_PAYMENT) {
                await page.waitForSelector('div.paymentSections input#vpaCheck', { state: 'visible', timeout: TEN_SECOND });

                // Step 7: Fill the UPI ID in the input field
                const upiInputField = await page.locator('div.paymentSections input#vpaCheck');
                await upiInputField.fill(UPI_ID); // Replace with your actual UPI ID

                // Step 8: Wait for the "Pay ₹ 2173.60" button to be visible
                await page.waitForSelector('div.paymentSections input#upi-sbmt', { state: 'visible', timeout: TEN_SECOND });

                // Step 9: Click the "Pay ₹ 2173.60" button
                const payButton = await page.locator('div.paymentSections input#upi-sbmt');
                await payButton.click({ timeout: TEN_SECOND });

            } else {
                await page.waitForSelector('span:has-text("Click here to pay through QR")', { state: 'visible', timeout: TEN_SECOND });

                // Step 5: Click the "Click here to pay through QR" span
                const qrPaymentSpan = await page.locator('div.paymentSections span:has-text("Click here to pay through QR")');
                await qrPaymentSpan.click({ timeout: TEN_SECOND });
            }

        } catch (error) {
            console.error("ERROR - SECTION : 7 - Payment");
            console.log('------------------ Enter Mannualy   Payment   ------------------------------');
        }
        //--------------------------------------------------Not Verified START ----------------------
        //<------------------------      END      ------------------------------------------------------------->
    } catch (e) {
        console.error("ERROR in OUTER BLOCK");
    }
};

async function fillJournyDetils(page, SCREEN_WAITING_TIME) {
    try {
        await page.waitForSelector('p-autocomplete[formcontrolname="origin"]', { timeout: SCREEN_WAITING_TIME });

        // Fill in the password
        await page.fill('p-autocomplete[formcontrolname="origin"] input', SOURCE_STATION, { timeout: TEN_SECOND });
        await page.fill('p-autocomplete[formcontrolname="destination"] input', DESTINATION_STATION, { timeout: TEN_SECOND });
        // await page.evaluate(() => {
        //     document.querySelector('#jDate input').value = "06/03/2025"; 
        // });
        await page.evaluate((date) => {
            document.querySelector('#jDate input').value = date;
        }, TRAVEL_DATE);
        // Wait for the dropdown to be visible and click it
        await page.waitForSelector('p-dropdown#journeyClass div.ui-dropdown-trigger', { timeout: TEN_SECOND });
        await page.click('p-dropdown#journeyClass div.ui-dropdown-trigger', { timeout: TEN_SECOND });

        // Wait for the dropdown options to appear
        await page.waitForSelector('p-dropdown#journeyClass .ui-dropdown-items-wrapper', { timeout: TEN_SECOND });

        // Select the "TATKAL" option
        const options = page.locator('p-dropdown#journeyClass .ui-dropdown-item');
        await options.first().waitFor({ state: 'attached' });

        const count = await options.count();
        for (let i = 0; i < count; i++) {
            const option = options.nth(i);
            const text = await option.innerText();
            if (text.includes(TRAIN_COACH)) {
                await option.click({ timeout: TEN_SECOND });
                break;
            }
        }

        // / Wait for the dropdown trigger and click to open the dropdown
        await page.waitForSelector('p-dropdown#journeyQuota .ui-dropdown-trigger', { timeout: TEN_SECOND });
        await page.click('p-dropdown#journeyQuota .ui-dropdown-trigger', { timeout: TEN_SECOND });

        // Wait for the dropdown options to appear
        await page.waitForSelector('p-dropdown#journeyQuota .ui-dropdown-items-wrapper', { state: 'visible', timeout: TEN_SECOND });

        const optionsList = page.locator('p-dropdown#journeyQuota .ui-dropdown-item');
        // Wait for at least one option to be available
        await optionsList.first().waitFor({ state: 'attached' });

        const optionCount = await optionsList.count();
        for (let i = 0; i < optionCount; i++) {
            const option = optionsList.nth(i);
            const text = await option.innerText();
            if (text.includes(BOOKING_TYPE)) {
                await option.click({ timeout: TEN_SECOND });
                break;
            }
        }
        // throw Error("MyCustome");
        // // Click on the SIGN IN button (if needed)
        // await page.click('button[type="submit"]', { timeout: TEN_SECOND });
    } catch (e) {
        console.error("ERROR - SECTION : 1 - Fill Source-Destination");
    }
}

async function solveCaptcha(page, captchaNumber) {
    let isCaptchaResolved = true;
    let retry = 0;
    while (true) {
        if (retry >= 3) {
            break;
        }
        await captchaFiller(page);
        await page.waitForSelector('.loginError', { timeout: 1000 });
        let element = await page.$('.loginError');
        const text = await element.textContent();
        if (!text.includes('Invalid Captcha....')) {
            isCaptchaResolved = true;
            break;
        }
        isCaptchaResolved = false;
        console.log(captchaNumber, 'CAPTCHA filled successfully.');
        retry++;
    }
    return isCaptchaResolved;
}

async function captchaFiller(page) {
    try {
        await page.waitForSelector('img.captcha-img', { timeout: TEN_SECOND });
        // await delay(1000);
        const captchaImage = await page.locator('img.captcha-img').first();
        const captchaUrl = await captchaImage.getAttribute('src');
        // console.log('CAPTCHA URL:', captchaUrl);

        const captchaText = await captchaSolver(captchaUrl);
        console.log('Solved CAPTCHA Text:', captchaText);

        const captchaInput = await page.locator('input[name="captcha"]').first();
        await captchaInput.fill(captchaText, { timeout: TEN_SECOND });
        // await delay(1000);
    } catch (error) {
        console.error("Captha Failed captchaFiller")
    }
}


async function addPassengers(page, passengers) {
    try {
        console.log(passengers);
        for (let i = 0; i < passengers.length; i++) {
            if (i > 0) {
                // Click the "+ Add Passenger" link for additional passengers
                const addPassengerLink = await page.locator('a').filter({ hasText: '+ Add Passenger' }).first();
                await addPassengerLink.click({ timeout: TEN_SECOND });

                // Wait for the new passenger form to load
                const newPassengerForm = await page.locator('app-passenger').nth(i);
                await newPassengerForm.waitFor({ state: 'visible' });
            }

            // Fill the passenger data
            const passengerForm = await page.locator('app-passenger').nth(i);
            console.log(passengers[i]);
            await fillPassengerData(passengerForm, passengers[i]);
        }

    } catch (error) {
        console.log(error);
    }
}


// / Helper function to fill passenger data
async function fillPassengerData(passengerForm, data) {
    // Fill the name input field
    const passengerName = await passengerForm.locator('input[placeholder="Name"]').first();
    await passengerName.fill(data.name, { timeout: TEN_SECOND });

    // Fill the age input field
    const passengerAge = await passengerForm.locator('input[placeholder="Age"]').first();
    await passengerAge.fill(data.age, { timeout: TEN_SECOND });

    // Select the gender from the dropdown
    const passengerGender = await passengerForm.locator('select[formcontrolname="passengerGender"]').first();
    await passengerGender.selectOption({ value: data.gender });

    // // Select the preference from the dropdown
    // const passengerPreference = await passengerForm.locator('select[formcontrolname="passengerBerthChoice"]').first();
    // await passengerPreference.selectOption({ value: data.preference });
}


async function captchaSolver(captchaUrl) {
    try {
        const response = await axios.post("http://localhost:5001/extract-text", {
            image: captchaUrl, // Assuming `captchaUrl` is a base64 image string
        });

        return response.data.extracted_text;
    } catch (error) {
        console.error("Error extracting text:API");
        return null;
    }
}
