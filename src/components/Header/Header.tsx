import { Link, useLocation, useNavigate } from "react-router";
import useSession from "../../hooks/useSession";
import styles from "./Header.module.css";
import Cookies from "js-cookie";
import { BaseResponse } from "../../types/response";
import { ResCode } from "../../constants/response";
import Button from "../common/Button/Button";

export default function Header() {
  const { authUser } = useSession();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  return (
    <header className={styles.header}>
      <div className={styles.logo}>
        <Link to="/">
          <img src="/images/logo.png" alt="logo" />
        </Link>
      </div>

      {!hideBtnBox(pathname) && (
        <div className={`${styles.btnBox}`}>
          {authUser ? (
            // <img src={authUser.profileUrl} alt="profile" />
            <button
              onClick={async () => {
                try {
                  const res = await fetch("/auth/logout", {
                    method: "POST",
                  });
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
            </button>
          ) : (
            <Link to="/login">
              <Button style="secondary" size="md">
                시작하기
              </Button>
            </Link>
          )}
          <Button style="outline" size="md">
            환경설정
          </Button>
        </div>
      )}
    </header>
  );
}

function hideBtnBox(pathname: string) {
  const no_btnBox_paths = ["/login", "/signup"];
  return no_btnBox_paths.includes(pathname);
}
