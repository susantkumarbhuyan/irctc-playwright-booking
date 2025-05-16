import { chromium } from 'playwright';
import { BookingType, passenger_data, PaymentType } from './passenger_data.js';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat.js';
import axios from "axios";
import { BUILD_CONFIG, BuildConfig, monthNames, delay, log, parseTravelDate, tatkalOpenTimings, tatkalOpenTimeForToday } from './utils.js';
import playwright from 'playwright-extra';
import StealthPlugin from "puppeteer-extra-plugin-stealth";
// Apply stealth plugin to playwright
playwright.firefox.use(StealthPlugin());
playwright.chromium.use(StealthPlugin());


dayjs.extend(customParseFormat);

const { USERNAME, PASSWORD, SOURCE_STATION, DESTINATION_STATION,
    TRAIN_NO, TRAIN_COACH, TRAVEL_DATE, PASSENGER_DETAILS,
    BOOKING_TYPE, UPI_ID, PAYMENT_TYPE, MANUAL_CAPTCHA } = passenger_data;

const { DATE, MONTH } = parseTravelDate(TRAVEL_DATE);
const ONE_SECOND = 1000;
const SCREEN_WAITING_TIME = ONE_SECOND * 60 * 5 //min
const TEN_SECOND = ONE_SECOND * 20;

if (BUILD_CONFIG === BuildConfig.LIVE) {
    await startTicketBooking();
} else {
    await bookTicket();
}

function hasTatkalAlreadyOpened(TRAIN_COACH) {
    const openTime = tatkalOpenTimings[TRAIN_COACH];
    const targetTime = dayjs().set('hour', openTime.split(':')[0]).set('minute', openTime.split(':')[1]).set('second', 0);
    const currentTime = dayjs();
    return currentTime.isAfter(targetTime);
}

async function startTicketBooking() {
    if (BOOKING_TYPE === BookingType.Tatkal) {
        await waitForTatkalOpen(TRAIN_COACH);
    }
    else if (BOOKING_TYPE === BookingType.General || BOOKING_TYPE === BookingType.PremiumTatkal) {
        await bookTicket();
    } else {
        console.log("Invalid booking type. Please choose either 'TATKAL' or 'GENERAL'.");
    }
}

export async function waitForTatkalOpen(TRAIN_COACH) {
    if (!hasTatkalAlreadyOpened(TRAIN_COACH)) {
        const exactTimeToOpen = tatkalOpenTimeForToday(TRAIN_COACH);
        console.log(`Waiting for Tatkal opening at ${exactTimeToOpen}...`);
        while (!hasTatkalAlreadyOpened(TRAIN_COACH)) {
            await delay(1000); // Wait 1 second before checking again
        }
        console.log("Tatkal booking is now open!");
        await bookTicket();
    } else {
        console.log("Tatkal booking is already open.");
        await bookTicket();
    }
}

async function bookTicket() {

    // // Launch the browser
    // Example: google-chrome --remote-debugging-port=9222 --user-data-dir=/tmp/chrome-irctc //  allow  use different profile bcz irctc can block while login
    const browser = await chromium.connectOverCDP('http://localhost:9223');

    console.log('Connected to existing Chrome instance');

    // Get the first context and page (or create a new one if needed)
    const contexts = browser.contexts();
    const context = contexts.length > 0 ? contexts[0] : await browser.newContext();
    const pages = context.pages();
    const page = pages.length > 0 ? pages[0] : await context.newPage();

    // Navigate to the IRCTC website
    let isTrainSearchHandled = false;

    try {
        page.on('framenavigated', async (frame) => {
            const url = frame.url();
            if (frame === page.mainFrame()) {
                switch (true) {
                    case url.includes('/train-search') && !isTrainSearchHandled:
                        isTrainSearchHandled = true;
                        console.log('fillJournyDetils', url);
                        // await fillJournyDetils(page, TEN_SECOND, SCREEN_WAITING_TIME);
                        break;
                    case url.includes('/train-list'):
                        console.log('selectTrainCoach', url);
                        await waitForLoaderRemove(page);
                        await selectTrainCoach(page, SCREEN_WAITING_TIME, TEN_SECOND);
                        break;

                    case url.includes('/booking/psgninput'):
                        console.log('passengersDetailsFilling', url);
                        await passengersDetailsFilling(page, SCREEN_WAITING_TIME, TEN_SECOND);
                        break;

                    case url.includes('/booking/reviewBooking'):
                        console.log('bookingDetailsReview:', url);
                        await bookingDetailsReview(page, SCREEN_WAITING_TIME, TEN_SECOND);
                        break;
                    case url.includes('/payment/bkgPaymentOptions'):
                        console.log('paymentTypeSelection', url);
                        await paymentTypeSelection(page, SCREEN_WAITING_TIME, TEN_SECOND);
                        break;
                    case url.includes('/jsp/surchargePaymentPage.jsp'):
                        console.log('upiPaymentPage:', url);
                        await upiPaymentPage(page, SCREEN_WAITING_TIME, TEN_SECOND);
                        break;

                    default:
                    // console.log('No matching case for:', url);
                }
            }
        });

        listenForPopup(page, 'app-login', 'Login', TEN_SECOND, SCREEN_WAITING_TIME);
        await page.goto('https://www.irctc.co.in/nget/train-search', { waitUntil: 'domcontentloaded' });
        await fillJourneyDetails(page, TEN_SECOND, SCREEN_WAITING_TIME);
    } catch (error) {
        console.error("ERROR - SECTION 1 : Continue BTN CLick", error)
    }
}
/**
 * Waits for the loader to be removed from the page.
 * 
 * @param {import('playwright').Page} page - The Playwright Page object.
 */
async function listenForPopup(page, selector, popupType, TEN_SECOND, SCREEN_WAITING_TIME) {
    while (true) {
        await page.waitForSelector(selector, { state: 'attached', timeout: 0 });  // No timeout
        console.log(`✅ ${popupType} popup detected!`);
        await fillLoginDetails(page, TEN_SECOND);
        await page.waitForSelector(selector, { state: 'detached', timeout: 0 });  // No timeout
        console.log(`❌ ${popupType} popup closed!`);
        const currentUrl = page.url(); // Get the current URL
        if (currentUrl.includes("/train-search")) {
            console.log(`Currect URL: ${currentUrl} popup closed!`);
            await fillJourneyDetails(page, TEN_SECOND, SCREEN_WAITING_TIME);
        }
    }
}

/**
 * Waits for the loader to be removed from the page.
 * 
 * @param {import('playwright').Page} page - The Playwright Page object.
 */
async function waitForLoaderRemove(page) {
    const preloader = page.locator('div#loader');
    console.log(`Loader detected!`);

    // Check if the preloader is visible before waiting for it to be detached
    if (await preloader.isVisible()) {
        await preloader.waitFor({ state: 'detached', timeout: 0 }); // Infinite wait
        console.log(`Loader closed!`);
    }
}

/**
 * Waits for the loader to be removed from the page.
 * 
 * @param {import('playwright').Page} page - The Playwright Page object.
 */
async function fillJourneyDetails(page, TEN_SECOND, SCREEN_WAITING_TIME) {
    try {
        await waitForLoaderRemove(page);
        // Wait for the origin autocomplete to be visible
        await page.waitForSelector('p-autocomplete[formcontrolname="origin"]', { timeout: SCREEN_WAITING_TIME });

        // Fill and select origin station
        await fillAndSelectAutocomplete(page, 'p-autocomplete[formcontrolname="origin"]', SOURCE_STATION, TEN_SECOND);

        // Fill and select destination station
        await fillAndSelectAutocomplete(page, 'p-autocomplete[formcontrolname="destination"]', DESTINATION_STATION, TEN_SECOND);

        // Select date
        await selectDate(page);

        // Select journey class
        await selectDropdownOption(page, 'p-dropdown#journeyClass', TRAIN_COACH, TEN_SECOND);

        // Select journey quota
        await selectDropdownOption(page, 'p-dropdown#journeyQuota', BOOKING_TYPE, TEN_SECOND);

        // Submit the form
        await page.click('button[type="submit"]', { timeout: TEN_SECOND });
    } catch (e) {
        log(`ERROR - SECTION : 1 - Fill Source-Destination ${e}`);
    }
}

/**
 * Waits for the loader to be removed from the page.
 * 
 * @param {import('playwright').Page} page - The Playwright Page object.
 */
async function fillAndSelectAutocomplete(page, selector, value, timeout) {
    const autocomplete = page.locator(selector);
    await autocomplete.locator('input').fill(value, { timeout });
    await autocomplete.locator('.ui-autocomplete-items li:first-child').waitFor({ timeout });
    await autocomplete.locator('.ui-autocomplete-items li:first-child').click();
}

/**
 * Waits for the loader to be removed from the page.
 * 
 * @param {import('playwright').Page} page - The Playwright Page object.
 */
async function selectDropdownOption(page, dropdownSelector, optionText, timeout) {
    // Open the dropdown
    await page.waitForSelector(`${dropdownSelector} div.ui-dropdown-trigger`, { timeout });
    await page.click(`${dropdownSelector} div.ui-dropdown-trigger`, { timeout });

    // Wait for the dropdown options to appear
    await page.waitForSelector(`${dropdownSelector} .ui-dropdown-items-wrapper`, { state: 'visible', timeout });

    // Select the desired option
    const options = page.locator(`${dropdownSelector} .ui-dropdown-item`);
    await options.first().waitFor({ state: 'attached' });

    const optionCount = await options.count();
    for (let i = 0; i < optionCount; i++) {
        const option = options.nth(i);
        const text = await option.innerText();
        if (text.includes(optionText)) {
            await option.click({ timeout });
            break;
        }
    }
}
/**
 * Waits for the loader to be removed from the page.
 * 
 * @param {import('playwright').Page} page - The Playwright Page object.
 */
async function selectDate(page) {
    const [targetDay, targetMonth, targetYear] = TRAVEL_DATE.split('/');

    // Convert month number to month name (e.g., "03" -> "March")
    const targetMonthName = monthNames[parseInt(targetMonth) - 1];

    // Open the date picker
    await page.click('p-calendar input');

    // Function to navigate to the desired month and year
    const navigateToTargetDate = async () => {
        let currentMonth = await page.textContent('.ui-datepicker-month');
        let currentYear = await page.textContent('.ui-datepicker-year');

        while (currentMonth !== targetMonthName || currentYear !== targetYear) {
            if (targetYear > currentYear || (targetYear === currentYear && monthNames.indexOf(targetMonthName) > monthNames.indexOf(currentMonth))) {
                await page.click('.ui-datepicker-next');
            } else {
                await page.click('.ui-datepicker-prev');
            }
            currentMonth = await page.textContent('.ui-datepicker-month');
            currentYear = await page.textContent('.ui-datepicker-year');
        }
    };

    // Navigate to the target month and year
    await navigateToTargetDate();

    // Select the target day
    const daySelector = `//a[contains(@class, 'ui-state-default') and text()='${parseInt(targetDay)}']`;
    await page.click(daySelector);
}

/**
 * Waits for the loader to be removed from the page.
 * 
 * @param {import('playwright').Page} page - The Playwright Page object.
 */
async function selectTrainCoach(page, SCREEN_WAITING_TIME, TEN_SECOND) {
    try {
        await page.waitForURL('**\/train-list', { timeout: SCREEN_WAITING_TIME }); // 60 seconds
        console.log("SECTION : 2 - Fill Source-Destination Entered");

        // Step 1: Find the div containing (18463)
        const divTrainNo = await page.locator('app-train-avl-enq', { hasText: `(${TRAIN_NO})` }).first();

        // Step 2: Within that div, find the div containing (3A)
        const divCoachType = await divTrainNo.locator('td', { hasText: TRAIN_COACH }).first();

        // Step 3: Click on the (3A) div twice with a 500ms gap
        await divCoachType.click({ timeout: TEN_SECOND });
        await delay(500); // Wait for 500ms
        const div3aDate = await divTrainNo.locator('td', { hasText: `${DATE} ${MONTH}` }).first();
        await div3aDate.click({ timeout: TEN_SECOND });
        const isWaitingList = await divTrainNo.locator('td', { hasText: `WL` }).first();

        const bookNowButton = await divTrainNo.locator('button.btnDefault.train_Search', { hasText: 'Book Now' }).first();
        await bookNowButton.click({ timeout: TEN_SECOND }); // Increase timeout if needed

        if (!isWaitingList) {
            const yesButton = await page.locator('button.ui-confirmdialog-acceptbutton').first();
            await yesButton.click({ timeout: TEN_SECOND });
        }

    } catch (e) {
        log(`ERROR - SECTION : 2 - Select Train And Coach ${e}`);
        console.log('------------------ Enter Manually Train Selection ------------------------------');
    }
}

/**
 * Waits for the loader to be removed from the page.
 * 
 * @param {import('playwright').Page} page - The Playwright Page object.
 */
async function fillLoginDetails(page, TEN_SECOND) {
    try {

        await page.waitForSelector('input[formcontrolname="userid"]', { timeout: TEN_SECOND });

        await page.fill('input[formcontrolname="userid"]', USERNAME, { timeout: TEN_SECOND });
        await page.fill('input[formcontrolname="password"]', PASSWORD, { timeout: TEN_SECOND });
        await solveCaptcha(page, 'text=SIGN IN', 1, TEN_SECOND);

    } catch (e) {
        log(`Error in fillLoginDetails: ${e}`);
        console.error("ERROR - SECTION : 3 - Sign and Captcha Solving");
        console.log('------------------ Enter Manually Sign Form------------------------------');
    }
}

/**
 * Performs the passenger details filling process.
 * 
 * @param {import('playwright').Page} page - The Playwright Page object.
 */
async function passengersDetailsFilling(page, SCREEN_WAITING_TIME, TEN_SECOND) {
    try {

        await page.waitForURL("**\/booking/psgninput", { timeout: SCREEN_WAITING_TIME }); // 60 seconds

        // Step 1: Check if the `app-passenger` element exists
        await page.waitForSelector('app-passenger', { timeout: TEN_SECOND });
        const appPassenger = await page.locator('app-passenger').first();
        if (await appPassenger.isVisible()) {
            console.log('app-passenger element found.');
            await addPassengers(page, PASSENGER_DETAILS, TEN_SECOND);
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
            }

            if (bodyText.includes('Consider for Auto Upgradation.')) {
                await page.locator('text=Consider for Auto Upgradation.').click(); // Click the element containing the text
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
        console.error("ERROR - SECTION : 4 - Passengger Details Filling");
        console.log('------------------ Enter Mannualy Passengger Details ------------------------------');
    }
}
/**
 * final booking detailsReview.
 * 
 * @param {import('playwright').Page} page - The Playwright Page object.
 */
async function bookingDetailsReview(page, SCREEN_WAITING_TIME, TEN_SECOND) {
    try {
        await page.waitForURL("**\/booking/reviewBooking", { timeout: SCREEN_WAITING_TIME }); // 60 seconds
        await solveCaptcha(page, 'button[type="submit"]', 2, TEN_SECOND);
    } catch (e) {
        console.error("ERROR - SECTION : 5 - Data View and Final Captcha Filling");
        console.warn('------------------ Enter Mannualy 2nd Captcha Filling ------------------------------');
    }
}

/**
 * Payment Type Selection
 * 
 * @param {import('playwright').Page} page - The Playwright Page object.
 */
async function paymentTypeSelection(page, SCREEN_WAITING_TIME, TEN_SECOND) {
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
}

/**
 * Handles the UPI payment process.
 * 
 * @param {import('playwright').Page} page - The Playwright Page object.
 */
async function upiPaymentPage(page, SCREEN_WAITING_TIME, TEN_SECOND) {
    try {
        await page.waitForURL("**\/jsp/surchargePaymentPage.jsp", { timeout: SCREEN_WAITING_TIME }); // 60 seconds


        // MAKE SURE UPI ID EXISTS THEN PROCEED
        if (UPI_ID && PAYMENT_TYPE === PaymentType.UPI) {
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
}
/**
 * Solves the captcha using the captchaFiller function.
 * 
 * @param {import('playwright').Page} page - The Playwright Page object.
 */
async function solveCaptcha(page, selector, captchaNumber, TEN_SECOND) {
    let retry = 0;
    const MAX_RETRIES = 3;

    while (retry < MAX_RETRIES) {
        try {

            const captchaText = await captchaFiller(page, TEN_SECOND);

            console.log(`Attempt ${retry + 1}: Filled captcha with text: ${captchaText}`);

            // If manual captcha mode is enabled, just stop here
            if (MANUAL_CAPTCHA) {
                console.warn('------------------ Enter Manually Captcha Filling ------------------------------');
                return true;
            }

            const captchaInput = await page.locator('input[name="captcha"]').first();
            const value = await captchaInput.inputValue();
            if (value && value.trim() !== '' && value === captchaText) {
                await page.click(selector, { timeout: TEN_SECOND });
                console.log('Clicked filled successfully.');

            } else {
                console.log(captchaNumber, 'CAPTCHA retry:', retry + 1);
                retry++;
                continue;
            }

            try {
                // Check if there's an error message within a short timeout
                await page.waitForSelector('.loginError', { timeout: 2000 });
                const errorElement = await page.$('.loginError');
                if (errorElement) {
                    const errorText = await page.evaluate(el => el.textContent, errorElement);
                    if (errorText.includes('Invalid Captcha....')) {
                        console.log(`${captchaNumber} CAPTCHA failed. Retry: ${retry + 1}`);
                        retry++;
                        continue;
                    } else {
                        // Some other error occurred
                        console.warn(`Error detected but not related to captcha: ${errorText}`);
                        return false;
                    }
                }
            } catch (error) {
                // No error message appeared within the timeout period
                // This suggests the captcha was successful
                console.log('CAPTCHA solved successfully.');
                return true;
            }
            return true;
        } catch (error) {
            console.error(`Error during captcha solving attempt ${retry + 1}:`, error);
            retry++;

            if (retry >= MAX_RETRIES) {
                console.error('Maximum retry attempts reached for captcha solving.');
                return false;
            }
        }
    }
    // If we exit the loop due to max retries
    return false;
}

/**
 * Fills the captcha using the captchaFiller function.
 * 
 * @param {import('playwright').Page} page - The Playwright Page object.
 */
async function captchaFiller(page, TEN_SECOND) {
    try {
        try {
            await page.waitForSelector('img.captcha-img', { timeout: TEN_SECOND });
        } catch (error) {
            await page.locator(`a[aria-label="Click to refresh Captcha"]`).first().click();
        }
        const captchaImage = await page.locator('img.captcha-img').first();
        const captchaUrl = await captchaImage.getAttribute('src');

        const captchaText = await captchaSolver(captchaUrl);
        console.log('Solved CAPTCHA Text:', captchaText);

        const captchaInput = await page.locator('input[name="captcha"]').first();
        await captchaInput.fill(captchaText, { timeout: TEN_SECOND });
        return captchaText;
    } catch (error) {
        log(`Captha Failed captchaFiller: ${error}`);
        console.error("Captha Failed captchaFiller")
    }
}

/**
 * Adds passengers to the booking form.
 * 
 * @param {import('playwright').Page} page - The Playwright Page object.
 */
async function addPassengers(page, passengers, TEN_SECOND) {
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
            // console.log(passengers[i]);
            await fillPassengerData(passengerForm, passengers[i]);
        }

    } catch (error) {
        console.log(error);
    }
}


/**
 * Fills the passenger data in the form.
 * 
 * @param {import('playwright').Page} page - The Playwright Page object.
 */
async function fillPassengerData(passengerForm, data, TEN_SECOND) {
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


export async function captchaSolver(captchaUrl) {
    try {
        const response = await axios.post("http://localhost:5000/extract-text", {
            image: captchaUrl, // Assuming `captchaUrl` is a base64 image string
        });

        return response.data.extracted_text;
    } catch (error) {
        console.error("Error extracting text:API");
        return null;
    }
}


