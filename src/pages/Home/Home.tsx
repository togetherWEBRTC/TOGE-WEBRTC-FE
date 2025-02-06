import { useNavigate } from "react-router";
import Button from "../../components/common/Button/Button";
import Input from "../../components/common/Input/Input";
import { RoomCreateResponse } from "../../types/response";
import styles from "./Home.module.css";
import { ResCode } from "../../constants/response";

export default function Home() {
  const navigate = useNavigate();

  const handleCreate = async () => {
    // 비로그인 시 로그인 페이지로 이동
    const res = await fetch("/room/code").catch(() => {
      // 네트워크 요청 실패
      alert("서버와의 연결이 원활하지 않습니다.");
    });
    if (res) {
      res.json().then((roomCreateResponse: RoomCreateResponse) => {
        if (roomCreateResponse.code === ResCode.SUCCESS.code) {
          navigate(`/room/${roomCreateResponse.roomCode}`);
        } else {
          alert("아이디 또는 비밀번호가 일치하지 않습니다.");
        }
      });
    }
  };

  return (
    <main className={styles.container}>
      <h3>소통은 이제 복잡하지 않아요!</h3>
      <h6>
        친구와의 수다, 팀과의 협업, 모든 대화를 자유롭게.
        <br />
        언제든지 쉽게 연결하고, 더 많은 이야기를 나누세요.
      </h6>
      <div>
        <div className={styles.inputBox}>
          <Button style="primary" size="lg" onClick={handleCreate}>
            투게더 시작하기
          </Button>
          <Input scale="lg" placeholder="통화 코드 혹은 링크 입력" />
        </div>
      </div>
    </main>
  );
}
