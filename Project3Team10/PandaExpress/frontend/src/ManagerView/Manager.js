import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Manager.css';
import Inventory from './Inventory';
import ItemsSales from './ItemsSales';
import Employees from './Employees';
import InventoryBoard from './InventoryBoard';

export default function Manager() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('inventory');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const toggleMobileMenu = () => setMobileMenuOpen((prev) => !prev);
  const closeMobileMenu = () => setMobileMenuOpen(false);

 
  const isSpanish = false; // placeholder until API integration
  const t = {
    header: isSpanish ? 'Portal del Gerente' : 'Manager Portal',
    returnBtn: isSpanish ? 'Volver a Cliente' : 'Return to Customer View',
    inventoryTab: isSpanish ? 'Inventario' : 'Inventory',
    salesTab: isSpanish ? 'Artículos/Ventas' : 'Items/Sales',
    employeesTab: isSpanish ? 'Información Empleados' : 'Employee Info',
  };

  const handleLogOut = async () => {
    try {
      const response = await fetch('http://localhost:5000/logout', {credentials: 'include'});
      if(response.ok) {
        console.log("Navigating via logout");
        navigate('/');
      }
    }

    catch(err) {
      console.error('Error occurred during logout: ', err);
    }
    
  };

  return (
    <div className="manager-root">
      {/* Header Section */}
      <header className="manager-header">
        <div className="header-center">
          <div className="header-label">{t.header}</div>
        </div>
        <div className="header-right">
          {/* <button className="manager-portal-button" onClick={() => navigate('/')}> */}
          <button className="manager-portal-button" onClick={handleLogOut}>
            Home
          </button>
          <button className="manager-portal-button" onClick={() => navigate('/cashier')}>
            Cashier
          </button>
          <button
            className="manager-portal-button"
            onClick={() => {
              // Open the Kitchen Board in a new window/tab
              const url = window.location.origin + '/kitchen-board';
              window.open(url, '_blank');
            }}
          >
            Kitchen Board
          </button>
        </div>
        
        {/* Hamburger Icon - Only visible on mobile */}
        <button className="hamburger-icon" onClick={toggleMobileMenu} aria-label="Toggle menu">
          <span className={mobileMenuOpen ? 'hamburger-line open' : 'hamburger-line'}></span>
          <span className={mobileMenuOpen ? 'hamburger-line open' : 'hamburger-line'}></span>
          <span className={mobileMenuOpen ? 'hamburger-line open' : 'hamburger-line'}></span>
        </button>

        {/* Mobile Navigation Dropdown */}
        <div className={`mobile-nav-dropdown ${mobileMenuOpen ? 'open' : ''}`}>
          <button className="manager-portal-button" onClick={() => { navigate('/'); closeMobileMenu(); }}>
            Home
          </button>
          <button className="manager-portal-button" onClick={() => { navigate('/cashier'); closeMobileMenu(); }}>
            Cashier
          </button>
          <button
            className="manager-portal-button"
            onClick={() => {
              const url = window.location.origin + '/kitchen-board';
              window.open(url, '_blank');
              closeMobileMenu();
            }}
          >
            Kitchen Board
          </button>
        </div>
      </header>

      {/* Overlay to close menu when clicking outside */}
      {mobileMenuOpen && <div className="mobile-menu-overlay" onClick={closeMobileMenu}></div>}

      {/* Main Content */}
      <div className="manager-content">
        {/* Tab Navigation */}
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

        {/* Tab Content */}
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

