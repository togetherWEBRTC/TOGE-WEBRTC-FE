import styles from "./PermissionModal.module.css";
import Button from "../../common/Button/Button";
import { useMediaState } from "../../../context/MediaStateProvider";
import Select from "../../common/Select/Select";
import Caption from "../../common/Caption/Caption";
import { MouseEvent, useEffect, useMemo, useState } from "react";

type PermissionState = "granted" | "denied" | "prompt" | "notfound";

type Props = {
  onClose: () => void;
};

export default function PermissionModal({ onClose }: Props) {
  const { mediaState, requestPermission, selectDevice } = useMediaState();
  const [devices, setDevices] = useState<MediaDeviceInfo[]>();

  useEffect(() => {
    async function getDevices() {
      const devices = await navigator.mediaDevices.enumerateDevices();
      setDevices(devices);
    }
    getDevices();
  }, [mediaState]);

  const micPermission = useMemo(
    () => mediaState.microphone.permission,
    [mediaState.microphone.permission]
  );

  const camPermission = useMemo(
    () => mediaState.camera.permission,
    [mediaState.camera.permission]
  );

  return (
    <div
      className={styles.container}
      id="permission-modal-backdrop"
      onClick={(e: MouseEvent) => {
        if ((e.target as Element).id === "permission-modal-backdrop") {
          onClose();
        }
      }}
    >
      <div className={styles.content}>
        <h5>설정</h5>
        <div className={styles.settingList}>
          <div className={styles.settingItem}>
            <Caption>마이크</Caption>
            <div>
              <Select
                size="lg"
                options={
                  devices
                    ?.filter((device) => device.kind === "audioinput")
                    .map((device) => device.label) || []
                }
                ids={
                  devices
                    ?.filter((device) => device.kind === "audioinput")
                    .map((device) => device.deviceId) || []
                }
                defaultValue={
                  micPermission !== "granted"
                    ? getStateMessage(micPermission)
                    : mediaState.microphone.deviceLabel ?? "장치 선택"
                }
                handleSelect={(id: string, option: string) => {
                  selectDevice("microphone", id, option);
                }}
                disabled={micPermission !== "granted" || devices?.length === 0}
              />
              <Button
                size="md"
                style={
                  micPermission === "granted" || micPermission === "denied"
                    ? "outline"
                    : "primary"
                }
                onClick={() => {
                  requestPermission("microphone");
                }}
                disabled={
                  micPermission === "granted" || micPermission === "denied"
                }
              >
                {getPermissionState(micPermission, "마이크")}
              </Button>
            </div>
          </div>
          <div className={styles.settingItem}>
            <Caption>카메라</Caption>
            <div>
              <Select
                size="lg"
                options={
                  devices
                    ?.filter((device) => device.kind === "videoinput")
                    .map((device) => device.label) || []
                }
                ids={
                  devices
                    ?.filter((device) => device.kind === "videoinput")
                    .map((device) => device.deviceId) || []
                }
                defaultValue={
                  camPermission !== "granted"
                    ? getStateMessage(camPermission)
                    : mediaState.camera.deviceLabel ?? "장치 선택"
                }
                handleSelect={(id: string, option: string) => {
                  selectDevice("camera", id, option);
                }}
                disabled={camPermission !== "granted" || devices?.length === 0}
              />
              <Button
                size="md"
                style={
                  camPermission === "granted" || camPermission === "denied"
                    ? "outline"
                    : "primary"
                }
                onClick={() => {
                  requestPermission("camera");
                }}
                disabled={
                  camPermission === "granted" || camPermission === "denied"
                }
              >
                {getPermissionState(camPermission, "카메라")}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function getPermissionState(permission: PermissionState, mediaType?: string) {
  switch (permission) {
    case "granted":
      return "허용됨";
    case "denied":
      return "거부됨";
    case "prompt":
      return `${mediaType} 허용`;
    default:
      return "알 수 없음";
  }
}

function getStateMessage(permission: PermissionState) {
  switch (permission) {
    case "granted":
      return undefined;
    case "denied":
    case "prompt":
      return "권한 없음";
    case "notfound":
      return "장치 없음";
    default:
      return "알 수 없음";
  }
}
