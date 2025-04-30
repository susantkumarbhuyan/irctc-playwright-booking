export const BuildConfig = {
    LIVE: "live",
    DEV: "dev",
    TESTING: "testing"
}
export const BUILD_CONFIG = BuildConfig.LIVE; // Change this to BuildConfig.DEV or BuildConfig.TESTING for different environments

// Tatkal timings
export const tatkalOpenTimings = {
    "2A": "10:00",
    "3A": "10:00",
    "3E": "10:00",
    "1A": "10:00",
    "CC": "10:00",
    "EC": "10:00",
    "2S": "11:00",
    "SL": "11:00",
};

export const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
export function parseTravelDate(travelDate) {
    const [day, month, year] = travelDate.split('/');
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    return {
        DATE: day,
        MONTH: months[parseInt(month, 10) - 1] // Convert month number to short name
    };
}
export const log = (message) => {
    if (BUILD_CONFIG === BuildConfig.TESTING) {
        console.log(message);
    }
}
export function formatDate(inputDate) {
    return dayjs(inputDate, 'DD/MM/YYYY').format('ddd, DD MMM');
}

export const isValidUpiId = () => {
    const upiRegex = /^[a-zA-Z0-9]+@[a-zA-Z0-9.]+$/;
    return upiRegex.test(UPI_ID);
}
export const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
