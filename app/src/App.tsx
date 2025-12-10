import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './layouts/Layout';
import Home from './pages/Home';
import Detail from './pages/Detail';
import Dev from './pages/Dev';
import { ChatProvider } from './context/ChatContext';

function App() {
  return (
    <Router>
      <ChatProvider>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="examples/:key" element={<Detail />} />
            <Route path="dev" element={<Dev />} />
          </Route>
        </Routes>
      </ChatProvider>
    </Router>
  );
}

export default App;
