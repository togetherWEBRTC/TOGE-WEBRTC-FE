import styles from "./Button.module.css";

type Style = "primary" | "secondary" | "outline";
type Size = "sm" | "md" | "lg";

type Props = {
  children: React.ReactNode;
  style: Style;
  size: Size;
  disabled?: boolean;
  onClick?: () => void;
};

export default function Button({
  children,
  style,
  size,
  onClick,
  disabled = false,
}: Props) {
  return (
    <button
      className={getClassNames(style, size)}
      onClick={onClick}
      disabled={disabled}
    >
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
