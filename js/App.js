import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css'; // Assuming you have an App.css
import Home from './pages/Home';
import Profile from './pages/Profile';
import Wall from './pages/Wall';
import About from './pages/About';
import Contact from './pages/Contact';
import Feedback from './pages/Feedback';
import TermsOfService from './pages/TermsOfService';
import PrivacyPolicy from './pages/PrivacyPolicy';
import AdminDashboard from './pages/AdminDashboard';
import NotFound from './pages/NotFound';
import Login from './components/Login';
import Register from './components/Register';
import ForgotPassword from './components/ForgotPassword';
import ResetPassword from './components/ResetPassword';
import Settings from './components/Settings';
import Navbar from './components/Navbar';
import Footer from './components/Footer';

function App() {
  return (
    <Router>
      <Navbar /> {/* Assuming Navbar is used on all pages */}
      <div className="content-wrap"> {/* Optional: if you have a content wrapper */}
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/wall" element={<Wall />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/feedback" element={<Feedback />} />
          <Route path="/terms" element={<TermsOfService />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<NotFound />} /> {/* Catch-all for unknown routes */}
        </Routes>
      </div>
      <Footer /> {/* Assuming Footer is used on all pages */}
    </Router>
  );
}

export default App;