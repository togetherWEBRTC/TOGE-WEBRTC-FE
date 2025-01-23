import styles from "./Label.module.css";

type Props = {
  children: React.ReactNode;
};

export default function Label({ children }: Props) {
  return <div className={styles.label}>{children}</div>;
}
