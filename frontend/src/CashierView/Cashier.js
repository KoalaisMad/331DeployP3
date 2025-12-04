import React, { useState, useEffect } from 'react';
import './Cashier.css';

// Use relative path - works both locally and on deployed server
const API_BASE = '/api';

// Compatibility wrapper: many frontend calls use top-level paths
// (e.g. `/sizes/prices`) but inventory endpoints were moved under
// `/api/inventory/...`. This helper rewrites known inventory paths
// to `/inventory/*` so existing frontend code keeps working.
async function apiFetch(path, options = {}) {
  // Ensure leading slash
  const normalized = path.startsWith('/') ? path : `/${path}`;

  // Inventory-related endpoints that should be prefixed with /inventory
  const inventoryPrefixes = [
    '/sizes',
    '/sides',
    '/entrees',
    '/appetizers',
    '/appetizers-drinks',
    '/routeretizers',
    '/routeretizers-drinks',
    '/premium-entrees',
    '/inventory',
  ];

  const shouldPrefixInventory = inventoryPrefixes.some(p => normalized === p || normalized.startsWith(`${p}/`));
  const effectivePath = shouldPrefixInventory ? `/inventory${normalized}` : normalized;

  return fetch(`${API_BASE}${effectivePath}`, options);
}

export default function Cashier({ onNavigateToManager, onNavigateToCustomer }) {
  const [bottomMenuEnabled, setBottomMenuEnabled] = useState(false);

  const [dynamicButtons, setDynamicButtons] = useState([]);
  
  // Structured order state
  const [combos, setCombos] = useState([]); 
  const [appetizers, setAppetizers] = useState([]); 
  const [drinks, setDrinks] = useState([]); 
  const [currentCategory, setCurrentCategory] = useState(null); // 'sides'|'entrees'|'appetizers'|'drinks'

  const TAX_RATE = 0.0825; 

  // 1. DYNAMIC STATE FOR PRICE CACHES - Initialized to empty/defaults
  const [sizePriceCache, setSizePriceCache] = useState({});
  const [appetizerPriceCache, setAppetizerPriceCache] = useState({});
  const [drinkPriceCache, setDrinkPriceCache] = useState({});
  const [premiumEntreeSet, setPremiumEntreeSet] = useState(new Set());
  
  // 2. DYNAMIC STATE FOR MENU CATEGORY LOOKUPS
  // The JavaFX code separates Sides and Entrees based on the database flag 'is_side'.
  // We need to fetch and store these lists to perform lookups (`SIDES.has(itemName)`).
  const [sideSet, setSideSet] = useState(new Set());
  const [entreeSet, setEntreeSet] = useState(new Set());
  // The sets are used for checking category membership
  
  // Use the sets instead of the old constants
  const SIDES = sideSet;
  const ENTREES = entreeSet;


  useEffect(() => {
    // This hook runs once after the initial render to fetch all necessary dynamic data
    fetchPrices();
    // Also fetch the full menu items for category lookups
    fetchCategories(); 
  }, []);

  async function fetchPrices() {
    try {
      const sizesRes = await apiFetch('/sizes/prices');
      const sizesData = await sizesRes.json();
      const sizeCache = {};
      sizesData.forEach(item => sizeCache[item.name] = parseFloat(item.price));
      setSizePriceCache(sizeCache);

      const appDrinkRes = await apiFetch('/appetizers-drinks/prices');
      const appDrinkData = await appDrinkRes.json();
      const appDrinkCache = {};
      appDrinkData.forEach(item => appDrinkCache[item.name] = parseFloat(item.price));
      setAppetizerPriceCache(appDrinkCache);
      setDrinkPriceCache(appDrinkCache);

      const premiumRes = await apiFetch('/premium-entrees');
      const premiumData = await premiumRes.json();
      setPremiumEntreeSet(new Set(premiumData));

      console.log('Prices loaded:', { sizeCache, appDrinkCache, premiumData });
    } catch (error) {
      console.error('Error fetching prices:', error);
    }
  }
  

  async function fetchCategories() {
    try {
      const sidesRes = await apiFetch('/sides/names');
      const sidesNames = await sidesRes.json(); 
      console.log(sidesRes);
      setSideSet(new Set(sidesNames));

      const entreesRes = await apiFetch('/entrees/names');
      const entreesNames = await entreesRes.json(); 
      setEntreeSet(new Set(entreesNames));

      console.log('Categories loaded:', { sidesNames, entreesNames });
    } catch (error) {
      
      console.error('Error fetching categories:', error);
    }
  }


  // Menu Button Population Functions (Now use backend data)

  // updated the API calls to fetch the list of *objects* with ID and name

  function getSides() {
    apiFetch('/sides')
      .then(res => res.json())
      .then(data => setDynamicButtons(data.map(item => ({ id: item.id, label: item.name }))))
      .catch(console.error);
  }

  function getEntrees() {
    apiFetch('/entrees')
      .then(res => res.json())
      .then(data => setDynamicButtons(data.map(item => ({ id: item.id, label: item.name }))))
      .catch(console.error);
  }

  function getAppetizers() {
    apiFetch('/appetizers')
      .then(res => res.json())
      .then(data => setDynamicButtons(data.map(item => ({ id: item.id, label: item.name, price: item.price }))))
      .catch(console.error);
  }

  // Utility/Order Logic (Remains largely the same, now using state)

  function onManagerPortal() {
    // Navigate to manager portal
    if (onNavigateToManager) {
      onNavigateToManager();
    }
  }

  function onSizeSelected(e) {
    const size = e.target.dataset.size;
    //setSelectedSize(size);
    setBottomMenuEnabled(true);
    // Prevent starting a new combo if the last combo isn't finished
    if (combos && combos.length > 0) {
      const last = combos[combos.length - 1];
      if (!last.completed) {
        alert('Finish the current combo before starting a new one.');
        return;
      }
    }

    // Start a new combo and determine side/entree counts based on size
    let sideCount = 0;
    let entreeCount = 0;
    switch (size) {
      case 'Bowl':
        sideCount = 1;
        entreeCount = 1;
        break;
      case 'Plate':
        sideCount = 1;
        entreeCount = 2;
        break;
      case 'Bigger Plate':
        sideCount = 2;
        entreeCount = 2;
        break;
      default:
        console.warn('Unknown size selected:', size);
    }
    setCombos(prev => [...prev, { size, items: [], sideCount: 0, entreeCount: 0, maxSideCount: sideCount, maxEntreeCount: entreeCount, completed: false }]);
    setCurrentCategory('sides'); // Default to sides
    getSides();
  }

  function onAddDrink() {
    // In JavaFX version, a dialog let the user select small/medium/large, listed here
    setDrinks(prev => [...prev, { name: 'Medium Drink' }]); 
    setCurrentCategory('drinks');
    setDynamicButtons([{ id: 1, label: 'Small Drink' }, { id: 2, label: 'Medium Drink' }, { id: 3, label: 'Large Drink' }]);
  }

  function onAppetizersSelected() {
    getAppetizers();
    setBottomMenuEnabled(true);
    setCurrentCategory('appetizers');
  }

  function onDeleteComboSelected() {
    setCombos(prev => prev.slice(0, -1));
  }

  function onDoneSelected() {
    setBottomMenuEnabled(false);
    // Mark the last combo as completed (user finished building it)
    setCombos(prev => {
      if (!prev || prev.length === 0) return prev;
      const lastIndex = prev.length - 1;
      const copy = prev.map(c => ({ ...c }));
      copy[lastIndex].completed = true;
      return copy;
    });
    //setSelectedSize(null);
    setDynamicButtons([]);
    setCurrentCategory(null);
  }


  function onSidesSelected() {
    getSides();
    setCurrentCategory('sides');
  }

  function onEntreesSelected() {
    getEntrees();
    setCurrentCategory('entrees');
  }
  
  function addItemToLastCombo(itemName) {
    setCombos(prev => {
      if (!prev || prev.length === 0) return prev;
      const lastIndex = prev.length - 1;
      const last = prev[lastIndex];
      
      const isSide = SIDES.has(itemName); // Uses the dynamically fetched Set
      const isEntree = ENTREES.has(itemName); // Uses the dynamically fetched Set
      
      const newSideCount = last.sideCount + (isSide ? 1 : 0);
      const newEntreeCount = last.entreeCount + (isEntree ? 1 : 0);
      
      // Check maximum counts (based on logic in onSizeSelected)
      const maxSideCount = last.maxSideCount ?? 1; // Default to 1 if not set
      const maxEntreeCount = last.maxEntreeCount ?? 1; // Default to 1 if not set

      if (isSide && newSideCount > maxSideCount) {
         console.warn(`Cannot add more sides. Max is ${maxSideCount}.`);
         return prev;
      }
      if (isEntree && newEntreeCount > maxEntreeCount) {
         console.warn(`Cannot add more entrees. Max is ${maxEntreeCount}.`);
         return prev;
      }

      const newCombo = { 
        ...last, 
        items: [...last.items, itemName], 
        sideCount: newSideCount, 
        entreeCount: newEntreeCount,
        completed: (newSideCount >= maxSideCount && newEntreeCount >= maxEntreeCount)
      };
      // If combo became complete, close the bottom menu so user can't add more items
      if (newCombo.completed) setBottomMenuEnabled(false);

      return [...prev.slice(0, lastIndex), newCombo];
    });
  }

  function onDynamicButtonClick(btn) {
    if (currentCategory === 'appetizers') {
      setAppetizers(prev => [...prev, { name: btn.label }]);
    } else if (currentCategory === 'drinks') {
      setDrinks(prev => [...prev, { name: btn.label }]);
    } else if (currentCategory === 'sides' || currentCategory === 'entrees') {
      if (combos.length === 0) {
        console.warn('No combo to add item to. Select size first.');
        return;
      }
      addItemToLastCombo(btn.label);
    } else {
      setAppetizers(prev => [...prev, { name: btn.label }]);
    }
  }

  async function onSubmitOrder() {
    const total = await calculateTotal();
    
    // Separate sides and entrees in each combo
    const formattedCombos = combos.map(combo => {
      const sides = combo.items.filter(item => SIDES.has(item));
      const entrees = combo.items.filter(item => ENTREES.has(item));
      return {
        size: combo.size,
        items: entrees,  // Keep items as entrees for backward compatibility
        sides: sides     // Add sides separately
      };
    });
    
    const order = { combos: formattedCombos, appetizers, drinks, totalPrice: total };

    try {
      const response = await apiFetch('/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(order),
      });
      const result = await response.json();
      if (response.ok) {
        alert(`Order submitted! Order ID: ${result.orderId}`);
        setCombos([]); setAppetizers([]); setDrinks([]); setDynamicButtons([]);
        //setBottomMenuEnabled(false); setSelectedSize(null); setCurrentCategory(null);
      } else alert(`Order failed: ${result.error}`);
    } catch (error) {
      console.error('Error submitting order:', error);
      alert('Error submitting order. Please try again.');
    }
  }

  // Helper functions for removing items
  function deleteCombo(idx) {
    setCombos(prev => prev.filter((_, i) => i !== idx));
  }

  function editCombo(idx) {
    console.log('Edit combo', idx, combos[idx]);
  }

  function deleteComboItem(comboIdx, itemIdx) {
    setCombos(prev => {
      const copy = prev.map(c => ({ ...c, items: [...c.items] }));
      if (!copy[comboIdx]) return prev;
      const removed = copy[comboIdx].items.splice(itemIdx, 1)[0];
      if (removed) {
        if (SIDES.has(removed)) copy[comboIdx].sideCount = Math.max(0, (copy[comboIdx].sideCount || 0) - 1);
        if (ENTREES.has(removed)) copy[comboIdx].entreeCount = Math.max(0, (copy[comboIdx].entreeCount || 0) - 1);
      }
      const maxSide = copy[comboIdx].maxSideCount ?? 1;
      const maxEntree = copy[comboIdx].maxEntreeCount ?? 1;
      if (copy[comboIdx].sideCount < maxSide || copy[comboIdx].entreeCount < maxEntree) {
        copy[comboIdx].completed = false;
        setBottomMenuEnabled(true);
      }
      return copy;
    });
  }

  function deleteAppetizer(idx) {
    setAppetizers(prev => prev.filter((_, i) => i !== idx));
  }

  function deleteDrink(idx) {
    setDrinks(prev => prev.filter((_, i) => i !== idx));
  }

// Dynamic Price Lookup Fallbacks

async function fetchSizePrice(sizeName) {
  try {
    const res = await apiFetch(`/sizes/price/${encodeURIComponent(sizeName)}`);
    const data = await res.json();
    if (res.ok) { setSizePriceCache(prev => ({ ...prev, [sizeName]: data.price })); return data.price; }
    throw new Error('Size price not found');
  } catch (error) {
    console.error(`Error fetching price for size ${sizeName}:`, error);
    return 0;
  }
}

async function fetchAppetizerPrice(itemName) {
  try {
    const res = await apiFetch(`/appetizers-drinks/price/${encodeURIComponent(itemName)}`);
    const data = await res.json();
    if (res.ok) { 
      setAppetizerPriceCache(prev => ({ ...prev, [itemName]: data.price }));
      setDrinkPriceCache(prev => ({ ...prev, [itemName]: data.price }));
      return data.price; 
    }
    throw new Error('Item price not found');
  } catch (error) {
    console.error(`Error fetching price for item ${itemName}:`, error);
    return 0;
  }
}

  // Calculate pricing
  async function calculateTotal() {
    let subtotal = 0;
    
    // Calculate combo prices
    for (const combo of combos) {
      const basePrice = sizePriceCache[combo.size] || await fetchSizePrice(combo.size);
      let premiumCharge = 0;
      
      for (const entreeName of combo.items) {
        if (premiumEntreeSet.has(entreeName)) {
          premiumCharge += 1.5; // Premium upcharge
        }
      }
      
      subtotal += basePrice + premiumCharge;
    }
    
    // Calculate appetizer prices
    for (const app of appetizers) {
      const price = appetizerPriceCache[app.name] || await fetchAppetizerPrice(app.name);
      subtotal += price;
    }
    
    // Calculate drink prices
    for (const drink of drinks) {
      const price = appetizerPriceCache[drink.name] || await fetchAppetizerPrice(drink.name);
      subtotal += price;
    }
    
    const tax = subtotal * TAX_RATE;
    return subtotal + tax;
  }

  const calculateDisplayTotals = () => {
    let subtotal = 0;
  
    combos.forEach(combo => {
      const basePrice = sizePriceCache[combo.size] || 0;
      let premiumCharge = 0;
  
      combo.items.forEach(entreeName => {
        if (premiumEntreeSet.has(entreeName)) {
          premiumCharge += 1.5;
        }
      });
  
      subtotal += basePrice + premiumCharge;
    });
  
    appetizers.forEach(app => {
      subtotal += appetizerPriceCache[app.name] || 0;
    });
  
    drinks.forEach(drink => {
      subtotal += drinkPriceCache[drink.name] || 0;
    });
  
    const tax = subtotal * TAX_RATE;
    const total = subtotal + tax;
  
    return { subtotal, tax, total };
  };
  

  const { subtotal, tax, total } = calculateDisplayTotals();

  // Whether the last combo is still being built (not completed)
  const hasIncompleteCombo = combos.length > 0 && !combos[combos.length - 1].completed;

  // The rest of the component - subtotal calculation
  return (
    <div className="cashier-root">
      <header className="top-bar">
        <div className="header-center">
          <div className="header-label">Make Happy Happen</div>
        </div>
        <div className="header-right">
          <button className="manager-portal-button" onClick={onManagerPortal}>
            Manager Portal
          </button>
          <button className="manager-portal-button" onClick={() => { if (onNavigateToCustomer) onNavigateToCustomer(); else window.alert('Customer view not available'); }}>
            Kiosk
          </button>
        </div>
      </header>

      <div className="content-grid" style={{display: 'flex', alignItems: 'stretch'}}>

        {/* Left column: separator + order summary */}
        <div className="left-column" style={{width: 320, minWidth: 320, display: 'flex', flexDirection: 'column'}}>
          <div className="left-separator" />
          
          <aside className="order-summary" style={{flex: 1}}>
            <div className="order-header">Order Summary</div>

            <div className="order-items">
              {combos.length === 0 && appetizers.length === 0 && drinks.length === 0 && (
                <div className="order-empty">No items yet</div>
              )}

              {/* Combos */}
              {combos.map((combo, idx) => {
                const comboPrice = (sizePriceCache[combo.size] || 0) + combo.items.reduce((pc, name) => pc + (premiumEntreeSet.has(name) ? 1.5 : 0), 0);
                return (
                  <div key={`combo-${idx}`} className="order-combo">
                    <div className="combo-header" style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
                      <div style={{fontWeight: 'bold', color: 'black'}}>{combo.size} {` ($${comboPrice.toFixed(2)})`}</div>
                      <div>
                        <button onClick={() => deleteCombo(idx)} style={{backgroundColor: 'red', color: 'white', marginRight: 6}}>X</button>
                        <button onClick={() => editCombo(idx)} style={{backgroundColor: 'orange', color: 'white'}}>Edit</button>
                      </div>
                    </div>

                    <div style={{paddingLeft: 12}}>
                      {combo.items.map((item, j) => (
                        <div key={`c-${idx}-i-${j}`} style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
                          <div style={{color: 'black'}}> - {item}</div>
                          <div>
                            <button onClick={() => deleteComboItem(idx, j)} style={{backgroundColor: 'red', color: 'white'}}>X</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}

              {/* Appetizers */}
              {appetizers.map((app, i) => (
                <div key={`app-${i}`} style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
                  <div style={{color: 'black'}}>{app.name} {` ($${(appetizerPriceCache[app.name] || 0).toFixed(2)})`}</div>
                  <div>
                    <button onClick={() => deleteAppetizer(i)} style={{backgroundColor: 'red', color: 'white'}}>X</button>
                  </div>
                </div>
              ))}

              {/* Drinks */}
              {drinks.map((d, i) => (
                <div key={`drink-${i}`} style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
                  <div style={{color: 'black'}}>{d.name} {` ($${(drinkPriceCache[d.name] || 0).toFixed(2)})`}</div>
                  <div>
                    <button onClick={() => deleteDrink(i)} style={{backgroundColor: 'red', color: 'white'}}>X</button>
                  </div>
                </div>
              ))}
            </div>

            <div style={{marginTop: 12}}>
              <button className="submit-order" onClick={onSubmitOrder}>Submit Order</button>
            </div>

            <div className="totals" style={{marginTop: 8}}>
            <div className="total-label">Subtotal: ${subtotal.toFixed(2)}</div>
            <div className="total-label">Tax: ${tax.toFixed(2)}</div>
            <div className="total-label" style={{fontWeight: 'bold'}}>Total: ${total.toFixed(2)}</div>
            </div>
          </aside>
        </div>

        {/* Main area: takes remaining space */}
        <div className="main-area" style={{flex: 1, minWidth: 0}}>
          <div className="top-controls">
            <div className="size-row">
              <button className="btn-size" data-size="Bowl" onClick={onSizeSelected} disabled={hasIncompleteCombo}>Bowl</button>
              <button className="btn-size" data-size="Plate" onClick={onSizeSelected} disabled={hasIncompleteCombo}>Plate</button>
              <button className="btn-size" data-size="Bigger Plate" onClick={onSizeSelected} disabled={hasIncompleteCombo}>Bigger Plate</button>
            </div>

            <div className="action-row">
              <button onClick={onAddDrink}>Add Drink</button>
              <button onClick={onAppetizersSelected}>Appetizers</button>
              <button onClick={onDeleteComboSelected}>Delete Combo</button>
              <button onClick={onDoneSelected}>Done</button>
            </div>
          </div>

          <div className={`bottom-menu ${bottomMenuEnabled ? '' : 'disabled'}`}>
            <div className="toggle-row">
              <button onClick={onSidesSelected}>Sides</button>
              <button onClick={onEntreesSelected}>Entrees</button>
            </div>

            <div className="dynamic-grid">
              {dynamicButtons.length === 0 && (
                <div className="dynamic-empty">Select a category to show items</div>
              )}
              {dynamicButtons.map(btn => (
                <button key={btn.id} className="dynamic-btn" onClick={() => onDynamicButtonClick(btn)}>
                  <div className="dynamic-label">{btn.label}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}