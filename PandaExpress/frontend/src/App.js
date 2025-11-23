import React, { useState } from "react";
import Cashier from "./CashierView/Cashier";
import Manager from "./ManagerView/Manager";
import InventoryBoard from "./ManagerView/InventoryBoard";
import Customer from "./CustomerKiosk/Customer";

function App() {
  const [currentView, setCurrentView] = useState('customer'); // 'cashier' or 'manager' or 'customer'

  return (
    <>
      {/* If URL hash is set to /inventory-board, render the InventoryBoard in a standalone window */}
      {window.location.hash === '#/inventory-board' ? (
        <InventoryBoard />
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
            <Customer
              onReturnToCashier={() => setCurrentView('cashier')}
              onNavigateToManager={() => setCurrentView('manager')}
            />
          )}
        </>
      )}
    </>
  );
}

export default App;
