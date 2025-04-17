import React from "react";
import Button from "../Button/Button";
import styles from "./Modal.module.css";

type Props = React.DialogHTMLAttributes<HTMLDialogElement> & {
  modalRef?: React.RefObject<HTMLDialogElement>;
  title: string;
  confirmText?: string;
  cancelText?: string;
  confirmHandler?: () => void;
  cancelHandler?: () => void;
  useConfirm?: boolean;
  useCancel?: boolean;
  children: React.ReactNode;
};

export default function Modal({
  modalRef,
  title,
  confirmText = "확인",
  cancelText = "취소",
  confirmHandler,
  cancelHandler,
  useConfirm = true,
  useCancel = true,
  children,
}: Props) {
  return (
    <dialog className={styles.modal} ref={modalRef}>
      <h5>{title}</h5>
      <div className={styles.content}>{children}</div>
      <div className={styles.actions}>
        {useCancel && (
          <Button
            size="lg"
            style="secondary"
            onClick={() => {
              cancelHandler?.();
              modalRef?.current?.close();
            }}
          >
            {cancelText}
          </Button>
        )}
        {useConfirm && (
          <Button
            size="lg"
            style="primary"
            onClick={() => {
              confirmHandler?.();
              modalRef?.current?.close();
            }}
          >
            {confirmText}
          </Button>
        )}
      </div>
    </dialog>
  );
}
