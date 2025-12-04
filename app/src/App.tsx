import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './layouts/Layout';
import Home from './pages/Home';
import Detail from './pages/Detail';
import Paths from './pages/Paths';
import Dev from './pages/Dev';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="examples/:key" element={<Detail />} />
          <Route path="paths" element={<Paths />} />
          <Route path="dev" element={<Dev />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
