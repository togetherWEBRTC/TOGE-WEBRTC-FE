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
import { useMediaState } from "../../context/MediaStateProvider";
import {
  BsCameraVideo,
  BsCameraVideoOff,
  BsMic,
  BsMicMute,
  BsLink45Deg,
} from "react-icons/bs";

type PeerConnections = {
  [userId: string]: RTCPeerConnection;
};

export default function Room() {
  const socket = useSocket();
  const { roomCode } = useParams();
  const { authUser } = useSession();
  const navigate = useNavigate();

  const { mediaState } = useMediaState();

  const myStream = useRef<MediaStream>();

  const [mute, setMute] = useState<boolean>(false);
  const [videoOff, setVideoOff] = useState<boolean>(false);

  const [onScreenShare, setOnScreenShare] = useState<boolean>(false);

  const videoRefs = useRef<{ [userId: string]: HTMLVideoElement | null }>({});
  const [isVideoPlaying, setIsVideoPlaying] = useState<Record<string, boolean>>(
    {}
  );

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
      // 비디오 재생 상태 확인을 통한 대체 이미지 표시를 위한 코드
      const handlePlay = () =>
        setIsVideoPlaying((prev) => ({ ...prev, [userId]: true }));
      const handlePause = () =>
        setIsVideoPlaying((prev) => ({ ...prev, [userId]: false }));
      const handleEnded = () =>
        setIsVideoPlaying((prev) => ({ ...prev, [userId]: false }));

      if (node) {
        videoRefs.current[userId] = node;

        videoRefs.current[userId].addEventListener("play", handlePlay);
        videoRefs.current[userId].addEventListener("pause", handlePause);
        videoRefs.current[userId].addEventListener("ended", handleEnded);
      } else {
        videoRefs.current[userId]?.removeEventListener("play", handlePlay);
        videoRefs.current[userId]?.removeEventListener("pause", handlePause);
        videoRefs.current[userId]?.removeEventListener("ended", handleEnded);
        delete videoRefs.current[userId];
      }
    },
    []
  );

  const toggleMute = () => {
    myStream.current
      ?.getAudioTracks()
      .forEach((track) => (track.enabled = !track.enabled));
    setMute((prev) => !prev);
  };

  const toggleVideo = () => {
    myStream.current
      ?.getVideoTracks()
      .forEach((track) => (track.enabled = !track.enabled));
    setVideoOff((prev) => !prev);
  };

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

  useEffect(() => {
    // 미디어 장치 사용 설정 후 입장시 / 화면 공유 종료 시 / 미디어 장치 변경 시
    if (onScreenShare) {
      return;
    }
    if (mediaState.camera.deviceId || mediaState.microphone.deviceId) {
      const constraints: MediaStreamConstraints = {
        video: false,
        audio: false,
      };

      if (mediaState.camera.deviceId) {
        constraints.video = {
          deviceId: { exact: mediaState.camera.deviceId },
        };
      }

      if (mediaState.microphone.deviceId) {
        constraints.audio = {
          deviceId: { exact: mediaState.microphone.deviceId },
        };
      }

      navigator.mediaDevices
        .getUserMedia(constraints)
        .then((stream) => {
          Object.values(rtcRef.current).forEach((rtc) => {
            if (myStream.current) {
              // 카메라 및 마이크를 사용 중이었을 경우(stream 존재), addTrack 대신 replaceTrack 사용
              const videoSender = rtc
                .getSenders()
                .find((sender) => sender.track?.kind === "video");

              const audioSender = rtc
                .getSenders()
                .find((sender) => sender.track?.kind === "audio");

              if (videoSender) {
                videoSender.replaceTrack(stream.getVideoTracks()[0]);
              } else {
                const videoTrack = stream.getVideoTracks()[0];
                rtc.addTrack(videoTrack, stream);
              }

              if (audioSender) {
                audioSender.replaceTrack(stream.getAudioTracks()[0]);
              } else {
                const audioTrack = stream.getAudioTracks()[0];
                rtc.addTrack(audioTrack, stream);
              }
            } else {
              stream.getTracks().forEach((track) => {
                rtc.addTrack(track, stream);
              });
            }
          });

          myStream.current = stream;
          videoRefs.current[authUser!.userId]!.srcObject = stream;
        })
        .catch((err) => {
          console.error(err);
        });
    }
  }, [mediaState, authUser, onScreenShare, participants]);

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
      if (myStream.current) {
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
            // 트랙 제거 시 ( 카메라 및 마이크 사용 중지 시 / 카메라 및 마이크 사용을 하지 않는 상태에서 화면 공유 종료 시)
            e.streams[0].onremovetrack = () => {
              // 남아 있는 트랙이 있는 경우( 카메라 및 마이크 중 하나를 사용하지 않도록 변경 시 ) srcObject 유지
              const remainingTracks = e.streams[0].getTracks();
              if (remainingTracks.length === 0) {
                videoRefs.current[member.userId]!.srcObject = null;
              } else {
                console.log(
                  `Remaining tracks for ${member.userId}:`,
                  remainingTracks
                );
              }
            };
            videoRefs.current[member.userId]!.srcObject = e.streams[0];
          };

          newPeerConnection.onicecandidate = (e) => {
            if (e.candidate) {
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
            const offer = await newPeerConnection.createOffer();
            await newPeerConnection.setLocalDescription(offer);
            socket?.emit(
              "signal_send_offer",
              {
                roomCode,
                toUserId: member.userId,
                sdp: offer.sdp,
              },
              (res: SocketResponse) => {}
            );
          };

          rtcRef.current[member.userId] = newPeerConnection;
        });

        if (res.roomMemberList.length > 1) {
          socket?.emit("rtc_ready", { roomCode }, (res: SocketResponse) => {});
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

        myStream.current?.getTracks().forEach((track) => {
          rtcRef.current[changedUser.userId].addTrack(track, myStream.current!);
        });

        rtcRef.current[changedUser.userId].ontrack = (e) => {
          e.streams[0].onremovetrack = () => {
            // 남아 있는 트랙이 있는 경우( 카메라 및 마이크 중 하나를 사용하지 않도록 변경 시 ) srcObject 유지
            const remainingTracks = e.streams[0].getTracks();
            if (remainingTracks.length === 0) {
              videoRefs.current[changedUser.userId]!.srcObject = null;
            } else {
              console.log(
                `Remaining tracks for ${changedUser.userId}:`,
                remainingTracks
              );
            }
          };
          videoRefs.current[changedUser.userId]!.srcObject = e.streams[0];
        };

        rtcRef.current[changedUser.userId].onicecandidate = (e) => {
          if (e.candidate) {
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
          if (rtcRef.current[changedUser.userId].signalingState === "stable") {
            console.log(
              "negotiationneeded",
              rtcRef.current[changedUser.userId].signalingState
            );
            return;
          }
          const offer = await rtcRef.current[changedUser.userId].createOffer();
          await rtcRef.current[changedUser.userId].setLocalDescription(offer);
          socket.emit(
            "signal_send_offer",
            {
              roomCode,
              toUserId: changedUser.userId,
              sdp: offer.sdp,
            },
            (res: SocketResponse) => {}
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

        myStream.current?.getTracks().forEach((track) => {
          rtcRef.current[userId].addTrack(track, myStream.current!);
        });

        rtcRef.current[userId].onicecandidate = (e) => {
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
          const offer = await rtcRef.current[userId].createOffer();
          await rtcRef.current[userId].setLocalDescription(offer);
          socket.emit(
            "signal_send_offer",
            {
              roomCode,
              toUserId: userId,
              sdp: offer.sdp,
            },
            (res: SocketResponse) => {}
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
        (res: SocketResponse) => {}
      );
    };

    const handleSignalNotifyIce = ({
      fromUserId,
      candidate,
      sdpMid,
      sdpMLineIndex,
    }: SignalNotifyIceData) => {
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
        (_: SocketResponse) => {}
      );
    };

    const handleSignalNotifyAnswer = ({
      fromUserId,
      sdp,
    }: SignalNotifyData) => {
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
          frameRate: 15,
          width: 1080,
          height: 720,
        },
      })
      .then((stream) => {
        myStream.current = stream;
        setOnScreenShare(true);

        videoRefs.current[authUser!.userId]!.srcObject = stream;

        Object.values(rtcRef.current).forEach((rtc) => {
          const videoSender = rtc
            .getSenders()
            .find((sender) => sender.track?.kind === "video");

          if (videoSender) {
            videoSender.replaceTrack(stream.getVideoTracks()[0]);
          } else {
            stream.getTracks().forEach((track) => {
              const sender = rtc.addTrack(track, myStream.current!);
              const parameters = sender.getParameters();
              if (parameters.encodings) {
                parameters.encodings = parameters.encodings.map(
                  (encoding, index) => {
                    if (index === 0) {
                      return {
                        ...encoding,
                        scaleResolutionDownBy: 1.0,
                        maxBitrate: 2500000,
                      }; // 고화질
                    } else if (index === 1) {
                      return {
                        ...encoding,
                        scaleResolutionDownBy: 2.0,
                        maxBitrate: 1000000,
                      }; // 중화질
                    } else {
                      return {
                        ...encoding,
                        scaleResolutionDownBy: 4.0,
                        maxBitrate: 500000,
                      }; // 저화질
                    }
                  }
                );
                sender.setParameters(parameters);
              }
            });
          }
        });
      })
      .catch((err) => {
        console.error("Error accessing display media:", err);
      });
  };

  const stopScreenShare = () => {
    if (!myStream.current) {
      return;
    }
    myStream.current.getVideoTracks()[0].stop();

    if (!mediaState.camera.deviceId) {
      // 피어커넥션 트랙 제거
      Object.values(rtcRef.current).forEach((rtc) => {
        const videoSender = rtc
          .getSenders()
          .find(
            (sender) => sender.track === myStream.current!.getVideoTracks()[0]
          );

        if (!videoSender) {
          console.log("videoTrack not found");
          console.log(
            "videoTrack not found. Available senders:",
            rtc.getSenders().map((sender) => sender.track)
          );
          return;
        }
        rtc.removeTrack(videoSender);
      });

      // 마이크 사용 X, 카메라 사용 X 인 상태에서 화면 공유 종료 시, srcObject 초기화
      const remainingTracks = myStream.current.getTracks();
      if (remainingTracks.length === 0) {
        videoRefs.current[authUser!.userId]!.srcObject = null;
      }

      myStream.current = undefined;
      if (!mediaState.camera.deviceId) {
        videoRefs.current[authUser!.userId]!.srcObject = null;
      }
    }
    setOnScreenShare(false);
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
            {!isVideoPlaying[participant.userId] && (
              <img
                className={styles.avatar}
                src={`${import.meta.env.VITE_BASE_RESOURCE_URL}/${
                  participant.profileUrl
                }`}
              />
            )}
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
          <button className={styles.iconContainer} onClick={toggleVideo}>
            {videoOff ? <BsCameraVideoOff /> : <BsCameraVideo />}
          </button>
          <button className={styles.iconContainer} onClick={toggleMute}>
            {mute ? <BsMicMute /> : <BsMic />}
          </button>
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
          <button className={styles.link}>
            <BsLink45Deg />
          </button>
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
