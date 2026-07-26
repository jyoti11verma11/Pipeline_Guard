import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import Layout from "@/components/Layout";
import IngestPage from "@/pages/Ingest";
import PipelinePage from "@/pages/Pipeline";
import HealthPage from "@/pages/Health";
import DealDetailPage from "@/pages/DealDetail";

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Navigate to="/pipeline" replace />} />
            <Route path="/ingest" element={<IngestPage />} />
            <Route path="/pipeline" element={<PipelinePage />} />
            <Route path="/health" element={<HealthPage />} />
            <Route path="/deals/:id" element={<DealDetailPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
      <Toaster position="top-right" richColors theme="dark" />
    </div>
  );
}

export default App;
