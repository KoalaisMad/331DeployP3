import React, { useEffect, useState } from 'react';

export default function Inventory() {

  const API_BASE = 'http://localhost:5000/api';

  async function apiFetch(path, options = {}) {
  return fetch(`${API_BASE}${path}`, options);
}

  // Split price-adjustment into three lists so we can show separate editable tables
  const [sizes, setSizes] = useState([
    { id: 1, name: 'Bowl', price: 8.30, type: 'CONTAINER' },
    { id: 2, name: 'Plate', price: 9.80, type: 'CONTAINER' },
    { id: 3, name: 'Bigger Plate', price: 11.30, type: 'CONTAINER' },
  ]);

  const [mainItems, setMainItems] = useState([
    { id: 4, name: 'Orange Chicken', price: 0.00, isPremium: true, type: 'MAIN_ITEM' },
    { id: 5, name: 'Teriyaki Chicken', price: 0.00, isPremium: false, type: 'MAIN_ITEM' },
  ]);

  const [appetizers, setAppetizers] = useState([
    { id: 6, name: 'Drink', price: 1.99, isEnabled: true, type: 'APPETIZER_DRINK' },
    { id: 7, name: 'Spring Rolls', price: 2.00, isEnabled: true, type: 'APPETIZER_DRINK' },
  ]);

  const [inventoryItems, setInventoryItems] = useState([
    { id: 1, name: 'Orange Chicken', quantity: 150 },
    { id: 2, name: 'Teriyaki Chicken', quantity: 200 },
    { id: 3, name: 'Fried Rice', quantity: 180 },
    { id: 4, name: 'Chow Mein', quantity: 120 },
    { id: 5, name: 'Spring Rolls', quantity: 85 },
    { id: 6, name: 'Broccoli Beef', quantity: 95 },
  ]);

  // Additional UI and form state to mirror JavaFX InventoryController
  const [bulkInventoryText, setBulkInventoryText] = useState('');

  // Add Size form
  const [newSizeName, setNewSizeName] = useState('');
  const [newSizePrice, setNewSizePrice] = useState('');
  const [newSizeNumSides, setNewSizeNumSides] = useState(0);
  const [newSizeNumEntrees, setNewSizeNumEntrees] = useState(0);

  // Add Appetizer/Drink form
  const [newAppName, setNewAppName] = useState('');
  const [newAppPrice, setNewAppPrice] = useState('');

  // Add Main Item form
  const [newMainName, setNewMainName] = useState('');
  const [newMainPrice, setNewMainPrice] = useState('');
  const [newMainIsPremium, setNewMainIsPremium] = useState(false);
  const [newMainIsSide, setNewMainIsSide] = useState(false);
  const [mainItemMessage, setMainItemMessage] = useState('');

  // Restock selection state (track which inventory rows are selected for batch restock)
  const [restockSelected, setRestockSelected] = useState({});

  // API base for backend calls


  const [bulkLoading, setBulkLoading] = useState(false);

  // Low-stock threshold filter for the inventory table
  const [lowStockThreshold, setLowStockThreshold] = useState(100);
  const [applyThresholdFilter, setApplyThresholdFilter] = useState(false);

  // editingCell: { list: 'sizes'|'main'|'apps', id, field }
  const [editingCell, setEditingCell] = useState({ list: null, id: null, field: null });
  const [editValue, setEditValue] = useState('');

  // Load tables at start
  useEffect(() => {
    loadSizes();
    loadAppetizersDrinks();
    loadMainItems();
  }, []);

  async function loadSizes() {
    const sizesJSON = await getSizesJSON(); 

    // Make sure sizesJSON is an array.
    const rows = Array.isArray(sizesJSON) ? sizesJSON: [];

    const sizesMapped = rows.map(row => ({
      id: row.id,
      name: row.name,
      price: row.price,
      numEntrees: row.numberofentrees,
      numSides: row.numberofsides,
      type: 'CONTAINER',
    }));
    setSizes(sizesMapped);
  }

  async function loadMainItems() {
    const mainItemsJSON = await getMainItemsJSON();

    // Make sure appetizersDrinksJSON is an array
    const rows = Array.isArray(mainItemsJSON) ? mainItemsJSON : [];

    const mainItemsMapped = rows.map(row => ({
      id: row.id,
      name: row.name,
      price: 0.00,
      isPremium: row.premium,
      isEnabled: row.enabled,
      isSide: row.is_side,
      type: 'MAIN_ITEM'
    }));

    setMainItems(mainItemsMapped);
  }

  async function loadAppetizersDrinks() {
    const appetizersDrinksJSON = await getAppetizersDrinksJSON();

    // Make sure appetizersDrinksJSON is an array
    const rows = Array.isArray(appetizersDrinksJSON) ? appetizersDrinksJSON : [];

    const appetizersDrinksMapped = rows.map(row => ({
      id: row.id,
      name: row.name,
      price: row.price,
      isEnabled: row.enabled,
      type: 'APPETIZER_DRINK'
    }));

    setAppetizers(appetizersDrinksMapped);

  }

  // Getter for sizes
  async function getSizesJSON() {
    try {
      // await pauses getSizesJSON function  without blocking other parts of program
      const response = await apiFetch("/inventory/price-adjustment/sizes");

      if(!response.ok) {
        console.log("Getting sizes failed");
      }
      // returns promise (placeholder), to be handled by await in calling function
      return response.json();
    }
    catch(error) {
      console.error("Error: ", error);
    }
  }

  async function getMainItemsJSON() {
    try {
      // await pauses getMainItemsJSON function  without blocking other parts of program
      const response = await apiFetch("/inventory/price-adjustment/main-items");

      if(!response.ok) {
        console.log("Getting main items failed");
      }
      // returns promise (placeholder), to be handled by await in calling function
      return response.json();
    }
    catch(error) {
      console.error("Error: ", error);
    }
  }

  async function getAppetizersDrinksJSON() {
    try {
      // await pauses getSizesJSON function  without blocking other parts of program
      const response = await apiFetch("/inventory/price-adjustment/appetizers-drinks");

      if(!response.ok) {
        console.log("Getting appetizers and drinks failed");
      }
      // returns promise (placeholder), to be handled by await in calling function
      return response.json();
    }
    catch(error) {
      console.error("Error: ", error);
    }
  }

  const handlePriceEdit = (listName, id, field) => {
    let item;
    if (listName === 'sizes') item = sizes.find(i => i.id === id);
    else if (listName === 'main') item = mainItems.find(i => i.id === id);
    // If listName corresponded to appetizers/drinks
    else item = appetizers.find(i => i.id === id);
    setEditingCell({ list: listName, id, field });
    setEditValue(item ? item[field] : '');
  };

  const handlePriceSave = (listName, id, field) => {
    const parsedVal = field === 'price' ? parseFloat(editValue): (field === 'numEntrees' || field === 'numSides') ? parseInt(editValue): editValue;
    if (listName === 'sizes') {
      const updated = sizes.map(item => item.id === id ? { ...item, [field]: parsedVal } : item);
      const updatedItem = updated.find(i => i.id === id);
      setSizes(updated);
      updatePriceInDatabase(updatedItem);
    } else if (listName === 'main') {
      const updated = mainItems.map(item => item.id === id ? { ...item, [field]: parsedVal } : item);
      const updatedItem = updated.find(i => i.id === id);
      setMainItems(updated);
      updatePriceInDatabase(updatedItem);
    } else {
      const updated = appetizers.map(item => item.id === id ? { ...item, [field]: parsedVal } : item);
      const updatedItem = updated.find(i => i.id === id);
      setAppetizers(updated);
      updatePriceInDatabase(updatedItem);
    }
    setEditingCell({ list: null, id: null, field: null });
    setEditValue('');
  };

  const updatePriceInDatabase = (item) => {
    let sqlStatement = null;
    // TODO: Restructure to edit name and price/premium simultaneously
    
    if (item.type === 'CONTAINER') {
      sqlStatement = `UPDATE sizes SET price=${item.price} WHERE id=${item.id};`;
    } else if (item.type === 'APPETIZER_DRINK') {
      sqlStatement = `UPDATE appetizers_and_drinks SET price=${item.price} WHERE id=${item.id};`;
    } else if (item.type === 'MAIN_ITEM') {
      sqlStatement = `UPDATE food SET premium=${item.isPremium} WHERE id=${item.name};`;
    }
    
    // If sql statement is not empty string
    if (sqlStatement) {
      console.log('SQL:', sqlStatement);
      // Execute SQL query through backend API
      // Update price for container
      if(item.type === 'CONTAINER') {
        console.log(typeof item.id === 'number');
        const newValue = item.price;
        apiFetch("/inventory/price-adjustment/sizes", {
          method: "PUT",
          headers: {"Content-Type": "application/json"},
          body: JSON.stringify(item)
        })
        // Update price for appetizer/drink
      } else if (item.type === 'APPETIZER_DRINK') {
        const newValue = item.price;
        apiFetch("/inventory/price-adjustment/appetizers-drinks", {
          method: "PUT",
          headers: {"Content-Type": "application/json"},
          body: JSON.stringify(item)
        });
        // Update premium for main item
      } else if (item.type === 'MAIN_ITEM') {
        const newValue = item.isPremium;
        apiFetch("/inventory/price-adjustment/main-items", {
          method: "PUT",
          headers: {"Content-Type": "application/json"},
          body: JSON.stringify(item)
        });
      }
    }
  };

  const handleDeleteItem = (listName, item) => {
    let tableName = '';
    if (item.type === 'APPETIZER_DRINK') {
      tableName = 'appetizers_and_drinks';
    } else if (item.type === 'CONTAINER') {
      tableName = 'sizes';
    } else if (item.type === 'MAIN_ITEM') {
      tableName = 'food';
    }
    const sqlStatement = `DELETE FROM ${tableName} WHERE id='${item.id}';`;
    console.log('SQL:', sqlStatement);
    // TODO: Execute SQL query through backend API when ready
    if (listName === 'sizes'){
      apiFetch('/inventory/price-adjustment/sizes', {
        method: 'DELETE',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(item)
      });
      setSizes(prev => prev.filter(i => i.id !== item.id));
    } 
    else if (listName === 'main'){
      apiFetch('/inventory/price-adjustment/main-items', {
        method: 'DELETE',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(item)
      });
      setMainItems(prev => prev.filter(i => i.id !== item.id));
    } 
    else if (listName === 'apps'){
      apiFetch('/inventory/price-adjustment/appetizers-drinks', {
        method: 'DELETE',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(item)
      });
      setAppetizers(prev => prev.filter(i => i.id !== item.id));
    }  
  };

  const handleRestock = (item) => {
    const updatedQuantity = item.quantity + 100;
    const sqlStatement = `UPDATE inventory SET quantity=${updatedQuantity} WHERE name='${item.name}';`;
    console.log('SQL:', sqlStatement);
    // TODO: Execute SQL query through backend API when ready
    
    setInventoryItems(inventoryItems.map(i => 
      i.id === item.id ? { ...i, quantity: updatedQuantity } : i
    ));
  };

  // Toggle a row's restock selection
  const toggleRestockSelect = (id) => {
    setRestockSelected(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Restock all selected inventory items (+100 each)
  const restockSelectedNow = () => {
    const updated = inventoryItems.map(item => {
      if (restockSelected[item.id]) {
        const newQty = item.quantity + 100;
        console.log(`SQL: UPDATE inventory SET quantity=${newQty} WHERE name='${item.name}';`);
        return { ...item, quantity: newQty };
      }
      return item;
    });
    setInventoryItems(updated);
    // Clear selections
    setRestockSelected({});
  };

  // Toggle apply threshold filter
  const toggleApplyThreshold = () => setApplyThresholdFilter(prev => !prev);

const bulkAddInventory = async () => {
    setBulkLoading(true);
    try {
      const mainItemName = (newMainName || '').trim();
      if (!mainItemName) {
        generateMainItemMessage('Please enter the Main Item name to link inventory to.');
        return;
      }

      if (!bulkInventoryText || !bulkInventoryText.trim()) {
        generateMainItemMessage('Please enter inventory item names separated by commas.');
        return;
      }

      // Ensure main exists on server
      let foodResp;
      try {
        foodResp = await createOrGetFood(mainItemName, 0.0, false);
      } catch (e) {
        generateMainItemMessage('Failed to ensure main item on server');
        console.error(e);
        return;
      }

      const serverMainName = (foodResp && foodResp.item && foodResp.item.name) ? foodResp.item.name : mainItemName;

      const input = bulkInventoryText;
      const itemNames = input.split(',');
      let addedCount = 0;
      let skippedCount = 0;
      const skippedItems = [];

      for (const rawItem of itemNames) {
        const trimmedItem = (rawItem || '').trim();
        if (!trimmedItem) continue;

        try {
          // Create inventory on server (or get existing)
          const invResp = await createOrGetInventory(trimmedItem, 100);
          if (invResp && invResp.existed) {
            skippedCount++;
            skippedItems.push(trimmedItem);
          } else if (invResp && invResp.item) {
            // add to local state using server id
            setInventoryItems(prev => [...prev, { id: invResp.item.id, name: invResp.item.name, quantity: invResp.item.quantity }]);
            addedCount++;
          }

          // Link inventory and food on server
          try {
            const linkRes = await fetch(`${API_BASE}/link/inventory-food`, {
              method: 'POST', headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ itemName: serverMainName, inventoryName: trimmedItem, servingSize: 1 })
            });
            if (!linkRes.ok) console.warn('Link inventory-food failed for', trimmedItem, await linkRes.text());
          } catch (e) {
            console.error('Failed to link inventory-food for', trimmedItem, e);
          }

        } catch (e) {
          console.log(`Error processing item '${trimmedItem}':`, e && e.message ? e.message : e);
        }
      }

      // Link sizes to the main item via backend
      for (const size of sizes) {
        try {
          const linkSizeRes = await fetch(`${API_BASE}/link/size-food`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sizeName: size.name, itemName: serverMainName })
          });
          if (!linkSizeRes.ok) console.warn('Link size-food failed for', size.name, await linkSizeRes.text());
        } catch (e) {
          console.error('Error linking size to main item', size.name, e);
        }
      }

      let summary = `Added ${addedCount} inventory item(s).`;
      if (skippedCount > 0) summary += ` Skipped ${skippedCount} existing item(s): ${skippedItems.join(', ')}.`;
      generateMainItemMessage(summary);
      setBulkInventoryText('');

  // Reset/add UI state for main item by calling addMainItem to refresh local list
  // We set linkInventory:false because bulkAddInventory already handled linking
    try { await addMainItem({ linkInventory: false }); } catch (e) { /* swallow */ }

    } finally {
      setBulkLoading(false);
    }
  };

  // Add Size / Appetizer / Main item handlers (mock DB insert + update local lists)
  const addSize = async () => {
    if (!newSizeName.trim()) return;
    // Inconsistent with configuration of database - need to resolve this in later sprint
    // const nextId = sizes.length ? Math.max(...sizes.map(i => i.id)) + 1 : 1;
    const price = parseFloat(newSizePrice) || 0.0;
    const newItem = { id: null, name: newSizeName.trim(), price, numEntrees: newSizeNumEntrees, numSides: newSizeNumSides, type: 'CONTAINER' };
    console.log(`SQL: INSERT INTO sizes (name, price, numberofsides, numberofentrees) VALUES ('${newItem.name}', ${price}, ${newSizeNumSides}, ${newSizeNumEntrees});`);

    // Client makes post request to add size into database
    const response = await apiFetch("/inventory/price-adjustment/sizes", {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(newItem)
    });

    // Get actual parsed json object
    const returnedData = await response.json();

    // Extract newItem's new id
    newItem.id = returnedData.id;
    
    setSizes(prev => [...prev, newItem]);
    setNewSizeName(''); setNewSizePrice(''); setNewSizeNumSides(0); setNewSizeNumEntrees(0);
  };

  const addAppetizerDrink = async () => {
    if (!newAppName.trim()) return;
    // const nextId = appetizers.length ? Math.max(...appetizers.map(i => i.id)) + 1 : 1;
    const price = parseFloat(newAppPrice) || 0.0;
    // Make id placeholder - null
    const newItem = { id: null, name: newAppName.trim(), price, isEnabled: true, type: 'APPETIZER_DRINK' };
    console.log(`SQL: INSERT INTO appetizers_and_drinks (name, price, enabled) VALUES ('${newItem.name}', ${price}, ${newItem.isEnabled});`);

    // Client makes post request to add size into database
    const response = await apiFetch("/inventory/price-adjustment/appetizers-drinks", {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(newItem)
    });

    const data = await response.json();
    
    // Update id
    newItem.id = data.id;
    
    setAppetizers(prev => [...prev, newItem]);
    setNewAppName(''); setNewAppPrice('');
  };

const createOrGetFood = async (name, price = 0.0, isPremium = false) => {
    try {
      const res = await fetch(`${API_BASE}/food`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, price, isPremium })
      });
      // Some server errors may return non-JSON (HTML/text). Handle gracefully.
      const contentType = res.headers.get('content-type') || '';
      const text = await res.text();
      if (!res.ok) {
        // If the endpoint is not found (server not restarted or route missing),
        // fallback to local-only behavior so the UI can continue working.
        if (res.status === 404) {
          console.warn(`POST ${API_BASE}/food returned 404 — falling back to local-only create for '${name}'`);
          return { existed: false, item: { id: null, name, price, premium: isPremium }, fallback: true };
        }
        // return text for diagnostics
        throw new Error(`Server error (${res.status}): ${text}`);
      }
      if (contentType.includes('application/json')) {
        return JSON.parse(text);
      }
      // fallback: try parse, otherwise return raw text
      try { return JSON.parse(text); } catch (e) { return { item: null, raw: text }; }
    } catch (err) {
      console.error('createOrGetFood error', err);
      throw err;
    }
  };

  // Helper: create or return existing inventory item on backend
  const createOrGetInventory = async (name, quantity = 100) => {
    try {
      const res = await fetch(`${API_BASE}/inventory`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, quantity })
      });
      const contentType = res.headers.get('content-type') || '';
      const text = await res.text();
      if (!res.ok) {
        if (res.status === 404) {
          console.warn(`POST ${API_BASE}/inventory returned 404 — falling back to local-only create for '${name}'`);
          return { existed: false, item: { id: null, name, quantity }, fallback: true };
        }
        throw new Error(`Server error (${res.status}): ${text}`);
      }
      if (contentType.includes('application/json')) {
        return JSON.parse(text);
      }
      try { return JSON.parse(text); } catch (e) { return { item: null, raw: text }; }
    } catch (err) {
      console.error('createOrGetInventory error', err);
      throw err;
    }
  };

  // Default premium price — repository doesn't expose MainItem.getPremiumPrice(),
  // so assume a sensible default. If your backend defines a different default,
  // update this constant or fetch it from the server.
  const DEFAULT_PREMIUM_PRICE = 2.5;

  const generateMainItemMessage = (msg) => {
    setMainItemMessage(msg);
    // optionally clear after a few seconds
    setTimeout(() => setMainItemMessage(''), 5000);
  };

  // addMainItem optionally links inventory items found in the "Required Inventory" field
  // options: { linkInventory: boolean } - defaults to true
  const addMainItem = async (options = { linkInventory: true }) => {
    // Basic null checks (inputs always exist in this component, but keep parity with Java logic)
    if (newMainName == null || newMainPrice == null) {
      console.log('Adding Main Item failed due to null.');
      return;
    }

    try {
      // Check empty name
      if (newMainName.trim() === '') {
        generateMainItemMessage('Adding Main Item failed due to empty field.');
        return;
      }

      const name = newMainName.trim();
      let price;
      const isPremium = !!newMainIsPremium;

      // If price field empty, decide default based on premium flag
      if (newMainPrice.trim() === '') {
        if (isPremium) {
          price = DEFAULT_PREMIUM_PRICE;
        } else {
          price = 0.00;
        }
      } else {
        // parse provided price or throw
        price = parseFloat(newMainPrice);
        if (Number.isNaN(price)) throw new Error('Unable to parse price');
      }

      // Persist to backend (create or get existing)
      let resp;
      try {
        resp = await createOrGetFood(name, price, isPremium);
      } catch (e) {
        console.error('Failed to create/get main item on server', e);
        generateMainItemMessage('Failed to create main item on server');
        return;
      }

      // Server food rows don't include a price column. Use the computed price
      // (from the form/defaults) for UI display if the server didn't return one.
      const respItem = resp && resp.item ? resp.item : null;
      const displayPrice = (respItem && typeof respItem.price !== 'undefined') ? respItem.price : price;
      const itemId = respItem && respItem.id ? respItem.id : null;
      const premiumFlag = respItem && typeof respItem.premium !== 'undefined' ? respItem.premium : isPremium;

      // Only add to local list if not already present
      const existsLocal = mainItems.some(mi => mi.name.toLowerCase() === name.toLowerCase());
      if (!existsLocal) {
        const nextId = mainItems.length ? Math.max(...mainItems.map(i => i.id)) + 1 : 1;
        setMainItems(prev => [...prev, { id: itemId || nextId, name: name, price: displayPrice, isPremium: !!premiumFlag, type: 'MAIN_ITEM' }]);
      }

      // Reset form (mirrors setupMainItemAdd())
      setNewMainName('');
      setNewMainPrice('');
      setNewMainIsPremium(false);

      // Optionally link inventory items listed in the Required Inventory field
      if (options && options.linkInventory) {
        const inventoryText = bulkInventoryText || '';
        if (inventoryText.trim()) {
          const names = inventoryText.split(',').map(s => (s||'').trim()).filter(Boolean);
          let linked = 0;
          let skipped = 0;
          const skippedList = [];
          for (const invName of names) {
            try {
              const invResp = await createOrGetInventory(invName, 100);
              if (invResp && invResp.existed) {
                skipped++;
                skippedList.push(invName);
              } else if (invResp && invResp.item) {
                // add to local state using server id
                setInventoryItems(prev => {
                  const exists = prev.some(p => p.name.toLowerCase() === invResp.item.name.toLowerCase());
                  if (exists) return prev;
                  return [...prev, { id: invResp.item.id || (prev.length ? Math.max(...prev.map(i=>i.id))+1 : 1), name: invResp.item.name, quantity: invResp.item.quantity }];
                });
                linked++;
              }

              // Link inventory to the main item on server
              try {
                const linkRes = await fetch(`${API_BASE}/link/inventory-food`, {
                  method: 'POST', headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ itemName: name, inventoryName: invName, servingSize: 1 })
                });
                if (!linkRes.ok) {
                  const text = await linkRes.text();
                  console.warn('Link inventory-food failed for', invName, text);
                }
              } catch (e) {
                console.error('Failed to link inventory-food for', invName, e);
              }

            } catch (e) {
              console.error(`Error linking inventory '${invName}':`, e);
            }
          }
          let msg = `Added ${linked} inventory item(s) and linked to '${name}'.`;
          if (skipped > 0) msg += ` Skipped ${skipped} existing: ${skippedList.join(', ')}.`;
          generateMainItemMessage(msg);
          // Clear the Required Inventory input after processing
          setBulkInventoryText('');
        }
      } else {
        // Success message when not linking inventory
        generateMainItemMessage('Adding Main Item successful!');
      }
    }
    catch (e) {
      if (e instanceof Error && e.message === 'Unable to parse price') {
        generateMainItemMessage('Unable to parse price');
      } else {
        console.error(e && e.message ? e.message : e);
        console.error(e.stack || '');
        generateMainItemMessage('An error occurred while adding main item');
      }
    }
  };

  const updateInventory = async () => {
    console.log('Refreshing inventory data...');
    // TODO: Fetch fresh data from backend API when ready
  };

  return (
    <div className="tab-panel">
      <h2>Inventory Management</h2>
      
      {/* Price Adjustment Table */}
      <div className="inventory-section">
        <h3>Price Adjustment</h3>
        <div className="table-container">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
              {/* Sizes Table */}
              <div>
                <h4>Sizes</h4>
                <table className="manager-table">
                  <thead>
                    <tr><th>Name</th><th>Price</th><th>Number of Entrees</th><th>Number of Sides</th><th>Actions</th></tr>
                  </thead>
                  <tbody>
                    {sizes.map(item => (
                      <tr key={item.id}>
                        <td>
                          {editingCell.list === 'sizes' && editingCell.id === item.id && editingCell.field === 'name' ? (
                            <input type="text" value={editValue} onChange={e=>setEditValue(e.target.value)} onBlur={() => handlePriceSave('sizes', item.id, 'name')} onKeyPress={(e)=>e.key==='Enter' && handlePriceSave('sizes', item.id, 'name')} autoFocus className="edit-input" />
                          ) : (
                            <span onDoubleClick={() => handlePriceEdit('sizes', item.id, 'name')}>{item.name}</span>
                          )}
                        </td>
                        <td>
                          {editingCell.list === 'sizes' && editingCell.id === item.id && editingCell.field === 'price' ? (
                            <input type="number" step="0.01" value={editValue} onChange={e=>setEditValue(e.target.value)} onBlur={() => handlePriceSave('sizes', item.id, 'price')} onKeyPress={(e)=>e.key==='Enter' && handlePriceSave('sizes', item.id, 'price')} autoFocus className="edit-input" />
                          ) : (
                            // Added check for invalid price
                            <span onDoubleClick={() => handlePriceEdit('sizes', item.id, 'price')}>${item.price != null ? Number(item.price).toFixed(2): ''}</span>
                          )}
                        </td>
                        <td>
                          {/* Column for number of entrees*/}         
                          {editingCell.list === 'sizes' && editingCell.id === item.id && editingCell.field === 'numEntrees' ? (
                            <input type="number" step="1" value={editValue} onChange={e=>setEditValue(e.target.value)} onBlur={() => handlePriceSave('sizes', item.id, 'numEntrees')} onKeyPress={(e)=>e.key==='Enter' && handlePriceSave('sizes', item.id, 'numEntrees')} autoFocus className="edit-input" />
                          ) : (
                            // Added check for invalid price
                            <span onDoubleClick={() => handlePriceEdit('sizes', item.id, 'numEntrees')}>{item.numEntrees != null ? Number(item.numEntrees): ''}</span>
                          )}                 
                        </td>
                        <td>
                          {/* Column for number of sides */}
                          {editingCell.list === 'sizes' && editingCell.id === item.id && editingCell.field === 'numSides' ? (
                            <input type="number" step="1" value={editValue} onChange={e=>setEditValue(e.target.value)} onBlur={() => handlePriceSave('sizes', item.id, 'numSides')} onKeyPress={(e)=>e.key==='Enter' && handlePriceSave('sizes', item.id, 'numSides')} autoFocus className="edit-input" />
                          ) : (
                            // Added check for invalid price
                            <span onDoubleClick={() => handlePriceEdit('sizes', item.id, 'numSides')}>{item.numEntrees != null ? Number(item.numSides): ''}</span>
                          )}
                        </td>
                        <td>
                          <button className="action-btn delete-btn" onClick={() => handleDeleteItem('sizes', item)}>Delete</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Appetizers & Drinks Table */}
              <div>
                <h4>Appetizers / Drinks</h4>
                <table className="manager-table">
                  <thead>
                    <tr><th>Name</th><th>Price</th><th>Enabled</th><th>Actions</th></tr>
                  </thead>
                  <tbody>
                    {appetizers.map(item => (
                      <tr key={item.id}>
                        <td>
                          {editingCell.list === 'apps' && editingCell.id === item.id && editingCell.field === 'name' ? (
                            <input type="text" value={editValue} onChange={e=>setEditValue(e.target.value)} onBlur={() => handlePriceSave('apps', item.id, 'name')} onKeyPress={(e)=>e.key==='Enter' && handlePriceSave('apps', item.id, 'name')} autoFocus className="edit-input" />
                          ) : (
                            <span onDoubleClick={() => handlePriceEdit('apps', item.id, 'name')}>{item.name}</span>
                          )}
                        </td>
                        <td>
                          {editingCell.list === 'apps' && editingCell.id === item.id && editingCell.field === 'price' ? (
                            <input type="number" step="0.01" value={editValue} onChange={e=>setEditValue(e.target.value)} onBlur={() => handlePriceSave('apps', item.id, 'price')} onKeyPress={(e)=>e.key==='Enter' && handlePriceSave('apps', item.id, 'price')} autoFocus className="edit-input" />
                          ) : (
                            // Added check for invalid price
                            <span onDoubleClick={() => handlePriceEdit('apps', item.id, 'price')}>${item.price != null ? Number(item.price).toFixed(2): ''}</span>
                          )}
                        </td>
                        <td>
                          <input type="checkbox" checked={!!item.isEnabled} onChange={() => {
                            const updated = appetizers.map(a => a.id === item.id ? { ...a, isEnabled: !a.isEnabled } : a);
                            setAppetizers(updated);
                            updatePriceInDatabase({ ...item, isEnabled: !item.isEnabled });
                          }} />
                        </td>
                        <td>
                          <button className="action-btn delete-btn" onClick={() => handleDeleteItem('apps', item)}>Delete</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Main Items Table */}
              <div>
                <h4>Main Items</h4>
                <table className="manager-table">
                  <thead>
                    <tr><th>Name</th>{/*<th>Price</th>*/}<th>Premium</th><th>Enabled</th><th>Side</th><th>Actions</th></tr>
                  </thead>
                  <tbody>
                    {mainItems.map(item => (
                      <tr key={item.id}>
                        <td>
                          {editingCell.list === 'main' && editingCell.id === item.id && editingCell.field === 'name' ? (
                            <input type="text" value={editValue} onChange={e=>setEditValue(e.target.value)} onBlur={() => handlePriceSave('main', item.id, 'name')} onKeyPress={(e)=>e.key==='Enter' && handlePriceSave('main', item.id, 'name')} autoFocus className="edit-input" />
                          ) : (
                            <span onDoubleClick={() => handlePriceEdit('main', item.id, 'name')}>{item.name}</span>
                          )}
                        </td>
                        {/*
                        <td>
                          {editingCell.list === 'main' && editingCell.id === item.id && editingCell.field === 'price' ? (
                            <input type="number" step="0.01" value={editValue} onChange={e=>setEditValue(e.target.value)} onBlur={() => handlePriceSave('main', item.id, 'price')} onKeyPress={(e)=>e.key==='Enter' && handlePriceSave('main', item.id, 'price')} autoFocus className="edit-input" />
                          ) : (
                            // Added check for invalid price
                            <span onDoubleClick={() => handlePriceEdit('main', item.id, 'price')}>${item.price != null ? Number(item.price).toFixed(2): ''}</span>
                          )}
                        </td>
                        */}
                        <td>
                          <input type="checkbox" checked={!!item.isPremium} onChange={() => {
                            const updated = mainItems.map(m => m.id === item.id ? { ...m, isPremium: !m.isPremium } : m);
                            setMainItems(updated);
                            updatePriceInDatabase({ ...item, isPremium: !item.isPremium });
                          }} />
                        </td>
                        <td>
                          <input type="checkbox" checked={!!item.isEnabled} onChange={() => {
                            const updated = mainItems.map(m => m.id === item.id ? { ...m, isEnabled: !m.isEnabled } : m);
                            setMainItems(updated);
                            updatePriceInDatabase({ ...item, isEnabled: !item.isEnabled });
                          }} />
                        </td>
                        <td>
                          {/* TODO: Add dropdown later on */} 
                          <input type="checkbox" checked={!!item.isSide} onChange={() => {
                            const updated = mainItems.map(m => m.id === item.id ? { ...m, isSide: !m.isSide } : m);
                            setMainItems(updated);
                            updatePriceInDatabase({ ...item, isSide: !item.isSide });
                          }} />
                        </td>
                        <td>
                          <button className="action-btn delete-btn" onClick={() => handleDeleteItem('main', item)}>Delete</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
        </div>
      </div>

      {/* Add forms to mirror JavaFX inventory controls */}
      <div className="inventory-section">
        {/* <h3>Add Size</h3>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.75rem' }}>
          <input className="date-input" placeholder="Size name" value={newSizeName} onChange={e=>setNewSizeName(e.target.value)} />
          <input className="date-input" placeholder="Price" value={newSizePrice} onChange={e=>setNewSizePrice(e.target.value)} />
          <input type="number" className="time-input" style={{ width: 80 }} value={newSizeNumSides} onChange={e=>setNewSizeNumSides(parseInt(e.target.value||0))} />
          <input type="number" className="time-input" style={{ width: 80 }} value={newSizeNumEntrees} onChange={e=>setNewSizeNumEntrees(parseInt(e.target.value||0))} />
          <button className="add-new-btn" onClick={addSize}>Add Size</button>
        </div> */}

        <h3>Add Appetizer / Drink</h3>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.75rem' }}>
          <input className="date-input" placeholder="Name" value={newAppName} onChange={e=>setNewAppName(e.target.value)} />
          <input className="date-input" placeholder="Price" value={newAppPrice} onChange={e=>setNewAppPrice(e.target.value)} />
          <button className="add-new-btn" onClick={addAppetizerDrink}>Add Appetizer/Drink</button>
        </div>

        <h3>Main Item / Bulk Inventory</h3>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.75rem' }}>
          <input className="date-input" placeholder="Main item name" value={newMainName} onChange={e=>setNewMainName(e.target.value)} />
          <input className="date-input" placeholder="Price (optional)" value={newMainPrice} onChange={e=>setNewMainPrice(e.target.value)} />
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <input type="checkbox" checked={newMainIsPremium} onChange={e=>setNewMainIsPremium(e.target.checked)} /> Premium
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <input type="checkbox" checked={newMainIsSide} onChange={e=>setNewMainIsSide(e.target.checked)} /> Side
          </label>
        </div>
        
        {mainItemMessage && (
          <div className="manager-message" style={{ marginTop: '0.5rem' }}>{mainItemMessage}</div>
        )}

        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.75rem' }}>
          <input className="date-input" placeholder="Required Inventory" value={bulkInventoryText} onChange={e=>setBulkInventoryText(e.target.value)} />
          <button className="add-new-btn" onClick={bulkAddInventory} disabled={bulkLoading}>{bulkLoading ? 'Adding...' : 'Add Required Inventory'}</button>
        </div>
      </div>

      {/* Inventory Restock Table */}
      <div className="inventory-section">
        <h3>Inventory Restock</h3>
        <div className="table-controls" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <button className="update-btn" onClick={updateInventory}>
            Update Inventory
          </button>
          <button className="restock-btn" onClick={restockSelectedNow} style={{ marginLeft: '0.5rem' }}>
            Restock Selected (+100)
          </button>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <input type="checkbox" checked={applyThresholdFilter} onChange={toggleApplyThreshold} />
              Filter by threshold
            </label>
            <input type="number" className="threshold-input" value={lowStockThreshold} onChange={e=>setLowStockThreshold(parseInt(e.target.value||0))} style={{ width: 90 }} />
          </div>
        </div>
        <div className="table-container">
          <table className="manager-table">
            <thead>
              <tr>
                <th>Restock?</th>
                <th>Item Name</th>
                <th>Quantity Remaining</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
                {inventoryItems
                  .filter(item => !applyThresholdFilter || item.quantity <= lowStockThreshold)
                  .map(item => (
                <tr key={item.id} className={item.quantity <= lowStockThreshold ? 'low-stock' : ''}>
                  <td style={{ width: 80 }}>
                    <input type="checkbox" checked={!!restockSelected[item.id]} onChange={() => toggleRestockSelect(item.id)} />
                  </td>
                  <td>{item.name}</td>
                  <td>
                    <span className="quantity-display">{item.quantity}</span>
                    {item.quantity <= lowStockThreshold && <span className="low-stock-warning">⚠️ Low Stock</span>}
                  </td>
                  <td>
                    <button 
                      className="action-btn restock-btn" 
                      onClick={() => handleRestock(item)}
                    >
                      Restock (+100)
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
