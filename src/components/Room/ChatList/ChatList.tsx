import { Chat } from "../../../types/room";
import styles from "./ChatList.module.css";

type Props = {
  chatList: Chat[];
  handleMessageSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
};

export default function ChatList({ chatList, handleMessageSubmit }: Props) {
  return (
    <>
      <ul className={styles.chatList}>
        {chatList.map((chat) => (
          <li key={chat.sendedTime}>
            {chat.name === "system_message"
              ? chat.message
              : `${chat.senderInfo.userId}  ${chat.message}`}
          </li>
        ))}
      </ul>
      <form className={styles.inputContainer} onSubmit={handleMessageSubmit}>
        <input
          type="text"
          id="chat"
          name="message"
          placeholder="메시지 보내기"
        />
        <button>채팅</button>
      </form>
    </>
  );
}
