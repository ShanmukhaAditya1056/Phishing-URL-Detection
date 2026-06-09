import { NavLink, Route, Routes } from 'react-router-dom';
import UrlChecker from './pages/UrlChecker.jsx';
import Benchmark from './pages/Benchmark.jsx';

export default function App() {
  return (
    <>
      <nav className="nav">
        <div className="brand">
          Phish<span>Guard</span> — Algorithm Analysis
        </div>
        <NavLink to="/" end className={({ isActive }) => (isActive ? 'active' : '')}>
          URL Checker
        </NavLink>
        <NavLink to="/benchmark" className={({ isActive }) => (isActive ? 'active' : '')}>
          Benchmark
        </NavLink>
      </nav>

      <div className="container">
        <Routes>
          <Route path="/" element={<UrlChecker />} />
          <Route path="/benchmark" element={<Benchmark />} />
        </Routes>
      </div>
    </>
  );
}
