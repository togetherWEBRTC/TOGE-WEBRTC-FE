import styles from "./CheckBox.module.css";

type Props = {
  text?: string;
  disabled?: boolean;
  name?: string;
};

export default function CheckBox({ text, name, disabled = false }: Props) {
  return (
    <label className={`${styles.container} ${disabled && styles.disabled}`}>
      <div className={`${styles.checkbox} ${disabled && styles.disabled}`}>
        <input type="checkbox" name={name} disabled={disabled} />
        <svg
          width="12"
          height="8"
          viewBox="0 0 12 8"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M11.7296 0.26035C12.0901 0.607482 12.0901 1.1703 11.7296 1.51743L5.2681 7.73965C4.90761 8.08678 4.32315 8.08678 3.96267 7.73965L0.270363 4.1841C-0.090121 3.83696 -0.090121 3.27415 0.270363 2.92702C0.630847 2.57988 1.21531 2.57988 1.57579 2.92702L4.61538 5.85403L10.4242 0.26035C10.7847 -0.0867832 11.3692 -0.0867832 11.7296 0.26035Z"
            fill="white"
          />
        </svg>
      </div>
      {text && <span>{text}</span>}
    </label>
  );
}
