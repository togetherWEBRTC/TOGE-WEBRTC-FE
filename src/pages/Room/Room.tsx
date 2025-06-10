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
import { AuthUser } from "../../types/auth";
import {
  CallNotifyScreenShareOffData,
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
import VideoBox from "../../components/Room/VideoBox/VideoBox";

type PeerConnections = {
  [userId: string]: RTCPeerConnection;
};

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

  const [mute, setMute] = useState<boolean>(false);
  const [videoOff, setVideoOff] = useState<boolean>(false);

  const [focused, setFocused] = useState<string>();

  const [onScreenShare, setOnScreenShare] = useState<ScreenShareState>({});

  const videoRefs = useRef<{ [userId: string]: HTMLVideoElement | null }>({});
  const screenShareVideoRefs = useRef<{
    [userId: string]: HTMLVideoElement | null;
  }>({});

  const [isVideoPlaying, setIsVideoPlaying] = useState<Record<string, boolean>>(
    {}
  );

  const [chatList, setChatList] = useState<Chat[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);

  const rtcRef = useRef<PeerConnections>({});
  const screenShareRtcRef = useRef<PeerConnections>({});

  // perfect negotiation
  const makingOffer = useRef<OfferState>({});
  const ignoreOffer = useRef<OfferState>({});

  const makingScreenShareOffer = useRef<OfferState>({});

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

  const setScreenShareVideoRef = useCallback(
    (userId: string) => (node: HTMLVideoElement | null) => {
      const handlePlay = () =>
        setIsVideoPlaying((prev) => ({ ...prev, [userId]: true }));

      if (node) {
        screenShareVideoRefs.current[userId] = node;

        screenShareVideoRefs.current[userId].addEventListener(
          "play",
          handlePlay
        );
      } else {
        screenShareVideoRefs.current[userId]?.removeEventListener(
          "play",
          handlePlay
        );
        delete screenShareVideoRefs.current[userId];
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

  const handleCopy = () => {
    if (!params.roomCode) return;

    navigator.clipboard.writeText(params.roomCode).then(() => {
      alert("링크가 복사되었습니다.");
    });
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
    // 미디어 장치 사용 설정 후 입장시 / 미디어 장치 변경 시
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
  }, [mediaState, authUser, participants]);

  // Cleanup
  useEffect(() => {
    const connections = rtcRef.current;
    const screenShareConnections = screenShareRtcRef.current;
    const stream = myStream.current;
    const screenShareStream = myScreenShareStream.current;

    return () => {
      if (socket?.connected) {
        socket?.emit("room_leave");
      }
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

      setTimeout(() => {
        socket?.removeAllListeners();
        socket?.disconnect();
      }, 10);
    };
  }, [socket]);

  const createPeerConnectionByUserId = (userId: string) => {
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
        {
          urls: import.meta.env.VITE_TURN_SERVER_URL,
          username: import.meta.env.VITE_TURN_SERVER_USERNAME,
          credential: import.meta.env.VITE_TURN_SERVER_CREDENTIAL,
        },
      ],
    });

    makingOffer.current[userId] = false;
    ignoreOffer.current[userId] = false;

    newPeerConnection.ontrack = (e) => {
      // 트랙 제거 시 ( 카메라를 사용하지 않는 상태에서 화면 공유 종료 시, 비디오 트랙 제거 )
      e.streams[0].onremovetrack = () => {
        // 남아 있는 트랙이 없는 경우( 마이크 사용 X ) srcObject 초기화
        const remainingTracks = e.streams[0].getTracks();
        if (remainingTracks.length === 0) {
          setIsVideoPlaying((prev) => ({
            ...prev,
            [userId]: false,
          }));
          videoRefs.current[userId]!.srcObject = null;
        } else {
          console.log(`Remaining tracks for ${userId}:`, remainingTracks);
        }
      };
      videoRefs.current[userId]!.srcObject = e.streams[0];
    };

    newPeerConnection.onicecandidate = (e) => {
      if (e.candidate) {
        socket?.emit(
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

    newPeerConnection.onnegotiationneeded = async () => {
      const offer = await newPeerConnection.createOffer();

      try {
        makingOffer.current[userId] = true;
        await newPeerConnection.setLocalDescription(offer);

        socket?.emit(
          "signal_send_offer",
          {
            roomCode,
            toUserId: userId,
            sdp: offer.sdp,
          },
          (res: SocketResponse) => {}
        );
      } catch (error) {
        console.error("Offer error", error);
      } finally {
        makingOffer.current[userId] = false;
      }
    };

    return newPeerConnection;
  };

  const createScreenSharePeerConnectionByUserId = (userId: string) => {
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
        {
          urls: import.meta.env.VITE_TURN_SERVER_URL,
          username: import.meta.env.VITE_TURN_SERVER_USERNAME,
          credential: import.meta.env.VITE_TURN_SERVER_CREDENTIAL,
        },
      ],
    });

    makingScreenShareOffer.current[userId] = false;

    newPeerConnection.ontrack = (e) => {
      setOnScreenShare((prev) => ({
        ...prev,
        [userId]: true,
      }));

      e.streams[0].onremovetrack = () => {
        if (!videoRefs.current[userId]) {
          setIsVideoPlaying((prev) => ({
            ...prev,
            [userId]: false,
          }));
        }
        setOnScreenShare((prev) => ({
          ...prev,
          [userId]: false,
        }));
        screenShareVideoRefs.current[userId]!.srcObject = null;
      };

      // 화면 공유 종료 시, 수신 측에서 즉각 종료되지 않고 화면이 몇 초 간 정지해있는 상태를 해결하고자 onended, onremovetrack, onmute 등 다양한 방법을 시도해보았으나 해결되지 않음
      // 따라서, 화면 공유 종료를 알리는 소켓 이벤트를 생성하고 수신 측에서 이를 감지하여 화면 공유 종료를 처리하도록 하여 UI를 즉시 업데이트하도록 함
      // e.track.onmute = () => {
      //   console.log("onended event triggered for screen share");
      //   if (!videoRefs.current[userId]) {
      //     setIsVideoPlaying((prev) => ({
      //       ...prev,
      //       [userId]: false,
      //     }));
      //   }
      //   setOnScreenShare((prev) => ({
      //     ...prev,
      //     [userId]: false,
      //   }));
      //   screenShareVideoRefs.current[userId]!.srcObject = null;
      // };

      screenShareVideoRefs.current[userId]!.srcObject = e.streams[0];
    };

    newPeerConnection.onicecandidate = (e) => {
      if (e.candidate) {
        socket?.emit(
          "signal_send_ice_screen_share",
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

    newPeerConnection.onnegotiationneeded = async () => {
      const offer = await newPeerConnection.createOffer();

      try {
        makingScreenShareOffer.current[userId] = true;
        await newPeerConnection.setLocalDescription(offer);

        socket?.emit(
          "signal_send_offer_screen_share",
          {
            roomCode,
            toUserId: userId,
            sdp: offer.sdp,
          },
          (res: SocketResponse) => {}
        );
      } catch (error) {
        console.error("Screen share offer error", error);
      } finally {
        makingScreenShareOffer.current[userId] = false;
      }
    };

    // newPeerConnection.onconnectionstatechange = () => {
    //   if (
    //     newPeerConnection.connectionState === "disconnected" ||
    //     newPeerConnection.connectionState === "closed"
    //   ) {
    //     const stream = screenShareVideoRefs.current[userId]?.srcObject;
    //     if (stream) {
    //       (stream as MediaStream).getTracks().forEach((track) => track.stop());
    //     }
    //     setOnScreenShare((prev) => ({
    //       ...prev,
    //       [userId]: false,
    //     }));
    //     screenShareVideoRefs.current[userId]!.srcObject = null;
    //     newPeerConnection.close();
    //     delete screenShareRtcRef.current[userId];
    //   }
    // };

    return newPeerConnection;
  };

  // 방 입장 시, 방 참가자 목록 요청 및 PeerConnection 생성
  useEffect(() => {
    const handleRoomMemberList = (res: RoomMemberListResponse) => {
      if (res.code === ResCode.SUCCESS.code && res.roomMemberList) {
        res.roomMemberList.forEach((member) => {
          if (member.userId === authUser?.userId) {
            return;
          }

          // 참가자 목록 유저에 대한 PeerConnection 생성
          rtcRef.current[member.userId] = createPeerConnectionByUserId(
            member.userId
          );
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
        rtcRef.current[changedUser.userId] = createPeerConnectionByUserId(
          changedUser.userId
        );

        myStream.current?.getTracks().forEach((track) => {
          rtcRef.current[changedUser.userId].addTrack(track, myStream.current!);
        });

        // 화면 공유 중인 경우, 해당 유저에 대한 PeerConnection 생성
        if (myScreenShareStream.current) {
          screenShareRtcRef.current[changedUser.userId] =
            createScreenSharePeerConnectionByUserId(changedUser.userId);
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
      console.log("isJoined", isJoined);
      setParticipants(participants);
    };

    const handleRtcReady = async ({ userId }: RtcReadyData) => {
      if (!rtcRef.current[userId]) {
        console.log(
          "rtc_ready 인데, rtcRef.current[userId] 없어서 만들도록 하겠음 ",
          userId
        );

        rtcRef.current[userId] = createPeerConnectionByUserId(userId);

        myStream.current?.getTracks().forEach((track) => {
          rtcRef.current[userId].addTrack(track, myStream.current!);
        });
      }
      const rtc = rtcRef.current[userId];

      try {
        makingOffer.current[userId] = true;
        // offer 생성 및 전송
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
      } catch (error) {
        console.error("Error creating offer:", error);
      } finally {
        makingOffer.current[userId] = false;
      }
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

    const handleSignalNotifyScreenShareIce = ({
      fromUserId,
      candidate,
      sdpMid,
      sdpMLineIndex,
    }: SignalNotifyIceData) => {
      if (!screenShareRtcRef.current[fromUserId]) {
        screenShareRtcRef.current[fromUserId] =
          createScreenSharePeerConnectionByUserId(fromUserId);
      }

      screenShareRtcRef.current[fromUserId].addIceCandidate(
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

      if (!authUser) {
        console.error("AuthUser not found");
        return;
      }

      if (!rtc) {
        console.error("PeerConnection not found for userId:", fromUserId);
        return;
      }

      const isPolite = authUser.userId > fromUserId;
      const isCollision =
        makingOffer.current[fromUserId] || rtc.signalingState !== "stable";

      ignoreOffer.current[fromUserId] = !isPolite && isCollision;

      if (ignoreOffer.current[fromUserId]) {
        console.log("Ignoring offer from:", fromUserId);
        return;
      }

      try {
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
        createScreenSharePeerConnectionByUserId(fromUserId);

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
      if (
        rtcRef.current[fromUserId].remoteDescription ||
        rtcRef.current[fromUserId].signalingState !== "have-local-offer"
      ) {
        return; // 이미 remoteDescription이 설정되어 있는 경우 중복 설정 방지
      }

      rtcRef.current[fromUserId]
        .setRemoteDescription({
          type: "answer",
          sdp,
        })
        .catch((error) => {
          console.error("Error setting remote description:", error);
        });
    };

    const handleSignalNotifyScreenShareAnswer = ({
      fromUserId,
      sdp,
    }: SignalNotifyData) => {
      screenShareRtcRef.current[fromUserId]
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

    // icecandidate 제공 및 offer
    socket.on("rtc_ready", handleRtcReady);

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
      socket.off("rtc_ready", handleRtcReady);
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
    // if (!screenShareVideoRefs.current[authUser!.userId]) {
    //   return;
    // }

    participants.forEach((participant) => {
      if (participant.userId === authUser?.userId) {
        return;
      }
      // if (!screenShareRtcRef.current[participant.userId]) {
      screenShareRtcRef.current[participant.userId] =
        createScreenSharePeerConnectionByUserId(participant.userId);
      // }
    });

    navigator.mediaDevices
      .getDisplayMedia({
        video: {
          frameRate: { ideal: 60 },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
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
                      maxBitrate: 5_000_000,
                    }; // 고화질
                  } else if (index === 1) {
                    return {
                      ...encoding,
                      scaleResolutionDownBy: 2.0,
                      maxBitrate: 2_000_000,
                    }; // 중화질
                  } else {
                    return {
                      ...encoding,
                      scaleResolutionDownBy: 4.0,
                      maxBitrate: 800_000,
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

    console.log("participants", participants);

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
    if (myScreenShareStream.current) {
      myScreenShareStream.current.getTracks().forEach((track) => track.stop());
    }
    navigate("/");
  };

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
            onClick={
              onScreenShare[authUser!.userId]
                ? stopScreenShare
                : startScreenShare
            }
          >
            {onScreenShare[authUser!.userId] ? "화면 공유 중지" : "화면 공유"}
          </Button>
          <Button
            style="secondary"
            size="sm"
            onClick={() => setOnChat(!onChat)}
          >
            채팅
          </Button>
          <button className={styles.link} onClick={handleCopy}>
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
                  : `${chat.senderInfo.userId}  ${chat.message}`}
              </li>
            ))}
          </ul>
          <form
            className={styles.inputContainer}
            onSubmit={handleMessageSubmit}
          >
            <input
              type="text"
              id="chat"
              name="message"
              placeholder="메시지 보내기"
            />
            <button>채팅</button>
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
