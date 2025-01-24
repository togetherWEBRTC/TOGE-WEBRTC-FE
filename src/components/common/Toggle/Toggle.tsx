import styles from "./Toggle.module.css";

type Props = {
  text?: string;
  disabled?: boolean;
  name?: string;
};

export default function Toggle({ text, name, disabled = false }: Props) {
  return (
    <label className={`${styles.container} ${disabled && styles.disabled}`}>
      <div className={`${styles.toggle} ${disabled && styles.disabled}`}>
        <input type="checkbox" role="switch" name={name} disabled={disabled} />
        <div />
      </div>
      {text && <span>{text}</span>}
    </label>
  );
}
