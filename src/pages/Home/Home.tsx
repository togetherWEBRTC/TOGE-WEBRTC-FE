import Button from "../../components/common/Button/Button";
import Input from "../../components/common/Input/Input";

import styles from "./Home.module.css";

export default function Home() {
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
          <Button style="primary" size="lg">
            투게더 시작하기
          </Button>
          <Input size="lg" placeholder="통화 코드 혹은 링크 입력" />
        </div>
      </div>
    </main>
  );
}
