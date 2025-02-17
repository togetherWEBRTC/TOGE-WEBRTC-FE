import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";

import Input from "../../components/common/Input/Input";
import Label from "../../components/common/Label/Label";
import styles from "./Signup.module.css";
import Button from "../../components/common/Button/Button";
import Caption from "../../components/common/Caption/Caption";
import { BaseResponse } from "../../types/response";
import { ResCode } from "../../constants/response";

type HintState = {
  isWarning: boolean;
  message: string;
};

export default function Signup() {
  const navigate = useNavigate();
  const idRef = useRef<HTMLInputElement>(null);
  const nicknameRef = useRef<HTMLInputElement>(null);

  const passwordRef = useRef<HTMLInputElement>(null);
  const passwordConfirmRef = useRef<HTMLInputElement>(null);

  const [id, setId] = useState<string>();
  const [nickname, setNickname] = useState<string>();
  const [password, setPassword] = useState<string>();
  const [passwordConfirm, setPasswordConfirm] = useState<string>();

  const [idHintState, setIdHintState] = useState<HintState>({
    isWarning: false,
    message: "",
  });
  const [nicknameHintState] = useState<HintState>({
    isWarning: false,
    message: "닉네임은 최대 32자 까지 입력할 수 있어요.",
  });
  const [passwordHintState, setPasswordHintState] = useState<HintState>({
    isWarning: false,
    message: "",
  });
  const [passwordConfirmHintState, setPasswordConfirmHintState] =
    useState<HintState>({
      isWarning: false,
      message:
        "비밀번호는 영문 대소문자, 숫자, 특수문자 중 3가지 이상을 조합한 8~16자로 입력하세요.",
    });

  // 비밀번호 재입력 일치 확인
  useEffect(() => {
    if (!password || !passwordConfirm) {
      return;
    }
    if (password !== passwordConfirm) {
      setPasswordConfirmHintState({
        isWarning: true,
        message: "비밀번호가 일치하지 않아요.",
      });
    } else {
      setPasswordConfirmHintState({
        isWarning: false,
        message: "",
      });
    }
  }, [password, passwordConfirm]);

  // 아이디 중복 확인
  const handleIdCheck = async () => {
    if (!idRef.current || !idRef.current.value.trim()) {
      return;
    }

    const res = await fetch(
      `${import.meta.env.VITE_BASE_API_URL}/auth/usable-id/${
        idRef.current.value
      }`,
      {
        headers: {
          Accept: "application/json",
        },
      }
    ).catch(() => {
      // 네트워크 요청 실패
      alert("서버와의 연결이 원활하지 않습니다.");
    });
    if (res) {
      res.json().then((idCheckResponse: BaseResponse) => {
        if (idCheckResponse.code === ResCode.SUCCESS.code) {
          setIdHintState({
            isWarning: false,
            message: "아이디를 사용할 수 있어요.",
          });
        } else {
          setIdHintState({
            isWarning: true,
            message: "이미 존재하는 아이디에요.",
          });
        }
      });
    }
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    const data = Object.fromEntries(formData);

    const res = await fetch(
      `${import.meta.env.VITE_BASE_API_URL}/auth/signup`,
      {
        method: "POST",
        body: JSON.stringify(data),
        headers: {
          "Content-Type": "application/json",
        },
      }
    ).catch(() => {
      // 네트워크 요청 실패
      alert("서버와의 연결이 원활하지 않습니다.");
    });
    if (res) {
      res.json().then((signUpResponse: BaseResponse) => {
        if (signUpResponse.code === ResCode.SUCCESS.code) {
          alert("회원가입이 완료되었습니다 !");
          navigate("/");
        } else {
          alert("회원가입이 실패하였습니다. 잠시 후에 다시 시도해주세요.");
        }
      });
    }
  };

  return (
    <main className={styles.container}>
      <form onSubmit={handleSubmit}>
        <h4>투게더 가입하기</h4>
        <div>
          <div className={styles.inputBox}>
            <Label htmlFor="id">아이디</Label>
            <div className={styles.idBox}>
              <Input
                scale="lg"
                inputRef={idRef}
                id="userId"
                name="userId"
                type="text"
                placeholder="아이디를 입력해주세요."
                autoComplete="off"
                required
                onChange={(e) => {
                  setId(e.currentTarget.value);
                }}
              />
              <Button
                size="lg"
                style="secondary"
                disabled={!id}
                onClick={handleIdCheck}
                type="button"
              >
                중복확인
              </Button>
            </div>
            <Caption warning={idHintState.isWarning}>
              {idHintState.message}
            </Caption>
          </div>
          <div className={styles.inputBox}>
            <Label htmlFor="id">닉네임</Label>
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
          <div className={styles.inputBox}>
            <Label htmlFor="password">비밀번호</Label>
            <Input
              scale="lg"
              inputRef={passwordRef}
              id="password"
              name="password"
              type="password"
              placeholder="비밀번호를 입력해주세요."
              autoComplete="off"
              required
              onChange={(e) => {
                const regex =
                  /^(?=(.*[a-z]){1})(?=(.*[A-Z]){1})(?=(.*\d){1})(?=(.*[!@#$%^&*(),.?":{}|<>]){1}).{8,16}$/;
                if (!regex.test(e.currentTarget.value)) {
                  setPasswordHintState({
                    isWarning: true,
                    message:
                      "비밀번호는 영문 대소문자, 숫자, 특수문자 중 3가지 이상을 조합한 8~16자로 입력하세요.",
                  });
                  setPasswordConfirmHintState((prev) => {
                    return { ...prev, message: "" };
                  });
                } else {
                  setPasswordHintState({
                    isWarning: false,
                    message: "",
                  });
                }
                setPassword(e.currentTarget.value);
              }}
            />
            <Caption warning={passwordHintState.isWarning}>
              {passwordHintState.message}
            </Caption>
            <Input
              scale="lg"
              inputRef={passwordConfirmRef}
              id="passwordConfirm"
              name="passwordConfirm"
              type="password"
              placeholder="비밀번호를 한번 더 입력해주세요."
              autoComplete="off"
              required
              onChange={(e) => {
                setPasswordConfirm(e.currentTarget.value);
              }}
            />
            <Caption warning={passwordConfirmHintState.isWarning}>
              {passwordConfirmHintState.message}
            </Caption>
          </div>
        </div>

        <Button
          size="lg"
          style="primary"
          disabled={
            !id ||
            !nickname ||
            !password ||
            !passwordConfirm ||
            idHintState.isWarning ||
            passwordHintState.isWarning ||
            passwordConfirmHintState.isWarning
          }
          type="submit"
        >
          가입하기
        </Button>
      </form>
    </main>
  );
}
