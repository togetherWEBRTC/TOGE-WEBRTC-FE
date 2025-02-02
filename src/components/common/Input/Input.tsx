import styles from "./Input.module.css";

type Size = "sm" | "md" | "lg";

type Props = {
  size: Size;
  disabled?: boolean;
  placeholder?: string;
};

export default function Input({ size, disabled = false, placeholder }: Props) {
  return (
    <input
      className={getClassNames(size)}
      disabled={disabled}
      placeholder={placeholder}
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
