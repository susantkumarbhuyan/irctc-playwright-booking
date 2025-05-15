
export const CoachType = Object.freeze({
  SL: "SL",
  A2: "2A",
  A3: "3A",
  E3: "3E",
  A1: "1A",
  CC: "CC",
  EC: "EC",
  S2: "2S",
});

export const Gender = Object.freeze({
  Male: "M",
  Female: "F",
  Transgender: "T",
});

export const BookingType = Object.freeze({
  General: "GENERAL",
  Tatkal: "TATKAL",
  PremiumTatkal: "PREMIUM TATKAL",
});
export const PaymentType = Object.freeze({
  UPI: "UPI",
  QR: "QR",
});

export const passenger_data = {
  USERNAME: "your_username",
  PASSWORD: "your_password",
  MANUAL_CAPTCHA: true,
  TRAIN_NO: "12842",
  TRAIN_COACH: CoachType.SL, // Select CoachType
  TRAVEL_DATE: "15/05/2025", // Follow the format DD/MM/YYYY
  SOURCE_STATION: "BAM",
  DESTINATION_STATION: "BBS",
  BOOKING_TYPE: BookingType.General, // Select BookingType
  UPI_ID: "your_upi_id@bank", // Enter your working UPI ID
  PAYMENT_TYPE: PaymentType.UPI, // Select PaymentType: true, // Set to false for QR payment
  PASSENGER_DETAILS: [
    {
      name: "Passenger One",
      age: "30",
      gender: Gender.Male, // Select Gender
    },
    {
      name: "Passenger Two",
      age: "60",
      gender: Gender.Female, // Select Gender
    }
  ]
};

