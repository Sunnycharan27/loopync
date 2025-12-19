// Utility function to extract error message from API responses
export const getErrorMessage = (error, defaultMsg = "An error occurred") => {
  // Get the detail from axios error response
  const detail = error?.response?.data?.detail;
  
  // If detail is a string, return it
  if (typeof detail === 'string') {
    return detail;
  }
  
  // If detail is an array (FastAPI validation errors), get the first message
  if (Array.isArray(detail) && detail.length > 0) {
    const firstError = detail[0];
    if (typeof firstError === 'string') {
      return firstError;
    }
    if (firstError?.msg) {
      return firstError.msg;
    }
  }
  
  // If detail is an object with msg property (single validation error)
  if (detail?.msg) {
    return detail.msg;
  }
  
  // If detail is an object with message property
  if (detail?.message) {
    return detail.message;
  }
  
  // Try error.message
  if (error?.message && typeof error.message === 'string') {
    return error.message;
  }
  
  // Return default message
  return defaultMsg;
};

// Safe toast error function
export const safeToastError = (toast, error, defaultMsg = "An error occurred") => {
  const message = getErrorMessage(error, defaultMsg);
  toast.error(message);
};

// Safe toast success function  
export const safeToastSuccess = (toast, message) => {
  if (typeof message === 'string') {
    toast.success(message);
  } else {
    toast.success("Success!");
  }
};
