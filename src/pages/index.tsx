import { Routes, Route } from "react-router";
import Home from "./Home/Home";
import DefaultLayout from "../layouts/Default";
import Login from "./Login/Login";
import Test from "./Test/Test";
import Signup from "./Signup/Signup";

export default function Router() {
  return (
    <Routes>
      <Route element={<DefaultLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/test" element={<Test />} />
        <Route path="/signup" element={<Signup />} />
      </Route>
    </Routes>
  );
}
