import { useEffect, useRef, useState } from "react";
import { Participant } from "../../../types/room";
import Label from "../../common/Label/Label";
import styles from "./VideoBox.module.css";
import { BsFullscreenExit } from "react-icons/bs";

type Props = {
  participant: Participant;
  focused?: string;
  setFocused: (userId?: string) => void;
  isVideoPlaying: Record<string, boolean>;
  onScreenShare: Record<string, boolean>;
  setVideoRef: (userId: string) => (video: HTMLVideoElement | null) => void;
  setScreenShareVideoRef: (
    userId: string
  ) => (video: HTMLVideoElement | null) => void;
};

export default function VideoBox(props: Props) {
  const {
    participant,
    focused,
    setFocused,
    isVideoPlaying,
    onScreenShare,
    setVideoRef,
    setScreenShareVideoRef,
  } = props;

  const [showControls, setShowControls] = useState<boolean>(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const videoBoxRef = useRef<HTMLDivElement>(null);
  const [isPortrait, setIsPortrait] = useState(false);

  const handleMouseMove = () => {
    setShowControls(true);

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      setShowControls(false);
    }, 1000);
  };

  useEffect(() => {
    const container = videoBoxRef.current;
    if (!container) return;

    container.addEventListener("mousemove", handleMouseMove);
    container.addEventListener("mouseenter", handleMouseMove);

    return () => {
      container.removeEventListener("mousemove", handleMouseMove);
      container.removeEventListener("mouseenter", handleMouseMove);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    let timeoutId: number | null = null;

    const checkRatio = () => {
      const box = videoBoxRef.current;
      if (!box) return;
      const parent = box.parentElement;
      if (!parent) return;
      const { clientWidth, clientHeight } = parent;
      setIsPortrait(clientHeight > (clientWidth * 9) / 16);
    };

    const throttledCheckRatio = () => {
      if (timeoutId !== null) return;
      timeoutId = window.setTimeout(() => {
        checkRatio();
        timeoutId = null;
      }, 30);
    };

    throttledCheckRatio();
    window.addEventListener("resize", throttledCheckRatio);
    return () => {
      window.removeEventListener("resize", throttledCheckRatio);
      if (timeoutId !== null) clearTimeout(timeoutId);
    };
  }, []);

  return (
    <div
      ref={videoBoxRef}
      className={`${styles.videoBox} ${getFocusedStyle(
        focused,
        participant.userId,
        isPortrait
      )}`}
      onClick={() => {
        setFocused(participant.userId);
      }}
    >
      {!isVideoPlaying[participant.userId] && (
        <img
          className={styles.avatar}
          src={`${import.meta.env.VITE_BASE_RESOURCE_URL}/${
            participant.profileUrl
          }`}
        />
      )}
      <video
        ref={setVideoRef(participant.userId)}
        autoPlay
        playsInline
        className={onScreenShare[participant.userId] ? styles.hidden : ""}
      />
      <video
        ref={setScreenShareVideoRef(participant.userId)}
        autoPlay
        playsInline
        className={onScreenShare[participant.userId] ? "" : styles.hidden}
      />
      <button
        className={`${styles.toNormalScreenButton} ${getFullscreenExitBtnStyle(
          focused,
          participant.userId,
          showControls
        )}`}
        onClick={(e) => {
          e.stopPropagation();
          setFocused(undefined);
        }}
      >
        <BsFullscreenExit />
      </button>
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
  );
}

function getFocusedStyle(
  focused: string | undefined,
  userId: string,
  isPortrait: boolean
) {
  if (!focused) {
    return;
  }
  if (focused === userId) {
    return isPortrait ? styles.fullWidth : styles.fullHeight;
  } else {
    return styles.hidden;
  }
}

function getFullscreenExitBtnStyle(
  focused: string | undefined,
  userId: string,
  showControls: boolean
) {
  if (!focused || focused !== userId) {
    return styles.hidden;
  }
  return showControls ? styles.showControls : "";
}
