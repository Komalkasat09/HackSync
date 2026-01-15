import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import PortfolioBuilder from './pages/PortfolioBuilder';
import Gallery from './pages/Gallery';
import Preview from './pages/Preview';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Toaster position="top-right" />
        <Routes>
          <Route path="/" element={<Gallery />} />
          <Route path="/builder" element={<PortfolioBuilder />} />
          <Route path="/builder/:id" element={<PortfolioBuilder />} />
          <Route path="/preview/:id" element={<Preview />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
