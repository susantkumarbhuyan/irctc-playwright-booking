export const passenger_data = {
  USERNAME: "your_username",
  PASSWORD: "your_password",
  MANUAL_CAPTCHA: false,
  TRAIN_NO: "18463",
  TRAIN_COACH: "3A", // Select from VALID_BOOKING_TYPE
  TRAVEL_DATE: "15/03/2025", // Follow the format DD/MM/YYYY
  DATE: "15",
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