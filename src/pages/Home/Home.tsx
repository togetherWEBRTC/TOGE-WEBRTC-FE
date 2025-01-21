import Button from "../../components/common/Button/Button";
import styles from "./Home.module.css";

export default function Home() {
  return (
    <main className={styles.container}>
      <p>버튼테스트합시당</p>
      <div
        style={{
          marginTop: "50px",
          width: "300px",
          display: "flex",
          gap: "10px",
          flexDirection: "column",
        }}
      >
        <Button style="primary" size="sm" onClick={() => console.log("클릭!")}>
          button
        </Button>
        <Button style="primary" size="md" onClick={() => console.log("클릭!")}>
          button
        </Button>
        <Button style="primary" size="lg" onClick={() => console.log("클릭!")}>
          button
        </Button>
        <Button
          style="primary"
          size="lg"
          onClick={() => console.log("클릭!")}
          disabled
        >
          button
        </Button>
        <Button
          style="secondary"
          size="sm"
          onClick={() => console.log("클릭!")}
        >
          button
        </Button>
        <Button
          style="secondary"
          size="md"
          onClick={() => console.log("클릭!")}
        >
          button
        </Button>
        <Button
          style="secondary"
          size="lg"
          onClick={() => console.log("클릭!")}
        >
          button
        </Button>
        <Button style="outline" size="sm" onClick={() => console.log("클릭!")}>
          button
        </Button>
        <Button style="outline" size="md" onClick={() => console.log("클릭!")}>
          button
        </Button>
        <Button style="outline" size="lg" onClick={() => console.log("클릭!")}>
          button
        </Button>
      </div>
    </main>
  );
}
