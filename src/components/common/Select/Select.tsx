import { MouseEvent, useEffect, useState } from "react";
import SelectIndicator from "../icons/SelectIndicator/SelectIndicator";
import styles from "./Select.module.css";

type Size = "sm" | "md" | "lg";

type Props = {
  size: Size;
  options: string[]; // 아이템에 표기될 텍스트
  ids?: string[]; // 아이템의 id ( option 태그의 value와 같이 사용하고 싶을 때 대신 사용 )
  defaultValue?: string;
  disabled?: boolean;
  handleSelect?: (option: string, id: string) => void; // 공유하는 상태가 있을 때, 상태를 변경하는데 사용
  open?: boolean; // 외부에서 열림 상태 제어 시 사용 ( Select를 여러개 사용하는 경우 )
  onToggle?: () => void; // 외부에서 열림 상태 제어 시 사용 ( 열림/닫힘 토글 제어 )
};

export default function Select({
  size,
  options,
  defaultValue,
  ids,
  disabled = false,
  handleSelect,
  open,
  onToggle,
}: Props) {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [value, setValue] = useState(defaultValue);

  // defaultValue 변경 시, UI 동기화를 위해 value 변경 ( 공유 상태 변경으로 인해 defaultValue 변경 시 선택된 값이 UI에 제대로 반영되지 않는 문제 )
  useEffect(() => {
    setValue(defaultValue);
  }, [defaultValue]);

  useEffect(() => {
    if (open === undefined) {
      return;
    }
    if (open) {
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  }, [open]);

  return (
    <div
      className={`${getClassNames(size)} ${disabled && styles.disabled}`}
      onClick={(e: MouseEvent<HTMLDivElement>) => {
        if (onToggle) {
          onToggle();
        } else {
          setIsOpen((prev) => !prev);
        }

        if (!(e.target instanceof HTMLLIElement)) {
          return;
        }

        if (handleSelect) {
          handleSelect(e.target.id, e.target.innerText);
        }
        setValue(e.target.innerText);
      }}
    >
      <span className={`${styles.select} ${disabled && styles.disabled}`}>
        {value}
      </span>
      <ul className={`${styles.list} ${!isOpen && styles.hidden}`}>
        {options.map((option, i) => (
          <li key={ids ? ids[i] : option} id={ids ? ids[i] : option}>
            {option}
          </li>
        ))}
      </ul>
      <SelectIndicator
        size={size == "lg" ? "lg" : "sm"}
        isDown={!isOpen}
        disabled={disabled}
      />
    </div>
  );
}

function getClassNames(size: Size) {
  if (!styles[size]) {
    throw new Error("유효하지 않은 Select 크기입니다.");
  }
  return `${styles.container} ${styles[size]}`;
}
