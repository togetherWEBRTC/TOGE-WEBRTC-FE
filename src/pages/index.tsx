import { Routes, Route } from "react-router";
import Home from "./Home/Home";
import DefaultLayout from "../layouts/Default";
import Login from "./Login/Login";
import Test from "./Test/Test";

export default function Router() {
  return (
    <Routes>
      <Route element={<DefaultLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/test" element={<Test />} />
      </Route>
    </Routes>
  );
}
