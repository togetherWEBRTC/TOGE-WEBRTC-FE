import styles from "./Input.module.css";

type Size = "sm" | "md" | "lg";

type Props = React.InputHTMLAttributes<HTMLInputElement> & {
  scale: Size;
  inputRef?: React.RefObject<HTMLInputElement>;
};

export default function Input({ scale, inputRef, ...props }: Props) {
  return <input className={getClassNames(scale)} {...props} ref={inputRef} />;
}

function getClassNames(size: Size) {
  if (!styles[size]) {
    throw new Error("유효하지 않은 input 크기입니다.");
  }
  return `${styles.input} ${styles[size]}`;
}
