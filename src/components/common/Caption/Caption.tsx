import styles from "./Caption.module.css";

type Props = {
  children: React.ReactNode;
  warning?: boolean;
};

export default function Caption({ children, warning = false }: Props) {
  return (
    <div className={`${styles.caption} ${warning && styles.warning}`}>
      {children}
    </div>
  );
}
