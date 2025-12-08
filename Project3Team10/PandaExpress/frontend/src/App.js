import React from "react";
import { Routes, Route } from "react-router-dom";
import Cashier from "./CashierView/Cashier";
import Manager from "./ManagerView/Manager";
import InventoryBoard from "./ManagerView/InventoryBoard";
import KitchenBoard from "./ManagerView/KitchenBoard";
import Customer from "./CustomerKiosk/Customer";
import LandingPage from "./LandingPage.js/LandingPage";
import ProtectedRoute from "./frontendProtection/ProtectedRoute";

function Unauthorized() {
  return (
  <>
  <div>
    <p>Invalid Access</p>
  </div>
  </>);
}

function App() {
  window.onerror = function (message, source, line, col, error) {
    console.log("Global error:", { message, source, line, col, error });
  };

  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/customer" element={<Customer />} />
      {/* Protect cashier view from unauthorized access */}
      <Route path="/cashier" element={<ProtectedRoute allowedRoles={['Manager','Employee','Cashier']}><Cashier /></ProtectedRoute>} />
      {/* Protect manager view from unauthorized access */}
      <Route path="/manager" element={<ProtectedRoute allowedRoles={['Manager']}><Manager /></ProtectedRoute>} />
      <Route path="/inventory-board" element={<InventoryBoard />} />
      <Route path="/kitchen-board" element={<KitchenBoard />} />
      <Route path="/unauthorized" element={<Unauthorized />} />
    </Routes>
  );
}

export default App;
