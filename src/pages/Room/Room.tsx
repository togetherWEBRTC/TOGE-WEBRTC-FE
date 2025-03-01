import { useEffect, useRef, useState } from "react";
import styles from "./Room.module.css";
import { useSession } from "../../context/SessionProvider";
import { useNavigate, useParams } from "react-router";
import { useSocket } from "../../context/SocketProvider";
import { BaseResponse } from "../../types/response";
import { ResCode } from "../../constants/response";
import Portal from "../../components/common/Portal";
import RoomToast from "../../components/Room/RoomToast/RoomToast";
import Button from "../../components/common/Button/Button";

type Chat = {
  name?: string;
  message: string;
  sendedTime: string;
  senderInfo: {
    userId: string;
    name: string;
  };
};

type Participant = {
  userId: string;
  name: string;
  profileUrl: string;
  isOwner: boolean;
  isMicrophoneOn: boolean;
  isCameraOn: boolean;
  isHandRaised: boolean;
};

type AuthUser = {
  userId: string;
  name: string;
  profileUrl: string;
};

export default function Room() {
  const socket = useSocket();
  const { roomCode } = useParams();
  const { authUser } = useSession();
  const navigate = useNavigate();
  const [myStream, setMyStream] = useState<MediaStream>();
  const myVideoRef = useRef<HTMLVideoElement>(null);
  const peerVideoRef = useRef<HTMLVideoElement>(null);
  const [chatList, setChatList] = useState<Chat[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);

  // 현재 참여
  const [waitingUser, setWaitingUser] = useState<AuthUser>();

  const [toastMessage, setToastMessage] = useState<string>("");

  //채팅창 열기/닫기
  const [onChat, setOnChat] = useState<boolean>(true);

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
    return () => {
      if (socket?.connected) {
        socket?.emit("room_leave");
      }
      socket?.removeAllListeners();
      socket?.disconnect();
    };
  }, []);

  useEffect(() => {
    // 채팅 메세지 수신
    socket?.on("chat_notify_message", (chat: Chat) => {
      setChatList((prev) => [...prev, chat]);
    });

    // 방 참여자 변경 알림
    socket?.on(
      "room_notify_update_participant",
      ({ paticipants, isJoined, changedUser }) => {
        setParticipants(paticipants);
        if (isJoined) {
          setChatList((prev) => [
            ...prev,
            {
              name: "알림",
              message: `${changedUser.name}님이 입장하였습니다.`,
              sendedTime: new Date().toISOString(),
              senderInfo: { userId: "system", name: "system" },
            },
          ]);
        } else {
          setChatList((prev) => [
            ...prev,
            {
              name: "알림",
              message: `${changedUser.name}님이 퇴장하였습니다.`,
              sendedTime: new Date().toISOString(),
              senderInfo: { userId: "system", name: "system" },
            },
          ]);
        }
      }
    );

    // 방장 변경 알림
    socket?.on("room_notify_update_owner", () => {
      alert("호스트로 변경되었습니다.");
    });
  }, [socket, roomCode]);

  // deps 에 waitingUser 없을 시, 클로저 문제로 인해 waitingUser가 undefined로 인식되어 useEffect가 실행되지 않음(클로저 트랩)
  useEffect(() => {
    // 입장대기자 변경 알림
    socket?.on("room_notify_wait", (watingInfo) => {
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

  const startMedia = () => {
    if (!myVideoRef.current) {
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
        setMyStream(stream);
        myVideoRef.current!.srcObject = stream;
      })
      .catch((err) => {
        console.error("Error accessing display media:", err);
      });
  };

  const stopMedia = () => {
    if (!myStream || !myVideoRef.current) {
      return;
    }
    myStream.getVideoTracks()[0].stop();
    setMyStream(undefined);
    myVideoRef.current!.srcObject = null;
  };

  const handleMessageSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const { message } = Object.fromEntries(new FormData(form));
    socket?.emit(
      "chat_send_message",
      { roomCode, message },
      (res: BaseResponse) => {
        if (res.code === ResCode.SUCCESS.code) {
        }
      }
    );
    form.reset();
  };

  const handleAcceptJoin = (userId: string, accept: boolean) => {
    socket?.emit(
      "room_decide_join_from_host",
      { roomCode, userId, isApprove: accept },
      (res: BaseResponse) => {}
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
        <div className={styles.videoBox}>
          <video ref={myVideoRef} autoPlay playsInline />
        </div>
        <div>
          {!myStream && <button onClick={startMedia}>화면 공유</button>}
          {myStream && <button onClick={stopMedia}>화면 공유 종료</button>}
        </div>
        <div className={styles.videoBox}>
          <video ref={peerVideoRef} autoPlay playsInline />
        </div>
        <div className={styles.actionBar}>
          <Button style="primary" size="sm" onClick={quitRoom}>
            통화 종료
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
            {chatList.map((chat, index) => (
              <li
                key={index}
              >{`${chat.senderInfo.userId}: ${chat.message}`}</li>
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
