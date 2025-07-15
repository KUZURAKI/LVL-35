import React from "react";
import { Outlet } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";

interface LayoutProps {
  onOpenModal: () => void;
}

const Layout: React.FC<LayoutProps> = ({ onOpenModal }) => {
  return (
    <>
      <Header onOpenModal={onOpenModal} />
      <Outlet />
      <Footer />
    </>
  );
};

export default Layout;
