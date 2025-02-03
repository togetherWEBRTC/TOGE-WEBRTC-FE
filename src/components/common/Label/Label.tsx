import styles from "./Label.module.css";

type Props = React.LabelHTMLAttributes<HTMLLabelElement> & {
  children: React.ReactNode;
};

export default function Label({ children, ...props }: Props) {
  return (
    <label className={styles.label} {...props}>
      {children}
    </label>
  );
}
