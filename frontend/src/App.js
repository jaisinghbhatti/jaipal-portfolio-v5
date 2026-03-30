import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import LeadSniper from "./pages/LeadSniper";

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/leads" replace />} />
          <Route path="/leads" element={<LeadSniper />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
