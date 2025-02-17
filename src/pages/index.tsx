import { Routes, Route } from "react-router";
import Home from "./Home/Home";
import DefaultLayout from "../layouts/Default";
import Login from "./Login/Login";
import Room from "./Room/Room";
import Signup from "./Signup/Signup";

export default function Router() {
  return (
    <Routes>
      <Route element={<DefaultLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/room/:roomCode" element={<Room />} />
        <Route path="/signup" element={<Signup />} />
      </Route>
    </Routes>
  );
}
