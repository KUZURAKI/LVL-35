import { useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home/Home";
import Layout from "./layout/Layout";

const App = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openModal = () => {
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  return (
    <Router>
      <Routes>
        <Route element={<Layout onOpenModal={openModal} />} path="/">
          <Route
            element={
              <Home
                isModalOpen={isModalOpen}
                onCloseModal={closeModal}
                onOpenModal={handleOpenModal}
              />
            }
            index
          />
        </Route>
      </Routes>
    </Router>
  );
};

export default App;
