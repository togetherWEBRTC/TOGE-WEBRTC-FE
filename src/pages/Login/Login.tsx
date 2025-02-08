import { Link, useNavigate } from "react-router";
import styles from "./Login.module.css";
import Cookies from "js-cookie";
import { useEffect, useRef, useState } from "react";
import { ResCode } from "../../constants/response";
import { LoginResponse } from "../../types/response";
import Label from "../../components/common/Label/Label";
import Input from "../../components/common/Input/Input";
import Button from "../../components/common/Button/Button";
import { useSession } from "../../context/SessionProvider";

export default function Login() {
  const { authUser, update } = useSession();
  const idRef = useRef<HTMLInputElement>(null);
  const [id, setId] = useState<string>();
  const [password, setPassword] = useState<string>();
  const passwordRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (authUser) {
      navigate("/");
    }
  }, [authUser, navigate]);

  // Login
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
          update(loginResponse.accessToken);
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
        <h5>투게더 로그인하기</h5>
        <div className={styles.inputBox}>
          <Label htmlFor="id">아이디</Label>
          <Input
            scale="lg"
            inputRef={idRef}
            id="id"
            name="id"
            type="text"
            placeholder="아이디를 입력해주세요."
            autoComplete="off"
            required
            onChange={(e) => {
              setId(e.currentTarget.value);
            }}
          />
        </div>
        <div className={styles.inputBox}>
          <Label htmlFor="password">비밀번호</Label>
          <Input
            scale="lg"
            inputRef={passwordRef}
            id="password"
            name="password"
            placeholder="비밀번호를 입력해주세요."
            type="password"
            autoComplete="off"
            required
            onChange={(e) => {
              setPassword(e.currentTarget.value);
            }}
          />
        </div>
        <Button size="lg" style="primary" disabled={!id || !password}>
          로그인
        </Button>
        <div className={styles.signup}>
          <span>새로 시작하시겠어요?</span>
          <Link to="/signup">Together 가입하기</Link>
        </div>
      </form>
    </div>
  );
}
