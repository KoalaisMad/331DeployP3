import React, { useState } from "react";
import Cashier from "./CashierView/Cashier";
import Manager from "./ManagerView/Manager";
import InventoryBoard from "./ManagerView/InventoryBoard";

function App() {
  const [currentView, setCurrentView] = useState('cashier'); // 'cashier' or 'manager'

  return (
    <>
      {/* If URL hash is set to /inventory-board, render the InventoryBoard in a standalone window */}
      {window.location.hash === '#/inventory-board' ? (
        <InventoryBoard />
      ) : (
        <>
          {currentView === 'cashier' && (
            <Cashier onNavigateToManager={() => setCurrentView('manager')} />
          )}
          {currentView === 'manager' && (
            <Manager onReturnToCustomer={() => setCurrentView('cashier')} />
          )}
        </>
      )}
    </>
  );
}

export default App;
