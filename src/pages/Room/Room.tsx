import { useRef, useState } from "react";
import styles from "./Room.module.css";

export default function Test() {
  const [myStream, setMyStream] = useState<MediaStream>();
  const myVideoRef = useRef<HTMLVideoElement>(null);
  const peerVideoRef = useRef<HTMLVideoElement>(null);

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
      </div>
      <div className={styles.chatSection}>
        <ul className={styles.chatList}></ul>
        <div className={styles.inputContainer}>
          <input type="text" placeholder="입력 창" />
          <button>채 팅 입 력</button>
        </div>
      </div>
    </main>
  );
}
