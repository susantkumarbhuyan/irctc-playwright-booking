# IRCTC Captcha Solver and Booking Automation

This project automates the process of solving IRCTC captchas and booking train tickets using Node.js, Python, and Playwright. It includes a Python-based captcha solver and a Node.js script for automating the booking process.

---

## Prerequisites

Before running the project, ensure the following are installed on your system:

1. **Node.js and npm**: Install Node.js and npm from [here](https://nodejs.org/).
2. **Python and pip**: Install Python from [here](https://www.python.org/).

---

## Installation Steps

### 1. Install Python and pip
After installing Python, ensure `pip` is installed. If not, install it using the following command:

```bash
sudo apt-get install python3-pip -y
```

### 2. Install Python Dependencies
Navigate to the project folder and install the required Python dependencies:

```bash
pip install -r /src/irctc-captcha-solver/requirements.txt
```

### 3. Verify the Captcha Solver
Run the Python captcha solver server to ensure it works correctly:

```bash
python /src/irctc-captcha-solver/app-server.py --host 0.0.0.0 --port 5001
```

Test the server using `curl`:

```bash
curl -X POST "http://localhost:5001/extract-text" \
-H "Content-Type: application/json" \
-d '{
     "image": ""
    }'
```

You should receive the following output:

```json
{"error":"No base64 image string provided"}
```

---

## Node.js Script Setup

### 1. Install Node.js Dependencies
Navigate to the project folder and install the required Node.js dependencies:

```bash
npm install
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
  DATE: "07",
  MONTH: "Mar", // Copy the month (e.g., Apr, May)
  SOURCE_STATION: "BRAHMAPUR - BAM (BRAHMAPUR)",
  DESTINATION_STATION: "KRISHNARAJAPURM - KJM",
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

### 3. Run the Booking Script
Execute the Node.js script to start the booking process:

```bash
node irctcBooking.playwright.js
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

