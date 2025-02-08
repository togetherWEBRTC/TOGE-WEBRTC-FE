import { Outlet } from "react-router";
import Header from "../components/Header/Header";
import { SessionProvider } from "../context/SessionProvider";

export default function DefaultLayout() {
  return (
    <SessionProvider>
      <Header />
      <Outlet />
    </SessionProvider>
  );
}
