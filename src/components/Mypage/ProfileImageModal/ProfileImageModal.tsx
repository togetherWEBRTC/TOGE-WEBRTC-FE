import styles from "./ProfileImageModal.module.css";
import Modal from "../../common/Modal/Modal";
import Cookies from "js-cookie";
import { ProfileChangeResponse } from "../../../types/response";
import { ResCode } from "../../../constants/response";
import { useSession } from "../../../context/SessionProvider";

type Props = {
  modalRef?: React.RefObject<HTMLDialogElement>;
  onConfirm?: () => void;
  onCancel?: () => void;
};

export default function ProfileImageModal({ modalRef }: Props) {
  const { updateUserByToken } = useSession();

  const changeProfileImage = async () => {
    const res = await fetch(
      `${import.meta.env.VITE_BASE_API_URL}/auth/modify/profile-image`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${Cookies.get("accessToken")}`,
        },
        credentials: "include",
      }
    ).catch(() => {
      // 네트워크 요청 실패
      alert("서버와의 연결이 원활하지 않습니다.");
    });

    if (res) {
      res.json().then((profileChangeResponse: ProfileChangeResponse) => {
        if (
          profileChangeResponse.code === ResCode.SUCCESS.code &&
          profileChangeResponse.accessToken
        ) {
          Cookies.set("accessToken", profileChangeResponse.accessToken);
          updateUserByToken(profileChangeResponse.accessToken);
        } else {
          alert("프로필 이미지 변경이 실패하였습니다.");
        }
      });
    }
  };

  return (
    <Modal
      title="프로필 이미지 변경"
      modalRef={modalRef}
      useConfirm={true}
      useCancel={true}
      confirmHandler={() => {
        changeProfileImage();
      }}
    >
      <p className={styles.text}>
        프로필 이미지를 변경하시겠어요?<br></br> 무작위로 변경이 진행됩니다.
      </p>
    </Modal>
  );
}
