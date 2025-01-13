export const ResCode = {
  SUCCESS: { code: 0, message: "Success" },
  SERVER_ERROR: { code: 1, message: "Server Error" },
  INVALID_PARAMS: { code: 2, message: "unknown invalid parameters" },
  DATA_ERROR: { code: 3, message: "Data Error" },

  // Auth
  INVAILD_ACCESS_TOKEN: { code: 1001, message: "invalid access token" },
  INVAILD_REFRESH_TOKEN: { code: 1002, message: "invalid refresh token" },
  FAILED_LOGIN: { code: 1003, message: "failed login" },
  DUPLICATED_ID: { code: 1004, message: "duplicated id" },
};
