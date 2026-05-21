import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Home from './components/Home';
import './App.css';

const App = () => {
  return (
    <Router>
      <div className="app-container">
        {/* Persistent Header across all paths */}
        <Header />
        
        {/* Page route matches */}
        <Routes>
          <Route path="/" element={<Home />} />
          {/* 
            USER NOTEs: Add additional routes here as you create new pages!
            Example:
            <Route path="/cart" element={<Cart />} />
            <Route path="/products/:id" element={<ProductDetails />} />
            <Route path="/login" element={<Login />} />
          */}
        </Routes>
      </div>
    </Router>
  );
};

export default App;
