import { Link } from "react-router";
import useSession from "../../hooks/useSession";
import styles from "./Header.module.css";

export default function Header() {
  const { authUser } = useSession();

  return (
    <header className={styles.header}>
      <div>
        <button className={styles.logo}>로고</button>
        <h3>TOGE</h3>
      </div>
      <div>
        <button>설정</button>
        {authUser ? (
          <img src={authUser.profileUrl} alt="profile" />
        ) : (
          <Link to="/login">로그인</Link>
        )}
      </div>
    </header>
  );
}
