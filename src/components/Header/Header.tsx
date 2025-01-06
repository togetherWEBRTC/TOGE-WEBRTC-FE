import styles from "./Header.module.css";

export default function Header() {
  return (
    <header className={styles.header}>
      <div>
        <button className={styles.logo}>로고</button>
        <h3>TOGE</h3>
      </div>
      <div>
        <button>설정</button>
        <button>유저</button>
      </div>
    </header>
  );
}
