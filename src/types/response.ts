import { ResCode } from "./../constants/response";
import { Participant } from "./room";
import { IauthUser } from "./session";

type ResCodeType = (typeof ResCode)[keyof typeof ResCode];

export interface BaseResponse {
  code: ResCodeType["code"];
  message: ResCodeType["message"];
}

export interface LoginResponse extends BaseResponse {
  userInfo?: IauthUser;
  accessToken?: string;
  refreshToken?: string;
}

export interface RoomCreateResponse extends BaseResponse {
  roomCode: string;
}

// Socket Response
export interface SocketResponse extends BaseResponse {
  name?: string;
}

export interface RoomMemberListResponse extends SocketResponse {
  name?: "room_member_list";
  roomMemberList?: Participant[];
}
