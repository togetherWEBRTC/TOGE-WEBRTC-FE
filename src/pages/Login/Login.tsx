import { Link, useNavigate } from "react-router";
import styles from "./Login.module.css";
import useSession from "../../hooks/useSession";
import Cookies from "js-cookie";
import { useEffect } from "react";
import { ResCode } from "../../constants/response";
import { LoginResponse } from "../../types/response";

export default function Login() {
  const { authUser, isFetching } = useSession();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isFetching && authUser) {
      console.log("로그인 상태");
      navigate("/");
    }
  }, [authUser, isFetching, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    const data = Object.fromEntries(formData);

    const res = await fetch("/auth/login", {
      method: "POST",
      body: JSON.stringify(data),
      headers: {
        "Content-Type": "application/json",
      },
    }).catch(() => {
      // 네트워크 요청 실패
      alert("서버와의 연결이 원활하지 않습니다.");
    });

    if (res) {
      res.json().then((loginResponse: LoginResponse) => {
        if (
          loginResponse.code === ResCode.SUCCESS.code &&
          loginResponse.accessToken
        ) {
          Cookies.set("accessToken", loginResponse.accessToken);
          navigate("/");
        } else {
          alert("아이디 또는 비밀번호가 일치하지 않습니다.");
        }
      });
    }
  };

  return (
    <div className={styles.container}>
      <form className={styles.loginForm} onSubmit={handleSubmit}>
        <h3>로그인</h3>
        <label htmlFor="id">아이디</label>
        <input
          id="id"
          name="id"
          type="text"
          placeholder="아이디를 입력해주세요."
          autoComplete="off"
          required
        />
        <label htmlFor="password">비밀번호</label>
        <input
          id="password"
          name="password"
          placeholder="비밀번호를 입력해주세요."
          type="password"
          autoComplete="off"
          required
        />
        <button>로그인</button>
        <Link to="/signup" className={styles.signup}>
          회원가입
        </Link>
      </form>
    </div>
  );
}
