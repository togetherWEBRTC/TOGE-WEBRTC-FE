import { SocketResponse } from "./../types/response";
import { useEffect, useRef } from "react";
import { Socket } from "socket.io-client";

type PeerConnections = {
  [userId: string]: RTCPeerConnection;
};

type OfferState = {
  [userId: string]: boolean;
};

export default function useRoomPeerConnections({
  socket,
  roomCode,
}: {
  socket: Socket;
  roomCode: string | undefined;
}) {
  const peerConnectionsRef = useRef<PeerConnections>({});
  const screenSharePeerConnectionsRef = useRef<PeerConnections>({});

  const makingOffer = useRef<OfferState>({});
  const makingScreenShareOffer = useRef<OfferState>({});

  useEffect(() => {
    if (!socket) return;
  }, [socket]);

  const createPeerConnectionByUserId = (
    userId: string,
    videoEl: HTMLVideoElement
  ) => {
    const newPeerConnection = new RTCPeerConnection({
      iceServers: [
        {
          urls: ["stun:stun.l.google.com:19302"],
        },
        {
          urls: import.meta.env.VITE_TURN_SERVER_URL,
          username: import.meta.env.VITE_TURN_SERVER_USERNAME,
          credential: import.meta.env.VITE_TURN_SERVER_CREDENTIAL,
        },
      ],
    });

    makingOffer.current[userId] = false;

    newPeerConnection.ontrack = (e) => {
      // if (videoEl) {
      //   videoEl.srcObject = e.streams[0];
      // } else {
      //   console.error("Video element is not defined for userId:", userId);
      // }

      // TEST
      if (!videoEl) {
        console.error("Video element is not defined for userId:", userId);
      }
      const remoteStream = new MediaStream();
      e.streams[0].getTracks().forEach((track) => remoteStream.addTrack(track));
      videoEl.srcObject = remoteStream;
    };

    newPeerConnection.onicecandidate = (e) => {
      const candidate = e.candidate;

      if (!candidate || candidate.candidate.includes("typ host")) {
        return;
      }

      socket.emit(
        "signal_send_ice",
        {
          roomCode,
          toUserId: userId,
          candidate: candidate.candidate,
          sdpMid: candidate.sdpMid,
          sdpMLineIndex: candidate.sdpMLineIndex,
        },
        (_: SocketResponse) => {}
      );
    };

    newPeerConnection.onnegotiationneeded = async () => {
      const offer = await newPeerConnection.createOffer();

      try {
        makingOffer.current[userId] = true;
        await newPeerConnection.setLocalDescription(offer);

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
        console.error("Offer error", error);
      } finally {
        makingOffer.current[userId] = false;
      }
    };

    return newPeerConnection;
  };

  const createScreenSharePeerConnectionByUserId = (
    userId: string,
    videoEl: HTMLVideoElement
  ) => {
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

      // if (videoEl) {
      //   videoEl.srcObject = e.streams[0];
      // } else {
      //   console.error(
      //     "Screen Share : Video element is not defined for userId:",
      //     userId
      //   );
      // }

      // TEST
      if (!videoEl) {
        console.error("Video element is not defined for userId:", userId);
      }
      const remoteStream = new MediaStream();
      e.streams[0].getTracks().forEach((track) => remoteStream.addTrack(track));
      videoEl.srcObject = remoteStream;
    };

    newPeerConnection.onicecandidate = (e) => {
      if (e.candidate) {
        socket.emit(
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

        socket.emit(
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

    return newPeerConnection;
  };

  return {
    peerConnectionsRef,
    screenSharePeerConnectionsRef,
    createPeerConnectionByUserId,
    createScreenSharePeerConnectionByUserId,
  };
}
