import Button from "../../common/Button/Button";
import styles from "./RoomToast.module.css";

type Props = {
  message: string;
  confirmHandler?: () => void;
  cancelHandler?: () => void;
};

export default function RoomToast({
  message,
  confirmHandler,
  cancelHandler,
}: Props) {
  return (
    <div className={styles.container}>
      <span>{message}</span>
      <div className={styles.actions}>
        <Button size="sm" style="secondary" onClick={cancelHandler}>
          거절
        </Button>
        <Button size="sm" style="primary" onClick={confirmHandler}>
          승인
        </Button>
      </div>
    </div>
  );
}
