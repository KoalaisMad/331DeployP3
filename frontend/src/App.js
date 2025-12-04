import React, { useState, useEffect } from "react";
import Cashier from "./CashierView/Cashier";
import Manager from "./ManagerView/Manager";
import InventoryBoard from "./ManagerView/InventoryBoard";
import KitchenBoard from "./ManagerView/KitchenBoard";
import Customer from "./CustomerKiosk/Customer";



function App() {
  const [currentView, setCurrentView] = useState('customer'); // 'cashier' or 'manager' or 'customer'

  window.onerror = function (message, source, line, col, error) {
  console.log("Global error:", { message, source, line, col, error });
   };


  return (
    <>
      {/* If URL hash is set to /inventory-board, render the InventoryBoard in a standalone window */}
      {window.location.hash === '#/inventory-board' ? (
        <InventoryBoard />
      ) : window.location.hash === '#/kitchen-board' ? (
        <KitchenBoard />
      ) : (
        <>
          {currentView === 'cashier' && (
            <Cashier
              onNavigateToManager={() => setCurrentView('manager')}
              onNavigateToCustomer={() => setCurrentView('customer')}
            />
          )}
          {currentView === 'manager' && (
            <Manager onReturnToCustomer={() => setCurrentView('customer')} onNavigateToCustomer={() => setCurrentView('customer')} />
          )}
          {currentView === 'customer' && (
            <Customer onNavigateToManager={() => setCurrentView('manager')} onReturnToCashier={() => setCurrentView('cashier')} />
          )}

        </>
      )}
    </>
  );
}

export default App;
