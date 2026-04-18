import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import MainLayout from "./components/layout/MainLayout";
import DashboardPage from "./pages/DashboardPage";
import AlertsPage from "./pages/AlertsPage";
import AlertDetailsPage from "./pages/AlertDetailsPage";
import IncidentsPage from "./pages/IncidentsPage";
import LogsExplorerPage from "./pages/LogsExplorerPage";
import SearchPage from "./pages/SearchPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="alerts" element={<AlertsPage />} />
          <Route path="alerts/:id" element={<AlertDetailsPage />} />
          <Route path="incidents" element={<IncidentsPage />} />
          <Route path="logs" element={<LogsExplorerPage />} />
          <Route path="search" element={<SearchPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;