
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LoginPage from './pages/LoginPage';
import HomePage from './pages/HomePage';
import NoPage from './pages/NoPage';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function App() {
  return (
    <div>
      <Router>
        <Routes>
          <Route exact path="/" element={<LoginPage />} />
          <Route exact path="/home" element={<HomePage />} />
          <Route path="*" element={<NoPage />} />
        </Routes>
      </Router>
      <ToastContainer 
                position='bottom-left'/>
    </div>
  );
}

export default App;
