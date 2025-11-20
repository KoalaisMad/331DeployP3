import React, { useState } from 'react';
import './Manager.css';
import Inventory from './Inventory';
import ItemsSales from './ItemsSales';
import Employees from './Employees';
import InventoryBoard from './InventoryBoard';

export default function Manager({ onReturnToCustomer }) {
  const [activeTab, setActiveTab] = useState('inventory');

 
  const isSpanish = false; // placeholder until API integration
  const t = {
    header: isSpanish ? 'Portal del Gerente' : 'Manager Portal',
    returnBtn: isSpanish ? 'Volver a Cliente' : 'Return to Customer View',
    inventoryTab: isSpanish ? 'Inventario' : 'Inventory',
    salesTab: isSpanish ? 'Artículos/Ventas' : 'Items/Sales',
    employeesTab: isSpanish ? 'Información Empleados' : 'Employee Info',
  };

  return (
    <div className="manager-root">
      <header className="manager-header">
        <div className="header-center">
          <div className="header-label">{t.header}</div>
        </div>
        <div className="header-right">
          <button
            className="action-btn nav-button"
            onClick={() => {
              // Open the Inventory Board in a new window/tab using a hash route
              const url = window.location.origin + window.location.pathname + '#/inventory-board';
              window.open(url, '_blank');
            }}
          >
            inventory board
          </button>
          <button className="action-btn nav-button" onClick={() => console.log('Translate via API (placeholder)')}>
            To spanish translation
          </button>
          <button className="return-button" onClick={onReturnToCustomer}>
            {t.returnBtn}
          </button>
        </div>
      </header>

      <div className="manager-content">
        <div className="tab-navigation">
          <button 
            className={`tab-button ${activeTab === 'inventory' ? 'active' : ''}`}
            onClick={() => setActiveTab('inventory')}
          >
            {t.inventoryTab}
          </button>
          <button 
            className={`tab-button ${activeTab === 'sales' ? 'active' : ''}`}
            onClick={() => setActiveTab('sales')}
          >
            {t.salesTab}
          </button>
          <button 
            className={`tab-button ${activeTab === 'employees' ? 'active' : ''}`}
            onClick={() => setActiveTab('employees')}
          >
            {t.employeesTab}
          </button>
        </div>

        <div className="tab-content">
          {activeTab === 'inventory' && <Inventory />}
          {activeTab === 'inventoryBoard' && <InventoryBoard onBackToInventory={() => setActiveTab('inventory')} />}
          {activeTab === 'sales' && <ItemsSales />}
          {activeTab === 'employees' && <Employees />}
        </div>
      </div>
    </div>
  );
}

