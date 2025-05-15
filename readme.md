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

---

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

