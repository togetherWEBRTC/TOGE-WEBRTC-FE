import { createContext, useContext, useEffect, useState } from "react";

type MediaInfo = {
  permission: PermissionState | "notfound";
  deviceId?: string;
  deviceLabel?: string;
};

type MediaState = {
  microphone: MediaInfo;
  camera: MediaInfo;
  displayCapture: MediaInfo;
};

type MediaStateContext = {
  mediaState: MediaState;
  setMediaState: React.Dispatch<React.SetStateAction<MediaState>>;
};

const initialMediaState: MediaState = {
  microphone: {
    permission: "prompt",
    deviceId: undefined,
  },
  camera: {
    permission: "prompt",
    deviceId: undefined,
  },
  displayCapture: {
    permission: "prompt",
    deviceId: undefined,
  },
};

const initialMediaStateContext: MediaStateContext = {
  mediaState: initialMediaState,
  setMediaState: () => {},
};

const MediaStateContext = createContext<MediaStateContext>(
  initialMediaStateContext
);

export default function MediaStateProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  // mediaState: 현재 미디어 권한 상태, 현재 사용 장치 정보
  const [mediaState, setMediaState] = useState<MediaState>(initialMediaState);
  useEffect(() => {
    async function getPermissions() {
      try {
        const micPermission = await navigator.permissions.query({
          name: "microphone" as PermissionName,
        });
        const camPermission = await navigator.permissions.query({
          name: "camera" as PermissionName,
        });
        const displayCapturePermission = await navigator.permissions.query({
          name: "display-capture" as PermissionName,
        });

        setMediaState({
          microphone: { permission: micPermission.state, deviceId: undefined },
          camera: { permission: camPermission.state, deviceId: undefined },
          displayCapture: {
            permission: displayCapturePermission.state,
            deviceId: undefined,
          },
        });

        micPermission.onchange = () =>
          setMediaState((prev) => ({
            ...prev,
            microphone: { permission: micPermission.state },
          }));

        camPermission.onchange = () =>
          setMediaState((prev) => ({
            ...prev,
            camera: { permission: camPermission.state },
          }));

        displayCapturePermission.onchange = () =>
          setMediaState((prev) => ({
            ...prev,
            displayCapturerophone: {
              permission: displayCapturePermission.state,
            },
          }));
      } catch (error) {
        console.error("권한 확인 중 오류 발생:", error);
      }
    }

    getPermissions();
  }, []);

  return (
    <MediaStateContext.Provider value={{ mediaState, setMediaState }}>
      {children}
    </MediaStateContext.Provider>
  );
}

export const useMediaState = () => {
  const { mediaState, setMediaState } = useContext(MediaStateContext);

  const requestPermission = (
    mediaType: "camera" | "microphone" | "displayCapture"
  ) => {
    switch (mediaType) {
      case "camera":
        navigator.mediaDevices.getUserMedia({ video: true }).catch((error) => {
          if (error.name === "NotFoundError") {
            setMediaState((prev) => ({
              ...prev,
              camera: { permission: "notfound" },
            }));
          } else {
            setMediaState((prev) => ({
              ...prev,
              camera: { permission: "denied" },
            }));
          }
        });
        break;
      case "microphone":
        navigator.mediaDevices.getUserMedia({ audio: true }).catch((error) => {
          if (error.name === "NotFoundError") {
            setMediaState((prev) => ({
              ...prev,
              microphone: { permission: "notfound" },
            }));
          } else {
            setMediaState((prev) => ({
              ...prev,
              microphone: { permission: "denied" },
            }));
          }
        });
        break;
      case "displayCapture":
        navigator.mediaDevices
          .getDisplayMedia({ video: true })
          .catch((error) => {
            if (error.name === "NotFoundError") {
              setMediaState((prev) => ({
                ...prev,
                displayCapture: { permission: "notfound" },
              }));
            } else {
              setMediaState((prev) => ({
                ...prev,
                displayCapture: { permission: "denied" },
              }));
            }
          });
        break;
      default:
        throw new Error("지원하지 않는 미디어 타입입니다.");
    }
  };

  const selectDevice = (
    deviceType: "microphone" | "camera" | "displayCapture",
    deviceId: string,
    deviceLabel: string
  ) => {
    switch (deviceType) {
      case "camera":
        setMediaState((prev) => ({
          ...prev,
          camera: { permission: "granted", deviceId, deviceLabel },
        }));
        break;
      case "microphone":
        setMediaState((prev) => ({
          ...prev,
          microphone: { permission: "granted", deviceId, deviceLabel },
        }));
        break;
      case "displayCapture":
        setMediaState((prev) => ({
          ...prev,
          displayCapture: { permission: "granted", deviceId, deviceLabel },
        }));
        break;
      default:
        throw new Error("지원하지 않는 미디어 타입입니다.");
    }
  };

  return { mediaState, requestPermission, selectDevice };
};
