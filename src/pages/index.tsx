import { Routes, Route } from "react-router";
import Home from "./Home/Home";
import DefaultLayout from "../layouts/Default";
import Login from "./Login/Login";

export default function Router() {
  return (
    <Routes>
      <Route element={<DefaultLayout />}>
        <Route path="/" element={<Home />} />
      </Route>
      <Route path="/login" element={<Login />} />
    </Routes>
  );
}
