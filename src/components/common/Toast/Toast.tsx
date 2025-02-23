import styles from "./Toast.module.css";
import InfoIcon from "../icons/InfoIcon";
import SuccessIcon from "../icons/SuccessIcon";
import ErrorIcon from "../icons/ErrorIcon";
import { useEffect } from "react";

type Props = {
  type?: "info" | "success" | "error";
  message: string;
  handleClose: () => void;
};

export default function Toast({ type = "info", message, handleClose }: Props) {
  useEffect(() => {
    const timer = setTimeout(() => {
      handleClose();
    }, 2000);
    return () => {
      clearTimeout(timer);
    };
  }, [handleClose]);

  return (
    <div className={styles.container}>
      {getIcon(type)}
      <span>{message}</span>
    </div>
  );
}

function getIcon(type: "info" | "success" | "error") {
  switch (type) {
    case "info":
      return <InfoIcon />;
    case "success":
      return <SuccessIcon />;
    case "error":
      return <ErrorIcon />;
  }
}
