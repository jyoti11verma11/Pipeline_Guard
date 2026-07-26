import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import { AuthProvider } from "@/context/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Layout from "@/components/Layout";
import LoginPage from "@/pages/Login";
import IngestPage from "@/pages/Ingest";
import PipelinePage from "@/pages/Pipeline";
import HealthPage from "@/pages/Health";
import DealDetailPage from "@/pages/DealDetail";

function App() {
  return (
    <div className="App">
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route path="/" element={<Navigate to="/pipeline" replace />} />
              <Route path="/ingest" element={<IngestPage />} />
              <Route path="/pipeline" element={<PipelinePage />} />
              <Route path="/health" element={<HealthPage />} />
              <Route path="/deals/:id" element={<DealDetailPage />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
      <Toaster position="top-right" richColors theme="dark" />
    </div>
  );
}

export default App;
