import React, { useEffect, useRef } from "react";
import { createPortal } from "react-dom";

type Props = {
  children: React.ReactNode;
};

export default function Portal({ children }: Props) {
  const elRef = useRef(document.createElement("div"));

  useEffect(() => {
    const el = elRef.current;

    document.body.appendChild(el);
    return () => {
      document.body.removeChild(el);
    };
  }, []);

  return createPortal(children, elRef.current);
}
