/**
 * Generates a random 6-digit OTP
 */
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Checks if a Date is expired
 */
const isExpired = (date) => {
  return new Date() > new Date(date);
};

/**
 * Adds minutes to current time
 */
const addMinutes = (minutes) => {
  return new Date(Date.now() + minutes * 60 * 1000);
};

/**
 * Adds hours to current time
 */
const addHours = (hours) => {
  return new Date(Date.now() + hours * 60 * 60 * 1000);
};

module.exports = { generateOTP, isExpired, addMinutes, addHours };
