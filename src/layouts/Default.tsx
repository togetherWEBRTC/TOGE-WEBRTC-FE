import { Outlet } from "react-router";
import Header from "../components/Header/Header";
import { SessionProvider } from "../context/SessionProvider";
import { SocketProvider } from "../context/SocketProvider";
import MediaStateProvider from "../context/MediaStateProvider";

export default function DefaultLayout() {
  return (
    <MediaStateProvider>
      <SessionProvider>
        <SocketProvider>
          <Header />
          <Outlet />
        </SocketProvider>
      </SessionProvider>
    </MediaStateProvider>
  );
}
