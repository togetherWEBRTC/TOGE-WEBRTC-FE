import { MouseEvent, useState } from "react";
import SelectIndicator from "../icons/SelectIndicator/SelectIndicator";
import styles from "./Select.module.css";

type Size = "sm" | "md" | "lg";

type Props = {
  size: Size;
  options: string[];
};

export default function Select({ size, options }: Props) {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [value, setValue] = useState("옵션");

  return (
    <div
      className={getClassNames(size)}
      onClick={(e: MouseEvent<HTMLDivElement>) => {
        setIsOpen((prev) => !prev);

        if (!(e.target instanceof HTMLLIElement)) {
          return;
        }
        console.log(e.target.id);
        setValue(e.target.id);
      }}
    >
      <span className={styles.select}>{value}</span>
      <ul className={`${styles.list} ${!isOpen && styles.hidden}`}>
        {options.map((option) => (
          <li key={option} id={option}>
            {option}
          </li>
        ))}
      </ul>
      <SelectIndicator size={size == "lg" ? "lg" : "sm"} isDown={!isOpen} />
    </div>
  );
}

function getClassNames(size: Size) {
  if (!styles[size]) {
    throw new Error("유효하지 않은 Select 크기입니다.");
  }
  return `${styles.container} ${styles[size]}`;
}
