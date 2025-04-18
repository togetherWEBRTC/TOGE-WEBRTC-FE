import { useRef, useState } from "react";
import Input from "../../common/Input/Input";
import Modal from "../../common/Modal/Modal";
import styles from "./NicknameModal.module.css";
import Caption from "../../common/Caption/Caption";

type Props = {
  modalRef?: React.RefObject<HTMLDialogElement>;
  onConfirm: () => void;
  onCancel: () => void;
};

type HintState = {
  isWarning: boolean;
  message: string;
};

export default function NicknameModal({
  onCancel,
  onConfirm,
  modalRef,
}: Props) {
  const nicknameRef = useRef<HTMLInputElement>(null);
  const [nickname, setNickname] = useState<string>();
  const [nicknameHintState] = useState<HintState>({
    isWarning: false,
    message: "닉네임은 최대 32자 까지 입력할 수 있어요.",
  });

  return (
    <Modal
      title="닉네임 변경"
      modalRef={modalRef}
      confirmText="닉네임 변경하기"
      cancelText="닫기"
      useConfirm={true}
      useCancel={true}
      confirmHandler={onConfirm}
      cancelHandler={onCancel}
    >
      <div className={styles.container}>
        <div className={styles.inputBox}>
          <Input
            scale="lg"
            inputRef={nicknameRef}
            id="nickname"
            name="nickname"
            type="text"
            placeholder="닉네임을 입력해주세요."
            maxLength={32}
            autoComplete="off"
            required
            onChange={(e) => {
              setNickname(e.currentTarget.value);
            }}
          />
          <Caption warning={nicknameHintState.isWarning}>
            {nicknameHintState.message}
          </Caption>
        </div>
      </div>
    </Modal>
  );
}
