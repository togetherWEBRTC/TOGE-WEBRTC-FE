import styles from "./SelectIndicator.module.css";

type Size = "sm" | "lg";

type Props = {
  size: Size;
  isDown?: boolean;
  disabled?: boolean;
};

export default function SelectIndicator({
  size,
  isDown = true,
  disabled = false,
}: Props) {
  return (
    <div
      className={`${styles.container} ${styles[size]} ${
        !isDown && styles.rotate
      } ${disabled && styles.disabled}`}
    >
      {size == "sm" ? (
        <svg
          width="8"
          height="5"
          viewBox="0 0 8 5"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M4.57646 4.40092C4.26174 4.72799 3.73826 4.72799 3.42354 4.40092L0.973435 1.8547C0.484377 1.34646 0.844568 0.5 1.5499 0.5L6.4501 0.500001C7.15543 0.500001 7.51562 1.34646 7.02657 1.8547L4.57646 4.40092Z"
            fill="white"
          />
        </svg>
      ) : (
        <svg
          width="10"
          height="6"
          viewBox="0 0 10 6"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M5.57646 5.0009C5.26174 5.32797 4.73826 5.32797 4.42354 5.0009L1.10741 1.55467C0.618351 1.04643 0.978543 0.199975 1.68387 0.199975L8.31613 0.199976C9.02146 0.199976 9.38165 1.04643 8.89259 1.55468L5.57646 5.0009Z"
            fill="white"
          />
        </svg>
      )}
    </div>
  );
}
