import { Outlet } from "react-router";
import Header from "../components/Header/Header";
import { SessionProvider } from "../context/SessionProvider";
import { SocketProvider } from "../context/SocketProvider";

export default function DefaultLayout() {
  return (
    <SessionProvider>
      <SocketProvider>
        <Header />
        <Outlet />
      </SocketProvider>
    </SessionProvider>
  );
}
