import styles from "./PermissionModal.module.css";
import Button from "../../common/Button/Button";
import { useMediaState } from "../../../context/MediaStateProvider";
import Select from "../../common/Select/Select";
import Caption from "../../common/Caption/Caption";
import { MouseEvent, useMemo } from "react";

type PermissionState = "granted" | "denied" | "prompt" | "notfound";

type Props = {
  onClose: () => void;
};

export default function PermissionModal({ onClose }: Props) {
  const { mediaState, requestPermission } = useMediaState();
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
                options={["옵션1", "옵션2"]}
                defaultValue={getDefaultValue(micPermission)}
                disabled={micPermission !== "granted"}
              ></Select>
              <Button
                size="md"
                style={micPermission === "granted" ? "outline" : "primary"}
                onClick={() => {
                  requestPermission("microphone");
                }}
                disabled={micPermission === "granted"}
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
                options={["옵션1", "옵션2"]}
                defaultValue={getDefaultValue(camPermission)}
                disabled={camPermission !== "granted"}
              ></Select>
              <Button
                size="md"
                style={camPermission === "granted" ? "outline" : "primary"}
                onClick={() => {
                  requestPermission("camera");
                }}
                disabled={camPermission === "granted"}
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
    case "prompt":
      return `${mediaType} 허용`;
    default:
      return "알 수 없음";
  }
}

function getDefaultValue(permission: PermissionState) {
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
