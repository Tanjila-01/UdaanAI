/**
 * Normalizes API and Axios errors into readable, user-facing strings.
 * Safely unpacks FastAPI/Pydantic validation arrays, error detail objects,
 * or raw strings so React never crashes attempting to render an object or array child.
 *
 * @param {any} err - The error object or response
 * @param {string} fallbackMessage - Default message if no specific detail is found
 * @returns {string} Safe displayable string
 */
export const normalizeApiError = (err, fallbackMessage = 'An unexpected error occurred.') => {
  if (!err) return fallbackMessage;

  // If already a primitive string
  if (typeof err === 'string' && err.trim()) {
    return err.trim();
  }

  // If err is directly an array
  if (Array.isArray(err) && err.length > 0) {
    const messages = err
      .map((item) => {
        if (typeof item === 'string') return item.trim();
        if (item && typeof item === 'object') {
          return item.msg || item.message || JSON.stringify(item);
        }
        return String(item);
      })
      .filter(Boolean);
    if (messages.length > 0) {
      return messages.join(', ');
    }
  }

  const detail = err.response?.data?.detail;

  // Case 1: FastAPI string detail (e.g. 404/400/409/500 HTTPException)
  if (typeof detail === 'string' && detail.trim()) {
    return detail.trim();
  }

  // Case 2: FastAPI / Pydantic validation error array (e.g. 422 Unprocessable Entity)
  if (Array.isArray(detail) && detail.length > 0) {
    const messages = detail
      .map((item) => {
        if (typeof item === 'string') return item.trim();
        if (item && typeof item === 'object') {
          return item.msg || item.message || JSON.stringify(item);
        }
        return String(item);
      })
      .filter(Boolean);
    if (messages.length > 0) {
      return messages.join(', ');
    }
  }

  // Case 3: Detail is an object with msg or message
  if (detail && typeof detail === 'object') {
    const msg = detail.msg || detail.message;
    if (typeof msg === 'string' && msg.trim()) {
      return msg.trim();
    }
    try {
      return JSON.stringify(detail);
    } catch {
      // Fallback
    }
  }

  // Case 4: Custom response message property
  if (typeof err.response?.data?.message === 'string' && err.response.data.message.trim()) {
    return err.response.data.message.trim();
  }

  // Case 5: Direct error properties (e.g. err.msg, err.message, err.detail)
  if (typeof err.msg === 'string' && err.msg.trim()) {
    return err.msg.trim();
  }
  if (typeof err.detail === 'string' && err.detail.trim()) {
    return err.detail.trim();
  }
  if (typeof err.message === 'string' && err.message.trim()) {
    return err.message.trim();
  }

  // Case 6: Plain object stringify fallback if it's a non-empty object
  if (typeof err === 'object' && Object.keys(err).length > 0) {
    try {
      return JSON.stringify(err);
    } catch {
      // Fallback below
    }
  }

  return fallbackMessage;
};
