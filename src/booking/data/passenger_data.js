export const passenger_data = {
  USERNAME: "your_username",
  PASSWORD: "your_password",
  MANUAL_CAPTCHA: false,
  TRAIN_NO: "12345",
  TRAIN_COACH: "SL", // Select from VALID_BOOKING_TYPE
  TRAVEL_DATE: "21/03/2025", // Follow the format DD/MM/YYYY
  SOURCE_STATION: "SRC",
  DESTINATION_STATION: "DST",
  BOOKING_TYPE: "GENERAL", // Select from VALID_BOOKING_TYPE
  UPI_ID: "your_upi_id@bank", // Enter your working UPI ID
  IS_UPI_PAYMENT: true, // Set to false for QR payment
  PASSENGER_DETAILS: [
    {
      name: "Passenger1",
      age: "30",
      gender: "M", // Select from VALID_GENDERS
    },
    {
      name: "Passenger2",
      age: "60",
      gender: "F", // Select from VALID_GENDERS
    }
  ],
  VALID_COACHES: ["SL", "2A", "3A", "3E", "1A", "CC", "EC", "2S"], // Valid coach types
  VALID_GENDERS: ["M", "F", "T"], // Valid gender options
  VALID_BOOKING_TYPE: ['GENERAL', 'TATKAL', 'PREMIUM TATKAL'] // Valid booking types
};
