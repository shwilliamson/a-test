import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ListsProvider } from "@/contexts/ListsContext";
import { ToastProvider } from "@/components/ui/toast";
import { ProtectedRoute, PublicRoute } from "@/components/routing";
import RegisterPage from "@/pages/RegisterPage";
import LoginPage from "@/pages/LoginPage";
import ListsPage from "@/pages/ListsPage";
import ListDetailPage from "@/pages/ListDetailPage";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <ListsProvider>
            <Routes>
              <Route path="/" element={<Navigate to="/lists" replace />} />
              <Route
                path="/register"
                element={
                  <PublicRoute>
                    <RegisterPage />
                  </PublicRoute>
                }
              />
              <Route
                path="/login"
                element={
                  <PublicRoute>
                    <LoginPage />
                  </PublicRoute>
                }
              />
              <Route
                path="/lists"
                element={
                  <ProtectedRoute>
                    <ListsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/lists/:listId"
                element={
                  <ProtectedRoute>
                    <ListDetailPage />
                  </ProtectedRoute>
                }
              />
            </Routes>
          </ListsProvider>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
