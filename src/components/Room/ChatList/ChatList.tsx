import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Chat } from "../../../types/room";
import styles from "./ChatList.module.css";

type Props = {
  chatList: Chat[];
  sendMessage: (message: string) => void;
};

export default function ChatList({ chatList, sendMessage }: Props) {
  const scrollRef = useRef<HTMLUListElement>(null);
  const isUserScrolledToBottom = useRef(true);

  const [inputValue, setInputValue] = useState("");

  useEffect(() => {
    const node = scrollRef.current;
    if (!node) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = node;
      isUserScrolledToBottom.current =
        scrollHeight - scrollTop - clientHeight < 1;
    };

    node.addEventListener("scroll", handleScroll);

    return () => {
      node.removeEventListener("scroll", handleScroll);
    };
  }, []);

  useLayoutEffect(() => {
    const node = scrollRef.current;
    if (node && isUserScrolledToBottom.current) {
      node.scrollTop = node.scrollHeight;
    }
  }, [chatList]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!inputValue) {
      return;
    }
    sendMessage(inputValue);
    setInputValue("");
  };

  return (
    <>
      <ul className={styles.chatList} ref={scrollRef}>
        {chatList.map((chat) => (
          <li key={chat.sendedTime}>
            {chat.name === "system_message"
              ? chat.message
              : `${chat.senderInfo.userId}  ${chat.message}`}
          </li>
        ))}
      </ul>
      <form className={styles.inputContainer} onSubmit={handleSubmit}>
        <input
          type="text"
          id="chat"
          name="message"
          autoComplete="off"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="메시지 보내기"
        />
        <button disabled={!inputValue}>채팅</button>
      </form>
    </>
  );
}
