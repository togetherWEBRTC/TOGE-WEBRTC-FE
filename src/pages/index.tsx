import { Routes, Route } from "react-router";
import Home from "./Home/Home";

export default function Router() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
    </Routes>
  );
}
