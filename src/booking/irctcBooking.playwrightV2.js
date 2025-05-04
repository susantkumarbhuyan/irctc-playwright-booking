import { chromium } from 'playwright';
import { BookingType, passenger_data, PaymentType } from './passenger_data.js';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat.js';
import axios from "axios";
import { BUILD_CONFIG, BuildConfig, monthNames, delay, log, parseTravelDate, tatkalOpenTimings } from './utils.js';

dayjs.extend(customParseFormat);

const { USERNAME, PASSWORD, SOURCE_STATION, DESTINATION_STATION,
    TRAIN_NO, TRAIN_COACH, TRAVEL_DATE, PASSENGER_DETAILS,
    BOOKING_TYPE, UPI_ID, PAYMENT_TYPE } = passenger_data;

const { DATE, MONTH } = parseTravelDate(TRAVEL_DATE);

if (BUILD_CONFIG === BuildConfig.LIVE) {
    await startTicketBooking();
} else {
    await bookTatkalTicketV2();
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

async function startTicketBooking() {
    if (BOOKING_TYPE === BookingType.Tatkal) {
        await waitForTatkalOpen(TRAIN_COACH);
    }
    else if (BOOKING_TYPE === BookingType.General || BOOKING_TYPE === BookingType.PremiumTatkal) {
        await bookTatkalTicketV2();
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
        await bookTatkalTicketV2();
    } else {
        console.log("Tatkal booking is already open.");
    }
}

async function bookTatkalTicketV2() {
    const ONE_SECOND = 1000;
    const SCREEN_WAITING_TIME = ONE_SECOND * 60 * 5 //min
    const TEN_SECOND = ONE_SECOND * 6;
    // // Launch the browser
    // const browser = await chromium.launch({ headless: false });

    // // Create a new context with desktop user agent
    // const context = await browser.newContext({
    //     viewport: { width: 1920, height: 1080 }, // Set viewport size
    //     userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36', // Desktop user agent
    // });

    // const page = await context.newPage();

    // Example: chrome.exe --remote-debugging-port=9222
    const browser = await chromium.connectOverCDP('http://localhost:9222');
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
                        console.log('upiPamentPage:', url);
                        await upiPamentPage(page, SCREEN_WAITING_TIME, TEN_SECOND);
                        break;

                    default:
                    // console.log('No matching case for:', url);
                }
            }
        });

        listenForPopup(page, 'app-login', 'Login', TEN_SECOND, SCREEN_WAITING_TIME);
        // // Navigate to IRCTC if not already there
        // const currentUrl = page.url();
        // if (!currentUrl.includes('irctc.co.in')) {
        //     console.log('Navigating to IRCTC website...');
        //     await page.goto('https://www.irctc.co.in/nget/train-search');
        // } else {
        //     console.log('Already on IRCTC website');
        // }
        await page.goto('https://www.irctc.co.in/nget/train-search');
        await fillJourneyDetails(page, TEN_SECOND, SCREEN_WAITING_TIME);
    } catch (error) {
        console.error("ERROR - SECTION 1 : Continue BTN CLick", error)
    }
}
async function listenForPopup(page, selector, popupType, TEN_SECOND, SCREEN_WAITING_TIME) {
    let isTrainSearchHandled = false;
    while (true) {
        await page.waitForSelector(selector, { state: 'attached', timeout: 0 });  // No timeout
        console.log(`✅ ${popupType} popup detected!`);
        await fillLoginDetails(page, TEN_SECOND);
        await page.waitForSelector(selector, { state: 'detached', timeout: 0 });  // No timeout
        console.log(`❌ ${popupType} popup closed!`);
        const currentUrl = page.url(); // Get the current URL
        if (currentUrl.includes("/train-search")) {
            isTrainSearchHandled = false;
            console.log(`Currect URL: ${currentUrl} popup closed!`);
            await fillJourneyDetails(page, TEN_SECOND, SCREEN_WAITING_TIME);
        }
    }
}

async function waitForLoaderRemove(page) {
    const preloader = page.locator('div#loader');
    console.log(`Loader detected!`);

    // Check if the preloader is visible before waiting for it to be detached
    if (await preloader.isVisible()) {
        await preloader.waitFor({ state: 'detached', timeout: 0 }); // Infinite wait
        console.log(`Loader closed!`); 12345
    }

}

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

async function fillAndSelectAutocomplete(page, selector, value, timeout) {
    const autocomplete = page.locator(selector);
    await autocomplete.locator('input').fill(value, { timeout });
    await autocomplete.locator('.ui-autocomplete-items li:first-child').waitFor({ timeout });
    await autocomplete.locator('.ui-autocomplete-items li:first-child').click();
}

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
        console.log('------------------ Enter Mannualy Train Selection ------------------------------');
    }
}


async function fillLoginDetails(page, TEN_SECOND) {
    try {

        await page.waitForSelector('input[formcontrolname="userid"]', { timeout: TEN_SECOND });

        await page.fill('input[formcontrolname="userid"]', USERNAME, { timeout: TEN_SECOND });
        await page.fill('input[formcontrolname="password"]', PASSWORD, { timeout: TEN_SECOND });

        let isCaptchaResolved = await solveCaptcha(page, 1, TEN_SECOND);
        if (isCaptchaResolved) {
            await page.click('text=SIGN IN', { timeout: TEN_SECOND });
            console.log('Success Login filled successfully.');
        } else {
            throw Error(' ------------------------- Fill Captcha Mannualy. ------ ');
        }

    } catch (e) {
        log(`Error in fillLoginDetails: ${e}`);
        console.error("ERROR - SECTION : 3 - Sign and Captch Solving");
        console.log('------------------ Enter Mannualy Sign Form------------------------------');
    }
}

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

async function bookingDetailsReview(page, SCREEN_WAITING_TIME, TEN_SECOND) {
    try {
        await page.waitForURL("**\/booking/reviewBooking", { timeout: SCREEN_WAITING_TIME }); // 60 seconds

        let isCaptchaResolved = await solveCaptcha(page, 2, TEN_SECOND);
        if (isCaptchaResolved) {
            await page.click('button[type="submit"]', { timeout: TEN_SECOND });
            console.log('Clicked filled successfully.');
        } else {
            throw Error(' ------------------------- Fill Captcha Mannualy. ------ ');
        }
    } catch (e) {
        console.error("ERROR - SECTION : 5 - Data View and Final Captcha Filling");
        console.log('------------------ Enter Mannualy 2nd Captcha Filling ------------------------------');
    }
}

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


async function upiPamentPage(page, SCREEN_WAITING_TIME, TEN_SECOND) {
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

async function solveCaptcha(page, captchaNumber, TEN_SECOND) {
    let isCaptchaResolved = true;
    let retry = 0;

    while (retry < 3) {
        await captchaFiller(page, TEN_SECOND);

        let element = null;
        try {
            // Wait for the error message, but catch timeout errors
            await page.waitForSelector('.loginError', { timeout: 2000 });
            element = await page.$('.loginError');
        } catch (error) {
            if (error.name === 'TimeoutError') {
                // No error message appeared, assume captcha is correct
                isCaptchaResolved = true;
                break;
            }
            throw error; // Re-throw unexpected errors
        }

        if (element) {
            const text = await page.evaluate(el => el.textContent, element);
            if (!text.includes('Invalid Captcha....')) {
                isCaptchaResolved = true;
                break;
            }
        }

        isCaptchaResolved = false;
        console.log(captchaNumber, 'CAPTCHA retry:', retry + 1);
        retry++;
    }

    return isCaptchaResolved;
}

async function captchaFiller(page, TEN_SECOND) {
    try {
        try {
            await page.waitForSelector('img.captcha-img', { timeout: TEN_SECOND });
        } catch (error) {
            await page.locator(`a[aria-label="Click to refresh Captcha"]`).first().click;
        }
        const captchaImage = await page.locator('img.captcha-img').first();
        const captchaUrl = await captchaImage.getAttribute('src');

        const captchaText = await captchaSolver(captchaUrl);
        console.log('Solved CAPTCHA Text:', captchaText);

        const captchaInput = await page.locator('input[name="captcha"]').first();
        await captchaInput.fill(captchaText, { timeout: TEN_SECOND });
    } catch (error) {
        log(`Captha Failed captchaFiller: ${error}`);
        console.error("Captha Failed captchaFiller")
    }
}


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


// / Helper function to fill passenger data
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


