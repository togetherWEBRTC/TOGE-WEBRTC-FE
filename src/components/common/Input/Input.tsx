import styles from "./Input.module.css";

type Size = "sm" | "md" | "lg";

type Props = {
  size: Size;
  disabled?: boolean;
};

export default function Input({ size, disabled = false }: Props) {
  return (
    <input
      className={getClassNames(size)}
      disabled={disabled}
      placeholder="플레이스홀더"
      required
    />
  );
}

function getClassNames(size: Size) {
  if (!styles[size]) {
    throw new Error("유효하지 않은 input 크기입니다.");
  }
  return `${styles.input} ${styles[size]}`;
}
