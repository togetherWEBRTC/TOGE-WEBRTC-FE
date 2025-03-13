import { useCallback, useEffect, useRef, useState } from "react";
import styles from "./Room.module.css";
import { useSession } from "../../context/SessionProvider";
import { useNavigate, useParams } from "react-router";
import { useSocket } from "../../context/SocketProvider";
import { RoomMemberListResponse, SocketResponse } from "../../types/response";
import { ResCode } from "../../constants/response";
import Portal from "../../components/common/Portal";
import RoomToast from "../../components/Room/RoomToast/RoomToast";
import Button from "../../components/common/Button/Button";
import Label from "../../components/common/Label/Label";
import { AuthUser } from "../../types/auth";
import {
  Chat,
  Participant,
  RoomNotifyUpdateData,
  RoomNotifyWaitData,
  RtcReadyData,
  SignalNotifyData,
  SignalNotifyIceData,
} from "../../types/room";

type PeerConnections = {
  [userId: string]: RTCPeerConnection;
};

export default function Room() {
  const socket = useSocket();
  const { roomCode } = useParams();
  const { authUser } = useSession();
  const navigate = useNavigate();

  // const [myStream, setMyStream] = useState<MediaStream>();
  const myStream = useRef<MediaStream>();

  const [onScreenShare, setOnScreenShare] = useState<boolean>(false);

  const videoRefs = useRef<{ [userId: string]: HTMLVideoElement | null }>({});

  const [chatList, setChatList] = useState<Chat[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const rtcRef = useRef<PeerConnections>({});

  // 현재 참여
  const [waitingUser, setWaitingUser] = useState<AuthUser>();

  const [toastMessage, setToastMessage] = useState<string>("");

  //채팅창 열기/닫기
  const [onChat, setOnChat] = useState<boolean>(true);

  const setVideoRef = useCallback(
    (userId: string) => (node: HTMLVideoElement | null) => {
      if (node) {
        videoRefs.current[userId] = node;
      } else {
        delete videoRefs.current[userId];
      }
    },
    []
  );

  useEffect(() => {
    if (!authUser) {
      navigate("/login");
    }
  }, [authUser, navigate]);

  useEffect(() => {
    if (!socket) {
      navigate("/");
    }
  }, [socket, navigate]);

  // Cleanup
  useEffect(() => {
    const connections = rtcRef.current;
    return () => {
      if (socket?.connected) {
        socket?.emit("room_leave");
      }
      if (connections) {
        Object.values(connections).forEach((rtc) => {
          rtc.close();
        });
      }
      // if (myStream) {
      if (myStream.current) {
        // myStream.getTracks().forEach((track) => track.stop());
        myStream.current.getTracks().forEach((track) => track.stop());
      }

      setTimeout(() => {
        socket?.removeAllListeners();
        socket?.disconnect();
      }, 10);
    };
  }, [socket]);

  // 방 입장 시, 방 참가자 목록 요청 및 PeerConnection 생성
  useEffect(() => {
    const handleRoomMemberList = (res: RoomMemberListResponse) => {
      if (res.code === ResCode.SUCCESS.code && res.roomMemberList) {
        res.roomMemberList.forEach((member) => {
          if (member.userId === authUser?.userId) {
            return;
          }
          const newPeerConnection = new RTCPeerConnection({
            iceServers: [
              {
                urls: [
                  "stun:stun.l.google.com:19302",
                  "stun:stun1.l.google.com:19302",
                  "stun:stun2.l.google.com:19302",
                  "stun:stun3.l.google.com:19302",
                  "stun:stun4.l.google.com:19302",
                ],
              },
            ],
          });

          newPeerConnection.ontrack = (e) => {
            console.log("ontrack", e.streams[0]);
            videoRefs.current[member.userId]!.srcObject = e.streams[0];
          };

          newPeerConnection.onicecandidate = (e) => {
            console.log("onicecandidate in Room_Notify_Update_Participant");
            if (e.candidate) {
              console.log("send ice", e.candidate);
              socket?.emit(
                "signal_send_ice",
                {
                  roomCode,
                  toUserId: member.userId,
                  candidate: e.candidate.candidate,
                  sdpMid: e.candidate.sdpMid,
                  sdpMLineIndex: e.candidate.sdpMLineIndex,
                },
                (_: SocketResponse) => {}
              );
            }
          };

          newPeerConnection.onnegotiationneeded = async () => {
            console.log("onnegotiationneeded");
            console.log("myStream(onnegotiationneeded)", myStream.current);

            const offer = await newPeerConnection.createOffer();
            await newPeerConnection.setLocalDescription(offer);
            socket?.emit(
              "signal_send_offer",
              {
                roomCode,
                toUserId: member.userId,
                sdp: offer.sdp,
              },
              (res: SocketResponse) => {
                console.log("offer sended", res);
              }
            );
          };

          rtcRef.current[member.userId] = newPeerConnection;
        });

        if (res.roomMemberList.length > 1) {
          socket?.emit("rtc_ready", { roomCode }, (res: SocketResponse) => {
            console.log("rtc_ready emited !", res);
          });
        }

        setParticipants(res.roomMemberList);
      }
    };

    socket?.emit(
      "room_member_list",
      { roomCode, includingMyself: true },
      handleRoomMemberList
    );
  }, [socket, roomCode, authUser]);

  useEffect(() => {
    if (!socket) return;

    const handleChatNotifyMessage = (chat: Chat) => {
      setChatList((prev) => [...prev, chat]);
    };

    const handleRoomNotifyUpdateParticipant = ({
      participants,
      isJoined,
      changedUser,
    }: RoomNotifyUpdateData) => {
      if (isJoined) {
        // 유저 입장 시
        // PeerConnection 생성
        const newPeerConnection = new RTCPeerConnection({
          iceServers: [
            {
              urls: [
                "stun:stun.l.google.com:19302",
                "stun:stun1.l.google.com:19302",
                "stun:stun2.l.google.com:19302",
                "stun:stun3.l.google.com:19302",
                "stun:stun4.l.google.com:19302",
              ],
            },
          ],
        });
        rtcRef.current[changedUser.userId] = newPeerConnection;
        console.log("room_notify | 신규 입장 유저 : ", changedUser.userId);

        rtcRef.current[changedUser.userId].ontrack = (e) => {
          console.log("ontrack", e.streams[0]);
          videoRefs.current[changedUser.userId]!.srcObject = e.streams[0];
        };

        rtcRef.current[changedUser.userId].onicecandidate = (e) => {
          console.log("onicecandidate in Room_Notify_Update_Participant");
          if (e.candidate) {
            console.log("send ice", e.candidate);
            socket.emit(
              "signal_send_ice",
              {
                roomCode,
                toUserId: changedUser.userId,
                candidate: e.candidate.candidate,
                sdpMid: e.candidate.sdpMid,
                sdpMLineIndex: e.candidate.sdpMLineIndex,
              },
              (_: SocketResponse) => {}
            );
          }
        };

        rtcRef.current[changedUser.userId].onnegotiationneeded = async () => {
          console.log("onnegotiationneeded");
          console.log("myStream(onnegotiationneeded)", myStream.current);

          const offer = await rtcRef.current[changedUser.userId].createOffer();
          await rtcRef.current[changedUser.userId].setLocalDescription(offer);
          socket.emit(
            "signal_send_offer",
            {
              roomCode,
              toUserId: changedUser.userId,
              sdp: offer.sdp,
            },
            (res: SocketResponse) => {
              console.log("offer sended", res);
            }
          );
        };

        const systemMessage: Chat = {
          name: "system_message",
          message: `${changedUser.name}님이 입장하였습니다.`,
          sendedTime: new Date().toISOString(),
          senderInfo: {
            userId: `SYSTEM_MESSAGE_${new Date().toISOString()}`,
            name: "SYSTEM_MESSAGE",
            profileUrl: "",
            isOwner: false,
            isMicrophoneOn: false,
            isCameraOn: false,
            isHandRaised: false,
          },
        };

        setChatList((prev) => [...prev, systemMessage]);
      } else {
        // 유저 퇴장 시
        // PeerConnection 정리
        const PeerConnection = rtcRef.current[changedUser.userId];
        PeerConnection.close();
        delete rtcRef.current[changedUser.userId];

        const systemMessage: Chat = {
          name: "system_message",
          message: `${changedUser.name}님이 퇴장하였습니다.`,
          sendedTime: new Date().toISOString(),
          senderInfo: {
            userId: `SYSTEM_MESSAGE_${new Date().toISOString()}`,
            name: "SYSTEM_MESSAGE",
            profileUrl: "",
            isOwner: false,
            isMicrophoneOn: false,
            isCameraOn: false,
            isHandRaised: false,
          },
        };

        setChatList((prev) => [...prev, systemMessage]);
      }
      setParticipants(participants);
    };

    const handleRtcReady = async ({ userId }: RtcReadyData) => {
      console.log("rtc_ready from ", userId);
      if (!rtcRef.current[userId]) {
        console.log(
          "rtc_ready 인데, rtcRef.current[userId] 없어서 만들도록 하겠음 ",
          userId
        );
        rtcRef.current[userId] = new RTCPeerConnection({
          iceServers: [
            {
              urls: [
                "stun:stun.l.google.com:19302",
                "stun:stun1.l.google.com:19302",
                "stun:stun2.l.google.com:19302",
                "stun:stun3.l.google.com:19302",
                "stun:stun4.l.google.com:19302",
              ],
            },
          ],
        });

        // myStream?.getTracks().forEach((track) => {
        myStream.current?.getTracks().forEach((track) => {
          // rtcRef.current[userId].addTrack(track, myStream);
          rtcRef.current[userId].addTrack(track, myStream.current!);
        });

        rtcRef.current[userId].onicecandidate = (e) => {
          console.log("onicecandidate in handleRtcReady");
          if (e.candidate) {
            socket.emit(
              "signal_send_ice",
              {
                roomCode,
                toUserId: userId,
                candidate: e.candidate.candidate,
                sdpMid: e.candidate.sdpMid,
                sdpMLineIndex: e.candidate.sdpMLineIndex,
              },
              (_: SocketResponse) => {}
            );
          }
        };

        rtcRef.current[userId].onnegotiationneeded = async () => {
          console.log("onnegotiationneeded");
          const offer = await rtcRef.current[userId].createOffer();
          await rtcRef.current[userId].setLocalDescription(offer);
          socket.emit(
            "signal_send_offer",
            {
              roomCode,
              toUserId: userId,
              sdp: offer.sdp,
            },
            (res: SocketResponse) => {
              console.log("offer sended", res);
            }
          );
        };
      }
      const rtc = rtcRef.current[userId];

      const offer = await rtc.createOffer();
      await rtc.setLocalDescription(offer);
      socket.emit(
        "signal_send_offer",
        {
          roomCode,
          toUserId: userId,
          sdp: offer.sdp,
        },
        (res: SocketResponse) => {
          console.log("offer sended", res);
        }
      );
    };

    const handleSignalNotifyIce = ({
      fromUserId,
      candidate,
      sdpMid,
      sdpMLineIndex,
    }: SignalNotifyIceData) => {
      console.log("Singal_Nofity_Ice | from : ", fromUserId);
      rtcRef.current[fromUserId].addIceCandidate(
        new RTCIceCandidate({
          candidate,
          sdpMid,
          sdpMLineIndex,
        })
      );
    };

    const handleSignalNotifyOffer = async ({
      fromUserId,
      sdp,
    }: SignalNotifyData) => {
      console.log("Signal_Notify_Offer | from : ", fromUserId);
      const rtc = rtcRef.current[fromUserId];
      await rtc.setRemoteDescription({ type: "offer", sdp });

      const answer = await rtc.createAnswer();
      await rtc.setLocalDescription(answer);
      socket.emit(
        "signal_send_answer",
        {
          roomCode,
          toUserId: fromUserId,
          sdp: answer.sdp,
        },
        (_: SocketResponse) => {
          console.log("answer sended");
        }
      );
    };

    const handleSignalNotifyAnswer = ({
      fromUserId,
      sdp,
    }: SignalNotifyData) => {
      console.log("Signal_Notify_Answer from ", fromUserId);
      rtcRef.current[fromUserId].setRemoteDescription({
        type: "answer",
        sdp,
      });
    };

    const handleRoomNotifyUpdateOwner = () => {
      alert("호스트로 변경되었습니다.");
    };

    // 채팅 메세지 수신
    socket.on("chat_notify_message", handleChatNotifyMessage);

    // 방 참여자 변경 알림
    socket.on(
      "room_notify_update_participant",
      handleRoomNotifyUpdateParticipant
    );

    // icecandidate 제공 및 offer
    socket.on("rtc_ready", handleRtcReady);

    // icecandidate 수신
    socket.on("signal_notify_ice", handleSignalNotifyIce);

    // offer 수신 및 answer 전송
    socket.on("signal_notify_offer", handleSignalNotifyOffer);

    // answer 수신
    socket.on("signal_notify_answer", handleSignalNotifyAnswer);

    // 방장 변경 알림
    socket.on("room_notify_update_owner", handleRoomNotifyUpdateOwner);

    return () => {
      socket.off("chat_notify_message", handleChatNotifyMessage);
      socket.off(
        "room_notify_update_participant",
        handleRoomNotifyUpdateParticipant
      );
      socket.off("rtc_ready", handleRtcReady);
      socket.off("signal_notify_ice", handleSignalNotifyIce);
      socket.off("signal_notify_offer", handleSignalNotifyOffer);
      socket.off("signal_notify_answer", handleSignalNotifyAnswer);
      socket.off("room_notify_update_owner", handleRoomNotifyUpdateOwner);
    };
  }, [socket, roomCode]);

  // deps 에 waitingUser 없을 시, 클로저 문제로 인해 waitingUser가 undefined로 인식되어 useEffect가 실행되지 않음(클로저 트랩)
  useEffect(() => {
    // 입장대기자 변경 알림
    socket?.on("room_notify_wait", (watingInfo: RoomNotifyWaitData) => {
      if (watingInfo.isAdded) {
        if (!waitingUser) {
          setWaitingUser(watingInfo.updatedUser);
          setToastMessage(
            `${watingInfo.updatedUser.name}님의 입장을 허용하시겠습니까?`
          );
          return;
        }
      } else {
        // 현재 입장 승인 중인 대기자가 이탈 시, 토스트 Off
        if (waitingUser?.userId === watingInfo.updatedUser.userId) {
          setToastMessage("");
          setWaitingUser(undefined);
          // 다음 렌더링에 변경된 대기자 정보가 반영되도록 setTimeout 사용
          if (watingInfo.waitingList.length > 0) {
            setTimeout(() => {
              setWaitingUser(watingInfo.waitingList[0]);
              setToastMessage(
                `${watingInfo.waitingList[0].name}님의 입장을 허용하시겠습니까?`
              );
            }, 0);
          }
        }
      }
    });
    return () => {
      socket?.off("room_notify_wait");
    };
  }, [socket, waitingUser]);

  const startScreenShare = () => {
    if (!videoRefs.current[authUser!.userId]) {
      return;
    }

    navigator.mediaDevices
      .getDisplayMedia({
        video: {
          displaySurface: "monitor",
        },
        audio: false,
      })
      .then((stream) => {
        // setMyStream(stream);
        myStream.current = stream;
        setOnScreenShare(true);

        videoRefs.current[authUser!.userId]!.srcObject = stream;

        Object.values(rtcRef.current).forEach((rtc) => {
          stream.getTracks().forEach((track) => {
            console.log("track added", track);
            rtc.addTrack(track, myStream.current!);
            console.log("현재 연결된 senders:", rtc.getSenders());
          });
        });
      })
      .catch((err) => {
        console.error("Error accessing display media:", err);
      });
  };

  const stopScreenShare = () => {
    // if (!myStream) {
    if (!myStream.current) {
      return;
    }
    // myStream.getTracks().forEach((track) => {
    myStream.current.getTracks().forEach((track) => {
      console.log("stop track", track);
      track.stop();
    });
    // setMyStream(undefined);
    myStream.current = undefined;
    setOnScreenShare(false);

    videoRefs.current[authUser!.userId]!.srcObject = null;
  };

  const handleMessageSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const { message } = Object.fromEntries(new FormData(form));
    socket?.emit(
      "chat_send_message",
      { roomCode, message },
      (_: SocketResponse) => {}
    );
    form.reset();
  };

  const handleAcceptJoin = (userId: string, accept: boolean) => {
    socket?.emit(
      "room_decide_join_from_host",
      {
        roomCode,
        userId,
        isApprove: accept,
      },
      (_: SocketResponse) => {}
    );
    setToastMessage("");
    setWaitingUser(undefined);
  };

  const quitRoom = () => {
    navigate("/");
  };

  return (
    <main className={styles.container}>
      <div className={styles.videoSection}>
        {participants.map((participant) => (
          <div className={styles.videoBox} key={participant.userId}>
            <video ref={setVideoRef(participant.userId)} autoPlay playsInline />
            <Label
              style={{
                position: "absolute",
                bottom: "4px",
                left: "16px",
                color: "var(--white)",
              }}
            >
              {participant.name}
            </Label>
          </div>
        ))}

        <div className={styles.actionBar}>
          <Button style="primary" size="sm" onClick={quitRoom}>
            통화 종료
          </Button>
          <Button
            style="secondary"
            size="sm"
            onClick={onScreenShare ? stopScreenShare : startScreenShare}
          >
            {onScreenShare ? "화면 공유 중지" : "화면 공유"}
          </Button>
          <Button
            style="secondary"
            size="sm"
            onClick={() => setOnChat(!onChat)}
          >
            채팅
          </Button>
        </div>
      </div>
      {onChat && (
        <div className={styles.chatSection}>
          <ul className={styles.chatList}>
            {chatList.map((chat) => (
              <li key={chat.sendedTime}>
                {chat.name === "system_message"
                  ? chat.message
                  : `${chat.senderInfo.userId}: ${chat.message}`}
              </li>
            ))}
          </ul>
          <form
            className={styles.inputContainer}
            onSubmit={handleMessageSubmit}
          >
            <input type="text" id="chat" name="message" placeholder="입력 창" />
            <button>채 팅 입 력</button>
          </form>
        </div>
      )}
      {toastMessage && (
        <Portal>
          <RoomToast
            message={toastMessage}
            confirmHandler={() => {
              handleAcceptJoin(waitingUser!.userId, true);
            }}
            cancelHandler={() => {
              handleAcceptJoin(waitingUser!.userId, false);
            }}
          />
        </Portal>
      )}
    </main>
  );
}
