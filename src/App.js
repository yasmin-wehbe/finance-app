import { HashRouter, Routes, Route} from "react-router-dom";
import Sidebar from './components/Sidebar';
import WealthPage from './pages/1_Wealth';
import EmergencyPage from './pages/2_EmergencyFund';
import ForecastPage from './pages/3_Forecast';
import ScenariosPage from './pages/4_Scenarios';
import NotesPage from './pages/5_Notes';


function App() {
  return (
    <HashRouter>
    <Sidebar />
      <div className="ml-56">
      <Routes>
        <Route path="/" element={<WealthPage />} />
        <Route path="/wealth" element={<WealthPage />} />
        <Route path="/emergency" element={<EmergencyPage />} />
        <Route path="/forecast" element={<ForecastPage />} />
        <Route path="/scenarios" element={<ScenariosPage />} />
        <Route path="/notes" element={<NotesPage />} />
      </Routes>
      </div>
    </HashRouter>
  );
}


export default App;