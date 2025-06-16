import { AuthUser } from "../../../types/auth";
import Button from "../../common/Button/Button";
import styles from "./ActionBar.module.css";
import {
  BsCameraVideo,
  BsCameraVideoOff,
  BsMic,
  BsMicMute,
  BsLink45Deg,
} from "react-icons/bs";

type Props = {
  mute: boolean;
  quitRoom: () => void;
  videoOff: boolean;
  toggleVideo: () => void;
  toggleMute: () => void;
  toggleChat: () => void;
  onScreenShare: { [key: string]: boolean };
  startScreenShare: () => void;
  stopScreenShare: () => void;
  handleCopy: () => void;
  authUser: AuthUser | undefined;
};

export default function ActionBar(props: Props) {
  const {
    authUser,
    mute,
    videoOff,
    onScreenShare,
    quitRoom,
    toggleVideo,
    toggleMute,
    toggleChat,
    startScreenShare,
    stopScreenShare,
    handleCopy,
  } = props;

  return (
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
          onScreenShare[authUser!.userId] ? stopScreenShare : startScreenShare
        }
      >
        {onScreenShare[authUser!.userId] ? "화면 공유 중지" : "화면 공유"}
      </Button>
      <Button style="secondary" size="sm" onClick={toggleChat}>
        채팅
      </Button>
      <button className={styles.link} onClick={handleCopy}>
        <BsLink45Deg />
      </button>
    </div>
  );
}
