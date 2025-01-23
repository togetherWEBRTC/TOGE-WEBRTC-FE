import styles from "./Caption.module.css";

type Props = {
  children: React.ReactNode;
};

export default function Caption({ children }: Props) {
  return <div className={styles.caption}>{children}</div>;
}
