# IRCTC Captcha Solver and Booking Automation

This project automates the process of solving IRCTC captchas and booking train tickets using Node.js, Python, and Playwright. It includes a Python-based captcha solver and a Node.js script for automating the booking process.

---

## Prerequisites

Before running the project, ensure the following are installed on your system:

1. **Node.js and npm**: Install Node.js and npm from [here](https://nodejs.org/).
2. **Run The Python Python Captha solver Befor Start Booking NPM**: Install Python from [here](https://github.com/susantkumarbhuyan/irctc-captcha-solver).

---

## Installation Steps

## IRCTC Captcha Solver

Automate or simplify the IRCTC booking process by handling captchas efficiently.

### Setup Guide

### Option 1: Manual Captcha Filling (No Setup Required)
If you prefer to manually solve captchas during the booking process, no additional setup is required. Simply proceed with the booking flow.

### Option 2: Automated Captcha Filling
Make  "MANUAL_CAPTCHA": false and follow the guide steps  [here](https://github.com/susantkumarbhuyan/irctc-captcha-solver)


## Node.js Script Setup

### 1. Install Node.js Dependencies
Navigate to the project folder and install the required Node.js dependencies:

```bash
npm install
npx playwright install
```

### 2. Configure Passenger Data
Update the `passenger_data.js` file with your booking details:

```javascript
export const passenger_data = {
  USERNAME: "your_username",
  PASSWORD: "your_password",
  MANUAL_CAPTCHA: false,
  TRAIN_NO: "22883",
  TRAIN_COACH: "3A", // Select from VALID_BOOKING_TYPE
  TRAVEL_DATE: "07/03/2025", // Follow the format DD/MM/YYYY
  SOURCE_STATION: "BAM",
  DESTINATION_STATION: "KJM",
  BOOKING_TYPE: "TATKAL", // Select from VALID_BOOKING_TYPE
  UPI_ID: "your_upi_id@ybl", // Enter your working UPI ID
  IS_UPI_PAYMENT: true, // Set to false for QR payment
  PASSENGER_DETAILS: [
    {
      name: "Passenger 1 Name",
      age: "26",
      gender: "M", // Select from VALID_GENDERS
    },
    {
      name: "Passenger 2 Name",
      age: "62",
      gender: "F", // Select from VALID_GENDERS
    }
  ],
  VALID_COACHES: ["SL", "2A", "3A", "3E", "1A", "CC", "EC", "2S"], // Valid coach types
  VALID_GENDERS: ["M", "F", "T"], // Valid gender options
  VALID_BOOKING_TYPE: ['GENERAL', 'TATKAL', 'PREMIUM TATKAL'] // Valid booking types
};
```

### Step 3: Start Chrome with Remote Debugging

Run the command below based on your OS to restart Chrome with `--remote-debugging-port=9222`.

**Windows:**
```bash
start chrome.exe --remote-debugging-port=9222
```
**macOS:**
```bash
open -a "Google Chrome" --args --remote-debugging-port=9222
```
**Linux:**
```bash
google-chrome --remote-debugging-port=9222 --user-data-dir=/tmp/chrome-irctc
```

### 4. Run the Booking Script
Run the appropriate command based on your operating system:

   ```bash
   npm start
   ```

---

## Script Workflow

1. **Login and Captcha Solving**:
   - The script logs into the IRCTC website and solves the captcha using the Python-based captcha solver.

2. **Train Selection**:
   - It selects the train and coach based on the provided `TRAIN_NO` and `TRAIN_COACH`.

3. **Passenger Details**:
   - Fills in passenger details from the `PASSENGER_DETAILS` array.

4. **Payment**:
   - Processes payment via UPI or QR code based on the configuration.

---

## Notes

- Ensure the Python captcha solver server is running before executing the Node.js script.
- The script is designed for **Tatkal booking**. Adjust the timings and logic as needed for general bookings.
- Use the script responsibly and comply with IRCTC's terms of service.

---

## Troubleshooting

- **Captcha Solver Issues**: Ensure the Python server is running and accessible at `http://localhost:5001`.
- **Playwright Issues**: Run Playwright in non-headless mode (`headless: false`) for debugging.
- **IRCTC Website Changes**: The script may need updates if the IRCTC website structure changes.

---curl -X POST "http://localhost:5000/extract-text" \
-H "Content-Type: application/json" \
-d '{
     "image": "data:image/jpg;base64,iVBORw0KGgoAAAANSUhEUgAAAMsAAAAyCAYAAADyZi/iAAAFMElEQVR42u1cb0SdURhP0ockciVJ4tqH7MNEsg8zE8lkMpFMkoyZSdKXmZlMRjJJEpNMMpHMZCbmStKHkUkyM2YmMxMzmUzi3XntbE7PnvOv9977vtXvx3HvPed5fufc9z2/95znnHNvQQEAAAAAAAAAAAAAAAAAAAAAZBdBEBSK1C3SgkifRdoX6TBQgKsEQChBUCfS+8ACC4cJtZ7tSfu0w6edPt9B5s2T7PAhkj4G9znpq+KZwf4DsW3yrO8V8V/z9L9C/D9CKEFQKkeSIIdieejZpuEEiSUl0rcoHU/yrBGOkDNlsH9K7B94zhIOiH84Syjy4HhA/GchliC4Ty7KJ5GaRSqO0tEIdjy5dpIiFpnfwTSjz4O3n/Fvt/h0EvvXHvVd1ly6Vg+OZeLbCbEEwUqU4d4glh/kc7MjTwvx24tbLLJsgWlXjeOU8ifxXXTwqyQ+4UhR6Pg97il+v5T3wxFGpkqI5f8bWZglsUySzwuOPIvEbyIhYqkQadf3aR/aEJ/vrh3vuHGLsHupxkXK+4yjfzOp9z0i+z8X5jAXHU2gnnkypiwcKdoegYYkiEWWdzHfs9fAd5ux7/JozwzxHXIcFdTRpNZ3dArrIfXOQCm5D443SfaAhWOA2G85duK8iEXaLDEjRRVjV8NMIZc820NjpYyDzyXFfpu5D00OHBmf+OpMCSTqSphBLGznN3BsEfv+BIqlSgrEKAJm+vWDE5WlPRXM6Fxk8bmr2E/LvEnXVbWQnxndUxBL7sVSzgSKDRr/Rt20LUlikXa9zCW6oZT3+EzXLG16R3haLPbqyNch89qVvGWL/1VS3zamXnkQi8ynm3qTGv8pYjfvEUvkVSyakWNXxlzcyLMcoU1PCNewJV5RNz4rlIeWU9wiyh6R+qYQrOSpozErK3t0KiGH/p+6peaEioWLSeaZmCa0qY7QpnbCt2KwvahbwSIj1GUDxyrilZjEIsvoCYEeUt5j2sRMolik/S2HQflOxPtT7hq3iPxBxe4pKZtWyu55xCvlUEl+xTJsejoyqy9DUcSSLTh+74yBYiVL92jLZSde5D/X7biTEwEvNP6tPgsyEEtuxFLLdKS0LEvbDl4mXCzcDn0g89JZukd0g3dEY6fGK1WkTD0RsK/xH3GJLyGW3G/oZbhA1TbqJF0ssn7u7Fd/Fu9Ru+0gJ9m8/ajhUU8ENDLl66Se61BIPGJh4xLm0GRXVLHEcS2y1QYNd5ntBDER7KyGZ1a3QRwenCXxSvi+DAqJRyxFzOHKUWbjrghiYfnpaYhrpHzRdkKYxC2LpKyN8L+FOmLsaMzcm668TBxTiGdBLPRA6SgpV+Omag1HtS5uEZ/HCP841BGvWOotYUI9xOIct6xrrusnC89n7jSFeL9B+Nugjpg7GrMM+hebEaZ4Z0EspcyoXCzL+lx/0SjK5+gekHgtYeKVEqgjfrEMaMTSD7FY69jg4hYSr3RZOLrpb4zCVS/C+wbKSIZYuMOVB6aVF4jlXx3jpJoxmb/n+ucgZF/ruyYeegxlJEAs0nbe9V9OIJYjdfw3Aoh0wfe/DoTdF8XnvG2lDUhQR4vKfYbEwsUW6u9X5hx51IfVoC4WAiCWEysWTdyyrzugauDo1fgfWWUDIJaTLpbHhqX3c44cdQaOEagCYjktYmnTdPKvnjy7Gh7EKxDLqRFLMXPywbpI4rDIwp45AyCWEysWWdc609FvenJwf9O0CkUAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACcYvwGObCH1snSinwAAAAASUVORK5CYII="
    }'

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

