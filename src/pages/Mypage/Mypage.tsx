import { useEffect, useRef } from "react";
import { useSession } from "../../context/SessionProvider";
import styles from "./Mypage.module.css";
import NicknameModal from "../../components/Mypage/NicknameModal/NicknameModal";
import ProfileImageModal from "../../components/Mypage/ProfileImageModal/ProfileImageModal";
import { useNavigate } from "react-router";

export default function Mypage() {
  const navigate = useNavigate();
  const { authUser } = useSession();
  const profileImageModalRef = useRef<HTMLDialogElement>(null);
  const nicknameModalRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (!authUser) {
      navigate("/login");
    }
  }, [authUser, navigate]);

  return (
    <div className={styles.container}>
      <div className={styles.userForm}>
        <div className={styles.userImage}>
          <img
            src={`${import.meta.env.VITE_BASE_RESOURCE_URL}/${
              authUser?.profileUrl
            }`}
            alt="profile"
          />
          <button onClick={() => profileImageModalRef.current?.showModal()}>
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fill-rule="evenodd"
                clip-rule="evenodd"
                d="M17.8195 3.70467C18.2589 3.26533 18.9712 3.26533 19.4105 3.70467L21.5256 5.81974C21.9649 6.25908 21.9649 6.97139 21.5256 7.41073L19.4105 9.5258C18.9712 9.96514 18.2589 9.96514 17.8195 9.5258C17.3926 9.09887 17.3805 8.41418 17.7833 7.97268C16.737 8.26113 15.7853 8.84927 15.0544 9.6801L13.9504 10.9351C13.54 11.4016 12.8291 11.4471 12.3626 11.0368C11.8961 10.6264 11.8506 9.91552 12.261 9.44901L13.3651 8.19397C14.6043 6.78524 16.2968 5.87505 18.1286 5.60475L17.8195 5.29567C17.3802 4.85633 17.3802 4.14401 17.8195 3.70467ZM3.29997 19.1704C2.67865 19.1704 2.17497 18.6667 2.17497 18.0454C2.17497 17.4241 2.67865 16.9204 3.29997 16.9204C4.81827 16.9204 6.26316 16.2671 7.266 15.1271L8.80672 13.3757C9.2171 12.9092 9.92796 12.8637 10.3945 13.2741C10.861 13.6844 10.9065 14.3953 10.4961 14.8618L8.95536 16.6132C7.52535 18.2388 5.46501 19.1704 3.29997 19.1704ZM3.29999 5.52051C2.67867 5.52051 2.17499 6.02419 2.17499 6.64551C2.17499 7.26683 2.67867 7.77051 3.29999 7.77051C4.81829 7.77051 6.26318 8.42384 7.26602 9.56382L13.6147 16.7807C14.7092 18.0248 16.1988 18.834 17.8136 19.0862C17.3802 19.526 17.3821 20.2339 17.8195 20.6713C18.2588 21.1107 18.9711 21.1107 19.4105 20.6713L21.5256 18.5562C21.9649 18.1169 21.9649 17.4046 21.5256 16.9653L19.4105 14.8502C18.9711 14.4108 18.2588 14.4108 17.8195 14.8502C17.3802 15.2895 17.3802 16.0018 17.8195 16.4412L18.2553 16.8769C17.1203 16.7228 16.07 16.1652 15.304 15.2945L8.95537 8.07769C7.52537 6.45213 5.46502 5.52051 3.29999 5.52051Z"
                fill="white"
              />
            </svg>
          </button>
        </div>
        <h5>{authUser?.name} 님, 어서오세요!</h5>
        <div className={styles.userInfo}>
          <div className={styles.infoItem}>
            <div>
              <label>아이디</label>
              <span>{authUser?.userId}</span>
            </div>
          </div>
          <div className={styles.infoItem}>
            <div>
              <label>닉네임</label>
              <span>{authUser?.name}</span>
            </div>
            <button
              onClick={() => {
                nicknameModalRef.current?.showModal();
              }}
            >
              변경하기
            </button>
          </div>
          {/* <div className={styles.infoItem}>
            <div>
              <label>비밀번호</label>
              <span className={styles.passwordTip}>
                더 강력한 보안을 위해 비밀번호를 주기적으로 업데이트 하세요.
              </span>
            </div>
            <button>변경하기</button>
          </div> */}
        </div>
      </div>
      <ProfileImageModal modalRef={profileImageModalRef} />
      <NicknameModal
        onCancel={() => {}}
        onConfirm={() => {}}
        modalRef={nicknameModalRef}
      />
    </div>
  );
}
