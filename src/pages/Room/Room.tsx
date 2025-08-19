import { useCallback, useEffect, useRef, useState } from "react";
import styles from "./Room.module.css";
import { useSession } from "../../context/SessionProvider";
import { useNavigate, useParams } from "react-router";
import { useSocket } from "../../context/SocketProvider";
import { RoomMemberListResponse, SocketResponse } from "../../types/response";
import { ResCode } from "../../constants/response";
import Portal from "../../components/common/Portal";
import RoomToast from "../../components/Room/RoomToast/RoomToast";
import { AuthUser } from "../../types/auth";
import {
  CallNotifyScreenShareOffData,
  Chat,
  Participant,
  RoomNotifyUpdateData,
  RoomNotifyWaitData,
  SignalNotifyData,
  SignalNotifyIceData,
} from "../../types/room";
import { useMediaState } from "../../context/MediaStateProvider";
import VideoBox from "../../components/Room/VideoBox/VideoBox";
import ChatList from "../../components/Room/ChatList/ChatList";
import ActionBar from "../../components/Room/ActionBar/ActionBar";
import useRoomPeerConnections from "../../hooks/useRoomPeerConnections";

type OfferState = {
  [userId: string]: boolean;
};

type ScreenShareState = {
  [userId: string]: boolean;
};

export default function Room() {
  const socket = useSocket();
  const { roomCode } = useParams();
  const { authUser } = useSession();
  const navigate = useNavigate();
  const params = useParams();

  const { mediaState } = useMediaState();

  const myStream = useRef<MediaStream>();
  const myScreenShareStream = useRef<MediaStream>();

  useEffect(() => {
    if (!authUser) {
      navigate("/login");
    }
  }, [authUser, navigate]);

  const {
    peerConnectionsRef: rtcRef,
    screenSharePeerConnectionsRef: screenShareRtcRef,
    createPeerConnectionByUserId,
    createScreenSharePeerConnectionByUserId,
  } = useRoomPeerConnections({ socket, roomCode });

  const [participants, setParticipants] = useState<Participant[]>([]);

  const [mute, setMute] = useState<boolean>(false);
  const [videoOff, setVideoOff] = useState<boolean>(false);
  const [onScreenShare, setOnScreenShare] = useState<ScreenShareState>({});

  const [focused, setFocused] = useState<string>();
  const videoRefs = useRef<{ [userId: string]: HTMLVideoElement | null }>({});
  const screenShareVideoRefs = useRef<{
    [userId: string]: HTMLVideoElement | null;
  }>({});
  const [isVideoPlaying, setIsVideoPlaying] = useState<Record<string, boolean>>(
    {}
  );

  const videoHandlersRef = useRef<{
    [key: string]: {
      handlePlay: () => void;
      handlePause: () => void;
      handleEnded: () => void;
    };
  }>({});

  const screenShareVideoHandlersRef = useRef<{
    [key: string]: {
      handlePlay: () => void;
      handlePause: () => void;
      handleEnded: () => void;
    };
  }>({});

  const [chatList, setChatList] = useState<Chat[]>([]);

  // perfect negotiation
  const makingOffer = useRef<OfferState>({});
  const makingScreenShareOffer = useRef<OfferState>({});

  // Canditate Queueing
  const candidateQueue = useRef<{ [userId: string]: RTCIceCandidateInit[] }>(
    {}
  );
  const screenShareCandidateQueue = useRef<{
    [userId: string]: RTCIceCandidateInit[];
  }>({});

  // 현재 참여
  const [waitingUser, setWaitingUser] = useState<AuthUser>();

  const [toastMessage, setToastMessage] = useState<string>("");

  //채팅창 열기/닫기
  const [onChat, setOnChat] = useState<boolean>(true);

  const setVideoRef = useCallback(
    (userId: string) => (node: HTMLVideoElement | null) => {
      if (node) {
        videoRefs.current[userId] = node;

        if (authUser?.userId === userId) {
          node.muted = true;
        }

        // 비디오 재생 상태 확인을 통한 대체 이미지 표시를 위한 코드
        const handlePlay = () =>
          setIsVideoPlaying((prev) => ({ ...prev, [userId]: true }));
        const handlePause = () =>
          setIsVideoPlaying((prev) => ({ ...prev, [userId]: false }));
        const handleEnded = () =>
          setIsVideoPlaying((prev) => ({ ...prev, [userId]: false }));

        videoHandlersRef.current[userId] = {
          handlePlay,
          handlePause,
          handleEnded,
        };

        if (authUser?.userId !== userId && !rtcRef.current[userId]) {
          rtcRef.current[userId] = createPeerConnectionByUserId(userId, node);
          myStream.current?.getTracks().forEach((track) => {
            rtcRef.current[userId].addTrack(track, myStream.current!);
          });
        }

        videoRefs.current[userId].addEventListener("play", handlePlay);
        videoRefs.current[userId].addEventListener("pause", handlePause);
        videoRefs.current[userId].addEventListener("ended", handleEnded);
      } else {
        if (videoRefs.current[userId] && videoHandlersRef.current[userId]) {
          videoRefs.current[userId].removeEventListener(
            "play",
            videoHandlersRef.current[userId].handlePlay
          );
          videoRefs.current[userId].removeEventListener(
            "pause",
            videoHandlersRef.current[userId].handlePause
          );
          videoRefs.current[userId].removeEventListener(
            "ended",
            videoHandlersRef.current[userId].handleEnded
          );
        }
        delete videoHandlersRef.current[userId];
        delete videoRefs.current[userId];
      }
    },
    [authUser, createPeerConnectionByUserId, rtcRef]
  );

  const setScreenShareVideoRef = useCallback(
    (userId: string) => (node: HTMLVideoElement | null) => {
      if (node) {
        screenShareVideoRefs.current[userId] = node;

        if (authUser?.userId === userId) {
          node.muted = true;
        }

        const handlePlay = () => {
          setOnScreenShare((prev) => ({ ...prev, [userId]: true }));
          setIsVideoPlaying((prev) => ({ ...prev, [userId]: true }));
        };

        screenShareVideoRefs.current[userId].addEventListener(
          "play",
          handlePlay
        );
      } else {
        if (
          screenShareVideoRefs.current[userId] &&
          screenShareVideoHandlersRef.current[userId]
        ) {
          screenShareVideoRefs.current[userId].removeEventListener(
            "play",
            screenShareVideoHandlersRef.current[userId].handlePlay
          );
        }

        delete screenShareVideoHandlersRef.current[userId];
        delete screenShareVideoRefs.current[userId];
      }
    },
    [authUser]
  );

  //  ---- ActionBar Functions ----
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

  const toggleChat = () => {
    setOnChat((prev) => !prev);
  };

  const quitRoom = () => {
    if (myScreenShareStream.current) {
      myScreenShareStream.current.getTracks().forEach((track) => track.stop());
    }
    navigate("/");
  };

  const startScreenShare = () => {
    participants.forEach((participant) => {
      if (participant.userId === authUser?.userId) {
        return;
      }
      screenShareRtcRef.current[participant.userId] =
        createScreenSharePeerConnectionByUserId(
          participant.userId,
          screenShareVideoRefs.current[participant.userId]!
        );
    });

    navigator.mediaDevices
      .getDisplayMedia({
        video: {
          frameRate: { ideal: 60 },
          width: { ideal: 3840 },
          height: { ideal: 2160 },
          logicalSurface: true,
        },
        audio: true,
      })
      .then((stream) => {
        myScreenShareStream.current = stream;
        setOnScreenShare((prev) => ({ ...prev, [authUser!.userId]: true }));

        screenShareVideoRefs.current[authUser!.userId]!.srcObject = stream;

        Object.values(screenShareRtcRef.current).forEach((rtc) => {
          stream.getTracks().forEach((track) => {
            const sender = rtc.addTrack(track, stream);
            const parameters = sender.getParameters();
            if (parameters.encodings) {
              parameters.encodings = parameters.encodings.map(
                (encoding, index) => {
                  if (index === 0) {
                    return {
                      ...encoding,
                      scaleResolutionDownBy: 1.0,
                      maxBitrate: 12_000_000,
                    }; // 고화질
                  } else if (index === 1) {
                    return {
                      ...encoding,
                      scaleResolutionDownBy: 2.0,
                      maxBitrate: 6_000_000,
                    }; // 중화질
                  } else {
                    return {
                      ...encoding,
                      scaleResolutionDownBy: 4.0,
                      maxBitrate: 3_000_000,
                    }; // 저화질
                  }
                }
              );
              sender.setParameters(parameters);
            }
          });
        });
      })
      .catch((err) => {
        console.error("Error accessing display media:", err);
      });
  };

  const stopScreenShare = () => {
    if (!myScreenShareStream.current) {
      return;
    }

    setOnScreenShare((prev) => ({
      ...prev,
      [authUser!.userId]: false,
    }));

    myScreenShareStream.current.getTracks().forEach((track) => {
      myScreenShareStream.current!.removeTrack(track);
      track.stop();
    });
    screenShareVideoRefs.current[authUser!.userId]!.srcObject = null;

    if (!myStream.current) {
      setIsVideoPlaying((prev) => ({
        ...prev,
        [authUser!.userId]: false,
      }));
    }

    socket?.emit(
      "call_notify_screen_share_off",
      {
        roomCode,
      },
      (res: SocketResponse) => {}
    );

    Object.values(screenShareRtcRef.current).forEach((rtc) => {
      rtc.getSenders().forEach((sender) => {
        sender.replaceTrack(null);
        rtc.removeTrack(sender);
      });
      rtc.close();
    });

    setOnScreenShare((prev) => ({ ...prev, [authUser!.userId]: false }));
  };

  const handleCopy = () => {
    if (!params.roomCode) return;

    navigator.clipboard.writeText(params.roomCode).then(() => {
      alert("링크가 복사되었습니다.");
    });
  };
  //  ---- ---- ---- ---- ---- ----

  //  ---- ChatList Functions ----
  const sendMessage = (message: string) => {
    socket?.emit(
      "chat_send_message",
      { roomCode, message },
      (_: SocketResponse) => {}
    );
  };
  //  ---- ---- ---- ---- ---- ---

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

  useEffect(() => {
    // 미디어 장치 스트림 받아오기 ( 장치 변경 포함 )
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
              }

              if (audioSender) {
                audioSender.replaceTrack(stream.getAudioTracks()[0]);
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
  }, [mediaState, authUser, participants, rtcRef]);

  // Cleanup
  useEffect(() => {
    const connections = rtcRef.current;
    const screenShareConnections = screenShareRtcRef.current;
    const stream = myStream.current;
    const screenShareStream = myScreenShareStream.current;
    return () => {
      if (connections) {
        Object.values(connections).forEach((rtc) => {
          rtc.close();
        });
      }

      if (screenShareConnections) {
        Object.values(screenShareConnections).forEach((rtc) => {
          rtc.close();
        });
      }

      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }

      if (screenShareStream) {
        screenShareStream.getTracks().forEach((track) => track.stop());
      }

      socket?.removeAllListeners();
      socket?.disconnect();
    };
  }, [socket, rtcRef, screenShareRtcRef]);

  // 방 입장 시, 방 참가자 목록 요청 및 PeerConnection 생성
  useEffect(() => {
    const handleRoomMemberList = (res: RoomMemberListResponse) => {
      if (res.code === ResCode.SUCCESS.code && res.roomMemberList) {
        res.roomMemberList.forEach((member) => {
          if (member.userId === authUser?.userId) {
            return;
          }
        });

        setParticipants(res.roomMemberList);
      }
    };

    socket?.emit(
      "room_member_list",
      { roomCode, includingMyself: true },
      handleRoomMemberList
    );
  }, [socket, roomCode, authUser]);

  // 소켓 이벤트
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
      setParticipants(participants);

      if (isJoined) {
        // 화면 공유 중인 경우, 해당 유저에 대한 PeerConnection 생성
        if (myScreenShareStream.current) {
          screenShareRtcRef.current[changedUser.userId] =
            createScreenSharePeerConnectionByUserId(
              changedUser.userId,
              screenShareVideoRefs.current[changedUser.userId]!
            );
        }

        myScreenShareStream.current?.getTracks().forEach((track) => {
          screenShareRtcRef.current[changedUser.userId].addTrack(
            track,
            myScreenShareStream.current!
          );
        });

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

        const screenSharePeerConnection =
          screenShareRtcRef.current[changedUser.userId];
        if (screenSharePeerConnection) {
          screenSharePeerConnection.close();
          delete screenShareRtcRef.current[changedUser.userId];
        }

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
    };

    const handleSignalNotifyIce = ({
      fromUserId,
      candidate,
      sdpMid,
      sdpMLineIndex,
    }: SignalNotifyIceData) => {
      const ice = new RTCIceCandidate({
        candidate,
        sdpMid,
        sdpMLineIndex,
      });

      // Candidate Queueing
      const rtc = rtcRef.current[fromUserId];
      if (!rtc.remoteDescription || !rtc.remoteDescription.type) {
        // 아직 remote description이 없으면 큐에 저장
        if (!candidateQueue.current[fromUserId]) {
          candidateQueue.current[fromUserId] = [];
        }
        candidateQueue.current[fromUserId].push(ice);
        return;
      }

      rtcRef.current[fromUserId].addIceCandidate(ice).catch((error) => {
        console.log("ice candidate 추가 실패:", ice);
        console.error("Error adding ICE candidate:", error);
      });
    };

    const handleSignalNotifyScreenShareIce = ({
      fromUserId,
      candidate,
      sdpMid,
      sdpMLineIndex,
    }: SignalNotifyIceData) => {
      if (!screenShareRtcRef.current[fromUserId]) {
        screenShareRtcRef.current[fromUserId] =
          createScreenSharePeerConnectionByUserId(
            fromUserId,
            screenShareVideoRefs.current[fromUserId]!
          );
      }

      const ice = new RTCIceCandidate({
        candidate,
        sdpMid,
        sdpMLineIndex,
      });

      // Candidate Queueing
      const rtc = screenShareRtcRef.current[fromUserId];
      if (!rtc.remoteDescription || !rtc.remoteDescription.type) {
        // 아직 remote description이 없으면 큐에 저장
        if (!screenShareCandidateQueue.current[fromUserId]) {
          screenShareCandidateQueue.current[fromUserId] = [];
        }
        screenShareCandidateQueue.current[fromUserId].push(ice);
        return;
      }

      screenShareRtcRef.current[fromUserId].addIceCandidate(ice);
    };

    const handleSignalNotifyOffer = async ({
      fromUserId,
      sdp,
    }: SignalNotifyData) => {
      const rtc = rtcRef.current[fromUserId];

      if (!authUser) {
        console.error("AuthUser not found");
        return;
      }

      if (!rtcRef.current[fromUserId]) {
        rtcRef.current[fromUserId] = createPeerConnectionByUserId(
          fromUserId,
          videoRefs.current[fromUserId]!
        );
      }

      const isPolite = authUser.userId > fromUserId;
      const isCollision =
        makingOffer.current[fromUserId] || rtc.signalingState !== "stable";

      const ignoreOffer = !isPolite && isCollision;

      if (ignoreOffer) {
        console.log("Ignoring offer from:", fromUserId);
        return;
      }
      try {
        await rtc.setRemoteDescription({ type: "offer", sdp });

        // Candidate Queueing
        if (candidateQueue.current[fromUserId]) {
          candidateQueue.current[fromUserId].forEach((ice) => {
            rtc.addIceCandidate(ice).catch((error) => {
              console.log("ice candidate 추가 실패:", ice);
              console.error("Error adding ICE candidate:", error);
            });
          });
          candidateQueue.current[fromUserId] = [];
        }

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
      } catch (error) {
        console.error("Error in creating Answer:", error);
      }
    };

    const handleSignalNotifyScreenShareOffer = async ({
      fromUserId,
      sdp,
    }: SignalNotifyData) => {
      if (!authUser) {
        console.error("AuthUser not found");
        return;
      }

      screenShareRtcRef.current[fromUserId] =
        createScreenSharePeerConnectionByUserId(
          fromUserId,
          screenShareVideoRefs.current[fromUserId]!
        );

      const rtc = screenShareRtcRef.current[fromUserId];

      const isPolite = authUser.userId > fromUserId;
      const isCollision =
        makingScreenShareOffer.current[fromUserId] ||
        rtc.signalingState !== "stable";

      const ignoreOffer = !isPolite && isCollision;

      if (ignoreOffer) {
        console.log("Ignoring screen share offer from:", fromUserId);
        return;
      }

      try {
        await rtc.setRemoteDescription({ type: "offer", sdp });

        // Candidate Queueing
        if (screenShareCandidateQueue.current[fromUserId]) {
          screenShareCandidateQueue.current[fromUserId].forEach((ice) => {
            rtc.addIceCandidate(ice).catch((error) => {
              console.log("ice candidate 추가 실패:", ice);
              console.error("Error adding ICE candidate:", error);
            });
          });
          screenShareCandidateQueue.current[fromUserId] = [];
        }

        const answer = await rtc.createAnswer();
        await rtc.setLocalDescription(answer);
        socket.emit(
          "signal_send_answer_screen_share",
          {
            roomCode,
            toUserId: fromUserId,
            sdp: answer.sdp,
          },
          (_: SocketResponse) => {}
        );
      } catch (error) {
        console.error("Error in creating screen share answer:", error);
      }
    };

    const handleSignalNotifyAnswer = ({
      fromUserId,
      sdp,
    }: SignalNotifyData) => {
      const rtc = rtcRef.current[fromUserId];

      if (rtc.signalingState !== "have-local-offer") {
        return;
      }

      rtc
        .setRemoteDescription({
          type: "answer",
          sdp,
        })
        .catch((error) => {
          console.error("Error setting remote description:", error);
        });

      // Candidate Queueing
      if (candidateQueue.current[fromUserId]) {
        candidateQueue.current[fromUserId].forEach((ice) => {
          rtc.addIceCandidate(ice).catch((error) => {
            console.log("ice candidate 추가 실패:", ice);
            console.error("Error adding ICE candidate:", error);
          });
        });
        candidateQueue.current[fromUserId] = [];
      }
    };

    const handleSignalNotifyScreenShareAnswer = ({
      fromUserId,
      sdp,
    }: SignalNotifyData) => {
      const rtc = screenShareRtcRef.current[fromUserId];
      rtc
        .setRemoteDescription({
          type: "answer",
          sdp,
        })
        .catch((error) => {
          console.error(
            "Error setting screen share remote description:",
            error
          );
        });

      // Candidate Queueing
      if (screenShareCandidateQueue.current[fromUserId]) {
        screenShareCandidateQueue.current[fromUserId].forEach((ice) => {
          rtc.addIceCandidate(ice).catch((error) => {
            console.log("ice candidate 추가 실패:", ice);
            console.error("Error adding ICE candidate:", error);
          });
        });
        screenShareCandidateQueue.current[fromUserId] = [];
      }
    };

    const handleNotifyScreenShareOff = ({
      name,
      fromUserId,
    }: CallNotifyScreenShareOffData) => {
      if (screenShareVideoRefs.current[fromUserId]) {
        const stream = screenShareVideoRefs.current[fromUserId]?.srcObject;
        if (stream) {
          (stream as MediaStream).getTracks().forEach((track) => track.stop());
        }
        screenShareVideoRefs.current[fromUserId]!.srcObject = null;
        screenShareRtcRef.current[fromUserId].close();
        delete screenShareRtcRef.current[fromUserId];
      }
      setOnScreenShare((prev) => ({
        ...prev,
        [fromUserId]: false,
      }));
      if (!videoRefs.current[fromUserId]?.srcObject) {
        setIsVideoPlaying((prev) => ({
          ...prev,
          [fromUserId]: false,
        }));
      }
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

    // icecandidate 수신
    socket.on("signal_notify_ice", handleSignalNotifyIce);
    socket.on(
      "signal_notify_ice_screen_share",
      handleSignalNotifyScreenShareIce
    );

    // offer 수신 및 answer 전송
    socket.on("signal_notify_offer", handleSignalNotifyOffer);
    socket.on(
      "signal_notify_offer_screen_share",
      handleSignalNotifyScreenShareOffer
    );

    // answer 수신
    socket.on("signal_notify_answer", handleSignalNotifyAnswer);
    socket.on(
      "signal_notify_answer_screen_share",
      handleSignalNotifyScreenShareAnswer
    );

    // 화면 공유 종료 수신
    socket.on("call_notify_screen_share_off", handleNotifyScreenShareOff);

    // 방장 변경 알림
    socket.on("room_notify_update_owner", handleRoomNotifyUpdateOwner);

    return () => {
      socket.off("chat_notify_message", handleChatNotifyMessage);
      socket.off(
        "room_notify_update_participant",
        handleRoomNotifyUpdateParticipant
      );
      // socket.off("rtc_ready", handleRtcReady);
      socket.off("signal_notify_ice", handleSignalNotifyIce);
      socket.off(
        "signal_notify_ice_screen_share",
        handleSignalNotifyScreenShareIce
      );
      socket.off("signal_notify_offer", handleSignalNotifyOffer);
      socket.off(
        "signal_notify_offer_screen_share",
        handleSignalNotifyScreenShareOffer
      );
      socket.off("call_notify_screen_share_off", handleNotifyScreenShareOff);
      socket.off("signal_notify_answer", handleSignalNotifyAnswer);
      socket.off(
        "signal_notify_answer_screen_share",
        handleSignalNotifyScreenShareAnswer
      );
      socket.off("room_notify_update_owner", handleRoomNotifyUpdateOwner);
    };
  }, [
    socket,
    roomCode,
    authUser,
    rtcRef,
    screenShareRtcRef,
    createPeerConnectionByUserId,
    createScreenSharePeerConnectionByUserId,
  ]);

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

  return (
    <main className={styles.container}>
      <div className={styles.videoSection}>
        <div className={styles.videoContainer}>
          {participants.map((participant) => (
            <VideoBox
              key={participant.userId}
              participant={participant}
              focused={focused}
              setFocused={setFocused}
              isVideoPlaying={isVideoPlaying}
              onScreenShare={onScreenShare}
              setVideoRef={setVideoRef}
              setScreenShareVideoRef={setScreenShareVideoRef}
            />
          ))}
        </div>
        <ActionBar
          authUser={authUser}
          onScreenShare={onScreenShare}
          mute={mute}
          videoOff={videoOff}
          toggleMute={toggleMute}
          toggleVideo={toggleVideo}
          quitRoom={quitRoom}
          startScreenShare={startScreenShare}
          stopScreenShare={stopScreenShare}
          toggleChat={toggleChat}
          handleCopy={handleCopy}
        />
      </div>
      {onChat && (
        <div className={styles.chatSection}>
          <ChatList chatList={chatList} sendMessage={sendMessage} />
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
