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

  // SOCKET ROOM
  ALREADY_JOINED_ROOM: { code: 10001, message: "already joined room" },
  ROOM_NOT_FOUND: { code: 10002, message: "room not found" },
  NOT_ROOM_OWNER: { code: 10003, message: "not room owner" },
  NOT_ROOM_MEMBER: { code: 10004, message: "not room member" },
  ALREADY_EXISTED_ROOM: { code: 10006, message: "already existed room" },

  // SOCKET CALL
  REQUESTED_SAME_STATE: { code: 10005, message: "requested same state" },
};
