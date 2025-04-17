import { useNavigate } from "react-router";
import Button from "../../components/common/Button/Button";
import Input from "../../components/common/Input/Input";
import { BaseResponse, RoomCreateResponse } from "../../types/response";
import styles from "./Home.module.css";
import { ResCode } from "../../constants/response";
import { useSocket } from "../../context/SocketProvider";
import Cookies from "js-cookie";
import { useRef, useState } from "react";
import Modal from "../../components/common/Modal/Modal";
import Portal from "../../components/common/Portal";
import Toast from "../../components/common/Toast/Toast";
import { useSession } from "../../context/SessionProvider";

type ToastState = {
  type: "success" | "error" | "info";
  message: string;
};

export default function Home() {
  const navigate = useNavigate();
  const { authUser } = useSession();
  const socket = useSocket();
  const inputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDialogElement>(null);

  const [toastState, setToastState] = useState<ToastState | null>(null);

  const handleCreate = async () => {
    // 비로그인 시 로그인 페이지로 이동
    if (!authUser) {
      navigate("/login");
      return;
    }

    const res = await fetch(`${import.meta.env.VITE_BASE_API_URL}/room/code`, {
      credentials: "include",
      headers: {
        Authorization: `Bearer ${Cookies.get("accessToken")}`,
      },
    }).catch(() => {
      // 네트워크 요청 실패
      alert("서버와의 연결이 원활하지 않습니다.");
    });
    if (res) {
      res.json().then((roomCreateResponse: RoomCreateResponse) => {
        if (roomCreateResponse.code === ResCode.SUCCESS.code) {
          if (!socket) {
            return;
          }
          // 입장 전 토큰 재갱신 요청 추가해야함.
          socket.auth = { accessToken: Cookies.get("accessToken") };
          socket.connect();
          socket.emit(
            "room_create",
            { roomCode: roomCreateResponse.roomCode },
            (res: BaseResponse) => {
              switch (res.code) {
                case ResCode.SUCCESS.code:
                  navigate(`/room/${roomCreateResponse.roomCode}`);
                  break;
                case ResCode.ALREADY_JOINED_ROOM.code:
                  alert("이미 입장한 방입니다.");
                  break;
                case ResCode.ALREADY_EXISTED_ROOM.code:
                  alert("이미 존재하는 방입니다.");
                  socket.disconnect();
                  break;
                default:
                  alert("방 생성 오류가 발생하였습니다.");
                  socket.disconnect();
                  break;
              }
            }
          );
        } else {
          alert("방을 생성할 수 없습니다.");
          socket?.disconnect();
        }
      });
    }
  };

  const handleJoin = () => {
    if (!socket) {
      return;
    }
    socket.auth = { accessToken: Cookies.get("accessToken") };
    socket.connect();

    modalRef.current?.showModal();

    // 방 입장 승인 알림
    socket.on("room_notify_decide_join_host", (res) => {
      // socket.off("room_notify_decide_join_host");
      if (res.isApprove) {
        navigate(`/room/${inputRef.current?.value}`);
      } else {
        setToastState({ type: "error", message: "방 입장이 거절되었습니다." });
        modalRef.current?.close();
        socket.disconnect();
      }
    });

    // 방 입장 요청
    socket.emit(
      "room_request_join",
      { roomCode: inputRef.current?.value },
      (res: BaseResponse) => {
        if (res.code !== ResCode.SUCCESS.code) {
          modalRef.current?.close();
        }
        switch (res.code) {
          case ResCode.ALREADY_JOINED_ROOM.code:
            setToastState({
              type: "error",
              message: "이미 입장한 방입니다.",
            });
            break;
          case ResCode.INVALID_PARAMS.code:
            setToastState({
              type: "error",
              message: "유효하지 않은 방 코드 입니다.",
            });
            socket.disconnect();
            break;
          case ResCode.ROOM_NOT_FOUND.code:
            setToastState({
              type: "error",
              message: "존재하지 않는 방입니다.",
            });
            socket.disconnect();
            break;
        }
      }
    );
  };

  return (
    <main className={styles.container}>
      <h3>소통은 이제 복잡하지 않아요!</h3>
      <h6>
        친구와의 수다, 팀과의 협업, 모든 대화를 자유롭게.
        <br />
        언제든지 쉽게 연결하고, 더 많은 이야기를 나누세요.
      </h6>
      <div>
        <div className={styles.inputBox}>
          <Button style="primary" size="lg" onClick={handleCreate}>
            투게더 시작하기
          </Button>
          <Input
            scale="lg"
            placeholder="통화 코드 혹은 링크 입력"
            inputRef={inputRef}
          />
          <Button style="primary" size="lg" onClick={handleJoin}>
            방 입장
          </Button>
        </div>
      </div>
      <Modal
        title="방 참여 대기"
        modalRef={modalRef}
        useConfirm={false}
        cancelHandler={() => {
          socket?.emit("room_request_join_cancel");
          modalRef.current?.close();
        }}
      >
        "방 참여를 요청하였습니다. 호스트의 수락을 기다려주세요."
      </Modal>
      {toastState && (
        <Portal>
          <Toast
            type={toastState.type}
            message={toastState.message}
            handleClose={() => {
              setToastState(null);
            }}
          />
        </Portal>
      )}
    </main>
  );
}
