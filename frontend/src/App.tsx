import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import RegisterPage from "@/pages/RegisterPage";
import ListsPage from "@/pages/ListsPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/register" replace />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/lists" element={<ListsPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
