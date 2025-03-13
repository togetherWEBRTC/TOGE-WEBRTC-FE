import { AuthUser } from "./auth";

export type Chat = {
  name: "chat_notify_message" | "system_message";
  message: string;
  sendedTime: string;
  senderInfo: Participant;
};

export type Participant = AuthUser & {
  isOwner: boolean;
  isMicrophoneOn: boolean;
  isCameraOn: boolean;
  isHandRaised: boolean;
};

export type RoomNotifyUpdateData = {
  name: "room_notify_update_participant";
  participants: Participant[];
  isJoined: boolean;
  changedUser: AuthUser;
};

export type SignalNotifyData = {
  name: "signal_notify_offer" | "signal_notify_answer";
  fromUserId: string;
  sdp: string;
};

export type RoomNotifyWaitData = {
  name: "room_notify_wait";
  waitingList: AuthUser[];
  updatedUser: AuthUser;
  isAdded: boolean;
};

export type SignalNotifyIceData = {
  name: "signal_notify_ice";
  fromUserId: string;
  candidate: string;
  sdpMid: string;
  sdpMLineIndex: number;
};

export type RtcReadyData = {
  userId: string;
};
