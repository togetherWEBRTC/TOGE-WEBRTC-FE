import Button from "../../components/common/Button/Button";
import Caption from "../../components/common/Caption/Caption";
import CheckBox from "../../components/common/CheckBox/CheckBox";
import Input from "../../components/common/Input/Input";
import Label from "../../components/common/Label/Label";
import Radio from "../../components/common/Radio/Radio";
import Select from "../../components/common/Select/Select";
import Toggle from "../../components/common/Toggle/Toggle";
import styles from "./Home.module.css";

export default function Home() {
  return (
    <main className={styles.container}>
      <p>버튼테스트합시당</p>
      <div
        style={{
          marginTop: "20px",
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
      <p style={{ marginTop: "50px" }}>Input 테스트 합시당</p>
      <div
        style={{
          marginTop: "20px",
          width: "300px",
          display: "flex",
          gap: "10px",
          flexDirection: "column",
        }}
      >
        <Input size="sm" />
        <Input size="md" />
        <Input size="lg" />
        <Input size="lg" disabled />
        <Caption>에러 피드백</Caption>
      </div>
      <p style={{ marginTop: "50px" }}>Select 테스트 합시당</p>
      <div
        style={{
          marginTop: "20px",
          width: "300px",
          display: "flex",
          gap: "10px",
          flexDirection: "column",
        }}
      >
        <Select size="sm" options={["하나", "둘"]} />
        <Select size="md" options={["하나", "둘"]} />
        <Select size="lg" options={["하나", "둘"]} />
        <Label>라벨</Label>
      </div>
      <div
        style={{
          marginTop: "20px",
          width: "300px",
          display: "flex",
          gap: "10px",
          flexDirection: "column",
        }}
      >
        <p style={{ marginTop: "50px" }}>라디오 버튼 테스트</p>
        <Radio text={"라디오 버튼 1"} name="test" />
        <Radio text={"라디오 버튼 2"} name="test" />
        <Radio text={"라디오 버튼 3"} name="test" />
        <Radio text={"라디오 버튼 disabled"} name="test" disabled />
      </div>
      <div
        style={{
          marginTop: "20px",
          width: "300px",
          display: "flex",
          gap: "10px",
          flexDirection: "column",
        }}
      >
        <p style={{ marginTop: "50px" }}>체크박스 테스트 합시당</p>
        <CheckBox text={"Default checkbox"} />
      </div>
      <div
        style={{
          marginTop: "20px",
          marginBottom: "100px",
          width: "300px",
          display: "flex",
          gap: "10px",
          flexDirection: "column",
        }}
      >
        <p style={{ marginTop: "50px" }}>토글 스위치 테스트 합시당</p>
        <Toggle text={"Default switch"} />
      </div>
    </main>
  );
}
