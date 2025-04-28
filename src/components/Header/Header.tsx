import { Link, useLocation, useNavigate } from "react-router";
import styles from "./Header.module.css";
import Cookies from "js-cookie";
import { BaseResponse } from "../../types/response";
import { ResCode } from "../../constants/response";
import Button from "../common/Button/Button";
import { useSession } from "../../context/SessionProvider";
import { useState } from "react";
import Portal from "../common/Portal";
import PermissionModal from "./PermissionModal/PermissionModal";

export default function Header() {
  const { authUser } = useSession();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [openSetting, setOpenSetting] = useState<boolean>(false);

  return (
    <header className={styles.header}>
      <div className={styles.logo}>
        <Link to="/">
          <img src="/images/logo.png" alt="logo" />
        </Link>
      </div>

      {!hideBtnBox(pathname) && (
        <div className={`${styles.btnBox}`}>
          {authUser && (
            <div className={styles.userInfo}>
              <Link to="/mypage">
                <img
                  src={`${import.meta.env.VITE_BASE_RESOURCE_URL}/${
                    authUser.profileUrl
                  }`}
                  alt="avatar"
                  className={styles.avatar}
                />
              </Link>
              <span className={styles.userName}>{authUser.name} 님</span>
            </div>
          )}
          {authUser ? (
            <Button
              style={"secondary"}
              size={"md"}
              onClick={async () => {
                try {
                  const res = await fetch(
                    `${import.meta.env.VITE_BASE_API_URL}/auth/logout`,
                    {
                      method: "POST",
                      credentials: "include",
                    }
                  );
                  if (res) {
                    res.json().then((result: BaseResponse) => {
                      if (result.code === ResCode.SUCCESS.code) {
                        Cookies.remove("accessToken");
                        navigate(0);
                      } else {
                        alert(
                          "로그아웃에 실패했습니다. 잠시 후에 다시 시도해주세요."
                        );
                      }
                    });
                  }
                } catch {
                  // 네트워크 요청 실패
                  alert("서버와의 연결이 원활하지 않습니다.");
                }
              }}
            >
              로그아웃
            </Button>
          ) : (
            <Link to="/login">
              <Button style="secondary" size="md">
                시작하기
              </Button>
            </Link>
          )}
          <Button
            style="outline"
            size="md"
            onClick={() => setOpenSetting(true)}
          >
            환경설정
          </Button>
          {openSetting && (
            <Portal>
              <PermissionModal
                onClose={() => {
                  setOpenSetting(false);
                }}
              />
            </Portal>
          )}
        </div>
      )}
    </header>
  );
}

function hideBtnBox(pathname: string) {
  const no_btnBox_paths = ["/login", "/signup"];
  return no_btnBox_paths.includes(pathname);
}
