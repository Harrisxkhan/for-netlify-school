/**
 * Error handler and recovery utilities
 */

// Track failed API calls
let consecutiveErrors = 0;
const MAX_CONSECUTIVE_ERRORS = 5;
let lastErrorTime = 0;
let errorRecoveryMode = false;

// Exponential backoff times in milliseconds
const backoffTimes = [1000, 2000, 5000, 10000, 30000];

/**
 * Handles an API error with exponential backoff
 * @param {Error} error - The error that occurred
 * @param {Function} statusUpdateCallback - Function to update status display
 * @returns {Promise<number>} - Time to wait before retry
 */
function handleApiError(error, statusUpdateCallback) {
  const now = Date.now();
  
  // Reset error count if it's been more than 1 minute since the last error
  if (now - lastErrorTime > 60000) {
    consecutiveErrors = 0;
  }
  
  lastErrorTime = now;
  consecutiveErrors++;
  
  if (consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) {
    errorRecoveryMode = true;
    if (statusUpdateCallback) {
      statusUpdateCallback("Too many errors. The system will automatically recover when possible.");
    }
    console.warn("Entering error recovery mode due to consecutive errors");
  }
  
  // Get the backoff time based on error count (with a maximum)
  const backoffIndex = Math.min(consecutiveErrors - 1, backoffTimes.length - 1);
  const waitTime = backoffTimes[backoffIndex];
  
  // Log the error and wait time
  console.log(`API error (${consecutiveErrors}): ${error.message}. Waiting ${waitTime}ms before retry.`);
  
  return waitTime;
}

/**
 * Resets the error counters when successful operations occur
 */
function resetErrorCounters() {
  if (consecutiveErrors > 0) {
    console.log("API call successful, resetting error counters");
  }
  consecutiveErrors = 0;
  errorRecoveryMode = false;
}

/**
 * Check if the system is in error recovery mode
 * @returns {boolean} - True if in recovery mode
 */
function isInErrorRecoveryMode() {
  return errorRecoveryMode;
}

// Export the functions
window.ErrorHandler = {
  handleApiError,
  resetErrorCounters,
  isInErrorRecoveryMode
}; 