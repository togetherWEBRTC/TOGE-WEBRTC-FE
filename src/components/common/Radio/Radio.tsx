import styles from "./Radio.module.css";

type Props = {
  text: string;
  disabled?: boolean;
  name: string;
};

export default function Radio({ text, name, disabled = false }: Props) {
  return (
    <label className={`${styles.container} ${disabled && styles.disabled}`}>
      <div className={`${styles.radio} ${disabled && styles.disabled}`}>
        <input type="radio" value="radio" name={name} disabled={disabled} />
      </div>
      <span>{text}</span>
    </label>
  );
}
