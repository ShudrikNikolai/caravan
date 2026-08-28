export const API_RESPONSE_METADATA = 'api_response_metadata' as const;
export const API_RESPONSE_TIMEOUT = 100000 as const;

export const API_RESPONSE_ERROR = {
  INTERNAL_SERVER_ERROR: 'Internal Server Error',
  UNHANDLED_EXCEPTION: 'Unhandled exception',
  VALIDATION_FAILED: 'Validation failed',
};

export const API_AUTH = {
  KEY: 'name',
  KEY_EXPIRE: 'TokenExpiredError',
  ERR: {
    TOKEN_EXPIRED: 'Token expired',
    INVALID: 'Invalid or expired token',
  },
};
