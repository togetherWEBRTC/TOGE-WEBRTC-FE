import styles from "./Button.module.css";

type Style = "primary" | "secondary" | "outline";
type Size = "sm" | "md" | "lg";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  children: React.ReactNode;
  style: Style;
  size: Size;
};

export default function Button({ children, style, size, ...props }: Props) {
  return (
    <button className={getClassNames(style, size)} {...props}>
      {children}
    </button>
  );
}

function getClassNames(style: Style, size: Size) {
  if (!styles[style]) {
    throw new Error("유효하지 않은 버튼 스타일입니다.");
  }
  if (!styles[size]) {
    throw new Error("유효하지 않은 버튼 크기입니다.");
  }
  return `${styles[style]} ${styles[size]}`;
}
