import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Toolbar from '@/components/Toolbar/Toolbar';
import Home from '@/pages/Home';
import Plans from '@/pages/Plans';
import DispatchCenter from '@/pages/DispatchCenter';
import ConfirmModal from '@/components/Modals/ConfirmModal';
import ImportPreviewModal from '@/components/Modals/ImportPreviewModal';

export default function App() {
  return (
    <Router>
      <div className="flex flex-col h-screen">
        <Toolbar />
        <div className="flex-1 overflow-hidden">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/plans" element={<Plans />} />
            <Route path="/dispatch" element={<DispatchCenter />} />
          </Routes>
        </div>
        <ConfirmModal />
        <ImportPreviewModal />
      </div>
    </Router>
  );
}
