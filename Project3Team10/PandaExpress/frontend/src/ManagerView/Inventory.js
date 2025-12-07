import React, { useEffect, useState, useRef } from 'react';

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
  // map of mainItemId -> image URL (object URL or data URL)
  const [mainItemImages, setMainItemImages] = useState({});
  // map of appetizerId -> image URL (object URL or data URL)
  const [appetizerImages, setAppetizerImages] = useState({});

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
  // Image for Main Item
  const [newMainImageFile, setNewMainImageFile] = useState(null);
  const [imageUploadMessage, setImageUploadMessage] = useState('');
  const [imageUploading, setImageUploading] = useState(false);
  // Per-row upload state: files and uploading flags
  const [perRowFiles, setPerRowFiles] = useState({});
  const [perRowUploading, setPerRowUploading] = useState({});
  const [perRowMessages, setPerRowMessages] = useState({});
  // Separate per-row state for appetizers so uploads don't conflict with main items
  const [appPerRowFiles, setAppPerRowFiles] = useState({});
  const [appPerRowUploading, setAppPerRowUploading] = useState({});
  const [appPerRowMessages, setAppPerRowMessages] = useState({});

  // Restock selection state (track which inventory rows are selected for batch restock)
  const [restockSelected, setRestockSelected] = useState({});

  // API base for backend calls


  const [bulkLoading, setBulkLoading] = useState(false);

  // Low-stock threshold filter for the inventory table
  const [lowStockThreshold, setLowStockThreshold] = useState(0);
  const [applyThresholdFilter, setApplyThresholdFilter] = useState(false);

  // Pagination state
  const [mainItemsPage, setMainItemsPage] = useState(1);
  const mainItemsPerPage = 8;

  // Pagination for Appetizers/Drinks table
  const [appetizersPage, setAppetizersPage] = useState(1);
  const appetizersPerPage = 8;

  // Pagination for Inventory Restock table
  const [inventoryPage, setInventoryPage] = useState(1);
  const inventoryPerPage = 8;

  // editingCell: { list: 'sizes'|'main'|'apps', id, field }
  const [editingCell, setEditingCell] = useState({ list: null, id: null, field: null });
  const [editValue, setEditValue] = useState('');

  // Load tables at start
  useEffect(() => {
    loadSizes();
    loadAppetizersDrinks();
    loadMainItems();
    loadInventoryItems();
  }, []);

  async function loadInventoryItems(items = inventoryItems) {
      if(!Array.isArray(items)) return;
      
      const rows = await getInventoryItemsJSON();

      const inventoryItemsMapped = rows.map(row => ({
        id: row.id,
        name: row.name,
        quantity: row.quantity
      }));

      setInventoryItems(inventoryItemsMapped);

      console.log("Load completed");
    }

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
    // kick off image loading for newly fetched items
    loadMainItemImages(mainItemsMapped);
  }

  // Try to fetch image for each main item. Server route expected: GET /api/food-image/:id
  const loadMainItemImages = async (items = mainItems) => {
    if (!Array.isArray(items)) return;
    const newMapping = {};
    for (const item of items) {
      if (!item || typeof item.id === 'undefined') continue;
      try {
        const res = await fetch(`${API_BASE}/food-image/${item.id}`);
        if (!res.ok) continue; // no image available or route not present
        const contentType = res.headers.get('content-type') || '';
        if (!contentType.startsWith('image/')) continue;
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        newMapping[item.id] = url;
      } catch (err) {
        // ignore fetch errors
        console.warn('Failed to load image for', item.id, err);
      }
    }

    // Merge into existing mapping, revoking any replaced blob URLs
    setMainItemImages(prev => {
      const merged = { ...prev };
      for (const idStr of Object.keys(newMapping)) {
        const id = idStr; // keys are strings
        // revoke previous if it looked like a blob URL and is different
        try {
          const prevUrl = merged[id];
          const newUrl = newMapping[id];
          if (prevUrl && prevUrl !== newUrl && String(prevUrl).startsWith('blob:')) {
            try { URL.revokeObjectURL(prevUrl); } catch (e) {}
          }
        } catch (e) {}
        merged[id] = newMapping[id];
      }
      return merged;
    });
  };

  // Keep a ref to the latest mapping so we can revoke blobs on unmount
  const mainItemImagesRef = useRef({});
  const appetizerImagesRef = useRef({});
  useEffect(() => {
    mainItemImagesRef.current = mainItemImages;
  }, [mainItemImages]);

  useEffect(() => {
    appetizerImagesRef.current = appetizerImages;
  }, [appetizerImages]);

  useEffect(() => {
    return () => {
      Object.values(mainItemImagesRef.current).forEach(url => {
        try { URL.revokeObjectURL(url); } catch (e) {}
      });
      Object.values(appetizerImagesRef.current).forEach(url => {
        try { URL.revokeObjectURL(url); } catch (e) {}
      });
    };
  }, []);

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
    // kick off image loading for appetizers
    loadAppetizerImages(appetizersDrinksMapped);

  }

  // Try to fetch image for each appetizer/drink. Server route expected: GET /api/food-image/:id
  const loadAppetizerImages = async (items = appetizers) => {
    if (!Array.isArray(items)) return;
    const newMapping = {};
    for (const item of items) {
      if (!item || typeof item.id === 'undefined') continue;
      try {
        const res = await fetch(`${API_BASE}/appetizer-drink-image/${item.id}`);
        if (!res.ok) continue; // no image available or route not present
        const contentType = res.headers.get('content-type') || '';
        if (!contentType.startsWith('image/')) continue;
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        newMapping[item.id] = url;
      } catch (err) {
        console.warn('Failed to load appetizer image for', item.id, err);
      }
    }

    setAppetizerImages(prev => {
      const merged = { ...prev };
      for (const idStr of Object.keys(newMapping)) {
        const id = idStr;
        try {
          const prevUrl = merged[id];
          const newUrl = newMapping[id];
          if (prevUrl && prevUrl !== newUrl && String(prevUrl).startsWith('blob:')) {
            try { URL.revokeObjectURL(prevUrl); } catch (e) {}
          }
        } catch (e) {}
        merged[id] = newMapping[id];
      }
      return merged;
    });
  };

  // Per-row handlers for appetizers
  const handleAppPerRowFileChange = (id, file) => {
    setAppPerRowFiles(prev => ({ ...prev, [id]: file }));
    setAppPerRowMessages(prev => ({ ...prev, [id]: '' }));
  };

  const handleAppRowUpload = async (id) => {
    const file = appPerRowFiles[id];
    if (!file) {
      setAppPerRowMessages(prev => ({ ...prev, [id]: 'Select a file first' }));
      return;
    }
    setAppPerRowUploading(prev => ({ ...prev, [id]: true }));
    setAppPerRowMessages(prev => ({ ...prev, [id]: '' }));
    try {
      const result = await uploadAppetizerImageForId(id, file);
      if (result && result.success) {
        if (appetizerImages[id]) {
          try { URL.revokeObjectURL(appetizerImages[id]); } catch (e) {}
        }
        const url = URL.createObjectURL(file);
        setAppetizerImages(prev => ({ ...prev, [id]: url }));
        setAppPerRowFiles(prev => ({ ...prev, [id]: null }));
        setAppPerRowMessages(prev => ({ ...prev, [id]: 'Uploaded' }));
      } else {
        setAppPerRowMessages(prev => ({ ...prev, [id]: result && result.message ? result.message : 'Upload failed' }));
      }
    } catch (err) {
      console.error('App row upload error', err);
      setAppPerRowMessages(prev => ({ ...prev, [id]: 'Upload error' }));
    } finally {
      setAppPerRowUploading(prev => ({ ...prev, [id]: false }));
    }
  };

  // Upload image for an appetizer/drink. Expects a File object and an appetizer/drink id.
  const uploadAppetizerImageForId = async (appId, file) => {
    console.log('Uploading appetizer image for id=', appId, 'file=', file);
    if (!appId && appId !== 0) return { success: false, message: 'No appetizer id provided' };
    if (!file) return { success: false, message: 'No file provided' };

    try {
      setImageUploading(true);
      const form = new FormData();
      form.append('image', file);
      form.append('appetizer_drink_id', String(appId));

      const res = await fetch(`${API_BASE}/upload-appetizer-drink-image`, {
        method: 'POST',
        body: form
      });

      if (!res.ok) {
        const text = await res.text();
        const msg = `Upload failed: ${res.status} ${text}`;
        setImageUploadMessage(msg);
        return { success: false, message: msg };
      }

      setImageUploadMessage('Image uploaded successfully');
      return { success: true };
    } catch (err) {
      console.error('Error uploading appetizer image:', err);
      const msg = 'Error uploading image';
      setImageUploadMessage(msg);
      return { success: false, message: msg };
    } finally {
      setImageUploading(false);
    }
  };

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

  async function getInventoryItemsJSON() {
    try {
      // await pauses getMainItemsJSON function  without blocking other parts of program
      const response = await apiFetch("/inventory");

      if(!response.ok) {
        console.log("Getting inventory items failed");
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

  // Upload image for a main item (food). Expects a File object and a food id.
  const uploadImageForFoodId = async (foodId, file) => {
    console.log('Uploading for id=', foodId, 'file=', file);
    if (!foodId && foodId !== 0) return { success: false, message: 'No food id provided' };
    if (!file) return { success: false, message: 'No file provided' };

    try {
      setImageUploading(true);
      const form = new FormData();
      form.append('image', file);
      form.append('food_id', String(foodId));

      const res = await fetch(`${API_BASE}/upload-image`, {
        method: 'POST',
        body: form
      });

      if (!res.ok) {
        const text = await res.text();
        const msg = `Upload failed: ${res.status} ${text}`;
        setImageUploadMessage(msg);
        return { success: false, message: msg };
      }

      setImageUploadMessage('Image uploaded successfully');
      return { success: true };
    } catch (err) {
      console.error('Error uploading image:', err);
      const msg = 'Error uploading image';
      setImageUploadMessage(msg);
      return { success: false, message: msg };
    } finally {
      setImageUploading(false);
    }
  };

  // Handler to upload image for the current newMainName (will create the food if needed)
  const handleUploadImageClick = async () => {
    if (!newMainImageFile) {
      setImageUploadMessage('Please select an image first');
      return;
    }
    const mainName = (newMainName || '').trim();
    if (!mainName) {
      setImageUploadMessage('Please enter a main item name before uploading');
      return;
    }

    try {
      const foodResp = await createOrGetFood(mainName, parseFloat(newMainPrice) || 0.0, !!newMainIsPremium);
      const serverMainId = (foodResp && foodResp.item && foodResp.item.id) ? foodResp.item.id : null;
      if (!serverMainId) {
        setImageUploadMessage('Could not get food id from server to attach image');
        return;
      }

      const result = await uploadImageForFoodId(serverMainId, newMainImageFile);
      if (result && result.success) {
        setImageUploadMessage('Image uploaded');
        // Optionally refresh main items
        loadMainItems();
      }
    } catch (err) {
      console.error('handleUploadImageClick error', err);
      setImageUploadMessage('Failed to upload image');
    }
  };

  // Per-row handlers
  const handlePerRowFileChange = (id, file) => {
    setPerRowFiles(prev => ({ ...prev, [id]: file }));
    setPerRowMessages(prev => ({ ...prev, [id]: '' }));
  };

  const handleRowUpload = async (id) => {
    const file = perRowFiles[id];
    if (!file) {
      setPerRowMessages(prev => ({ ...prev, [id]: 'Select a file first' }));
      return;
    }
    setPerRowUploading(prev => ({ ...prev, [id]: true }));
    setPerRowMessages(prev => ({ ...prev, [id]: '' }));
    try {
      const result = await uploadImageForFoodId(id, file);
      if (result && result.success) {
        // If we have an existing object URL, revoke it
        if (mainItemImages[id]) {
          try { URL.revokeObjectURL(mainItemImages[id]); } catch (e) {}
        }
        // Show image immediately by creating object URL from uploaded file
        const url = URL.createObjectURL(file);
        setMainItemImages(prev => ({ ...prev, [id]: url }));
        setPerRowFiles(prev => ({ ...prev, [id]: null }));
        setPerRowMessages(prev => ({ ...prev, [id]: 'Uploaded' }));
      } else {
        setPerRowMessages(prev => ({ ...prev, [id]: result && result.message ? result.message : 'Upload failed' }));
      }
    } catch (err) {
      console.error('Row upload error', err);
      setPerRowMessages(prev => ({ ...prev, [id]: 'Upload error' }));
    } finally {
      setPerRowUploading(prev => ({ ...prev, [id]: false }));
    }
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

  const handleRestock = async (item) => {
    const updatedQuantity = item.quantity + 100;
    const sqlStatement = `UPDATE inventory SET quantity=${updatedQuantity} WHERE name='${item.name}';`;
    console.log('SQL:', sqlStatement);
      item.quantity = updatedQuantity;
      console.log(`SQL: UPDATE inventory SET quantity=${updatedQuantity} WHERE name='${item.name}';`);

      const updateResp = await apiFetch('/inventory-board', {
        method: 'PUT',
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(item)
      });

      if (!updateResp.ok) {
        console.error('Failed to add item into inventory board');
        throw new Error('Failed to add item into inventory board');
      }	

      const data = await updateResp.json();

    setInventoryItems(inventoryItems.map(i => 
      i.id === item.id ? { ...i, quantity: updatedQuantity } : i
    ));
  };

  // Toggle a row's restock selection
  const toggleRestockSelect = (id) => {
    setRestockSelected(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Restock all selected inventory items (+100 each)
  const restockSelectedNow = async () => {
    console.log("Debug");
    const updatedPromises = inventoryItems.map(async item => {
      if (restockSelected[item.id]) {
        const newQty = item.quantity + 100;
        console.log(`SQL: UPDATE inventory SET quantity=${newQty} WHERE name='${item.name}';`);

        const updateResp = await apiFetch('/inventory-board', {
          method: 'PUT',
          headers: {"Content-Type": "application/json"},
          body: JSON.stringify({...item, quantity: newQty})
				});

				if (!updateResp.ok) {
					console.error('Failed to add item into inventory board');
					throw new Error('Failed to add item into inventory board');
				}	

        console.log("HI");
				const data = await updateResp.json();
        return { ...item, quantity: data.quantity };
      }
      return item;
    });

    const updated = await Promise.all(updatedPromises);
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

      // If an image file was selected for the main item, attempt upload now
      try {
        const serverMainId = (foodResp && foodResp.item && foodResp.item.id) ? foodResp.item.id : null;
        if (newMainImageFile && serverMainId) {
          await uploadImageForFoodId(serverMainId, newMainImageFile);
        } else if (newMainImageFile && !serverMainId) {
          console.warn('Image selected but server did not return a food id; skipping upload.');
          setImageUploadMessage('Could not upload image: no food id from server');
        }
      } catch (e) {
        console.error('Failed to upload main item image:', e);
      }

      let summary = `Added ${addedCount} inventory item(s).`;
      if (skippedCount > 0) summary += ` Skipped ${skippedCount} existing item(s): ${skippedItems.join(', ')}.`;
      generateMainItemMessage(summary);
      setBulkInventoryText('');

  // Reset/add UI state for main item by calling addMainItem to refresh local list
  // We set linkInventory:false because bulkAddInventory already handled linking
    } finally {
      setBulkLoading(false);
    }
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


  const generateMainItemMessage = (msg) => {
    setMainItemMessage(msg);
    // optionally clear after a few seconds
    setTimeout(() => setMainItemMessage(''), 5000);
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
                    <tr><th>Name</th><th>Price</th><th>Number of Entrees</th><th>Number of Sides</th></tr>
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
                    <tr><th>Image</th><th>Name</th><th>Price</th><th>Enabled</th><th>Actions</th></tr>
                  </thead>
                  <tbody>
                  {appetizers
                  .slice((appetizersPage - 1) * appetizersPerPage, appetizersPage * appetizersPerPage)
                  .map(item => (
                      <tr key={item.id}>
                        <td style={{ width: 100 }}>
                          {appetizerImages[item.id] ? (
                            <img src={appetizerImages[item.id]} alt={item.name} style={{ width: 80, height: 60, objectFit: 'cover', borderRadius: 4 }} />
                          ) : (
                            <div style={{ width: 80, height: 60, background: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#666', borderRadius: 4 }}>No Image</div>
                          )}
                          <div style={{ marginTop: 6, display: 'flex', flexDirection: 'column', gap: 6 }}>
                            <input type="file" accept="image/*" onChange={e => handleAppPerRowFileChange(item.id, e.target.files && e.target.files[0] ? e.target.files[0] : null)} />
                            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                              <button className="add-new-btn" onClick={() => handleAppRowUpload(item.id)} disabled={!!appPerRowUploading[item.id]}>{appPerRowUploading[item.id] ? 'Uploading...' : 'Upload'}</button>
                              {appPerRowMessages[item.id] && <span style={{ fontSize: 12 }}>{appPerRowMessages[item.id]}</span>}
                            </div>
                          </div>
                        </td>
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
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <button 
                      className="add-new-btn" 
                      onClick={() => setAppetizersPage(p => Math.max(1, p - 1))}
                      disabled={appetizersPage === 1}
                    >
                      ← Previous
                    </button>
                    <span style={{ fontSize: '0.9rem', color: '#666' }}>
                      Page {appetizersPage} of {Math.ceil(appetizers.length / appetizersPerPage)}
                    </span>
                    <button 
                      className="add-new-btn" 
                      onClick={() => setAppetizersPage(p => Math.min(Math.ceil(appetizers.length / appetizersPerPage), p + 1))}
                      disabled={appetizersPage >= Math.ceil(appetizers.length / appetizersPerPage)}
                    >
                      Next →
                    </button>
                  </div>
                  <span style={{ fontSize: '0.9rem', color: '#666' }}>
                    Showing {((appetizersPage - 1) * appetizersPerPage) + 1}-{Math.min(appetizersPage * appetizersPerPage, appetizers.length)} of {appetizers.length}
                  </span>
                </div>
              </div>

              {/* Main Items Table */}
              <div>
                <h4>Main Items</h4>
                <table className="manager-table">
                  <thead>
                    <tr><th>Image</th><th>Name</th>{/*<th>Price</th>*/}<th>Premium</th><th>Enabled</th><th>Side</th><th>Actions</th></tr>
                  </thead>
                  <tbody>
                  {mainItems
                    .slice((mainItemsPage - 1) * mainItemsPerPage, mainItemsPage * mainItemsPerPage)
                    .map(item => (
                      <tr key={item.id}>
                        <td style={{ width: 100 }}>
                          {mainItemImages[item.id] ? (
                            <img src={mainItemImages[item.id]} alt={item.name} style={{ width: 80, height: 60, objectFit: 'cover', borderRadius: 4 }} />
                          ) : (
                            <div style={{ width: 80, height: 60, background: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#666', borderRadius: 4 }}>No Image</div>
                          )}
                          <div style={{ marginTop: 6, display: 'flex', flexDirection: 'column', gap: 6 }}>
                            <input type="file" accept="image/*" onChange={e => handlePerRowFileChange(item.id, e.target.files && e.target.files[0] ? e.target.files[0] : null)} />
                            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                              <button className="add-new-btn" onClick={() => handleRowUpload(item.id)} disabled={!!perRowUploading[item.id]}>{perRowUploading[item.id] ? 'Uploading...' : 'Upload'}</button>
                              {perRowMessages[item.id] && <span style={{ fontSize: 12 }}>{perRowMessages[item.id]}</span>}
                            </div>
                          </div>
                        </td>
                        <td>
                          {editingCell.list === 'main' && editingCell.id === item.id && editingCell.field === 'name' ? (
                            <input type="text" value={editValue} onChange={e=>setEditValue(e.target.value)} onBlur={() => handlePriceSave('main', item.id, 'name')} onKeyPress={(e)=>e.key==='Enter' && handlePriceSave('main', item.id, 'name')} autoFocus className="edit-input" />
                          ) : (
                            <span onDoubleClick={() => handlePriceEdit('main', item.id, 'name')}>{item.name}</span>
                          )}
                        </td>
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
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <button 
                        className="add-new-btn" 
                        onClick={() => setMainItemsPage(p => Math.max(1, p - 1))}
                        disabled={mainItemsPage === 1}
                      >
                        ← Previous
                      </button>
                      <span style={{ fontSize: '0.9rem', color: '#666' }}>
                        Page {mainItemsPage} of {Math.ceil(mainItems.length / mainItemsPerPage)}
                      </span>
                      <button 
                        className="add-new-btn" 
                        onClick={() => setMainItemsPage(p => Math.min(Math.ceil(mainItems.length / mainItemsPerPage), p + 1))}
                        disabled={mainItemsPage >= Math.ceil(mainItems.length / mainItemsPerPage)}
                      >
                        Next →
                      </button>
                    </div>
                    <span style={{ fontSize: '0.9rem', color: '#666' }}>
                      Showing {((mainItemsPage - 1) * mainItemsPerPage) + 1}-{Math.min(mainItemsPage * mainItemsPerPage, mainItems.length)} of {mainItems.length}
                    </span>
                  </div>
                </div>
              </div>
            </div>
        </div>

      {/* Add forms to mirror JavaFX inventory controls */}
      <div className="inventory-section">
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
          {/* Image upload for main item */}
          <input type="file" accept="image/*" onChange={e => setNewMainImageFile(e.target.files && e.target.files[0] ? e.target.files[0] : null)} />
          <button className="add-new-btn" onClick={handleUploadImageClick} disabled={imageUploading}>{imageUploading ? 'Uploading...' : 'Upload Image'}</button>
          {imageUploadMessage && <div style={{ marginLeft: '0.5rem' }}>{imageUploadMessage}</div>}
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
          <button className="restock-btn" onClick={restockSelectedNow} style={{ marginLeft: '0.5rem' }}>
            Restock Selected (+100)
          </button>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', padding: '0.25rem 0.5rem', background: applyThresholdFilter ? '#e3f2fd' : 'transparent', borderRadius: '4px', border: applyThresholdFilter ? '1px solid #2196f3' : '1px solid #ddd' }}>
              <input type="checkbox" checked={applyThresholdFilter} onChange={toggleApplyThreshold} style={{ cursor: 'pointer' }} />
              <span style={{ fontWeight: applyThresholdFilter ? '600' : '400', color: applyThresholdFilter ? '#1976d2' : '#666' }}>Show only items below threshold:</span>
            </label>
            <input 
              type="number" 
              className="threshold-input" 
              value={lowStockThreshold} 
              onChange={e=>setLowStockThreshold(parseInt(e.target.value||0))} 
              style={{ width: 90 }}
              placeholder="Threshold" 
            />
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
                  .sort((a, b) => {
                    if (applyThresholdFilter) {
                      const aIsLow = a.quantity <= lowStockThreshold;
                      const bIsLow = b.quantity <= lowStockThreshold;
                      if (aIsLow && !bIsLow) return -1;
                      if (!aIsLow && bIsLow) return 1;
                      return a.quantity - b.quantity;
                    }
                    return 0;
                  })
                  .slice((inventoryPage - 1) * inventoryPerPage, inventoryPage * inventoryPerPage)
                  .map(item => (
                <tr key={item.id} className={item.quantity <= lowStockThreshold ? 'low-stock' : ''}>
                  <td style={{ width: 80 }}>
                    <input type="checkbox" checked={!!restockSelected[item.id]} onChange={() => toggleRestockSelect(item.id)} />
                  </td>
                  <td>{item.name}</td>
                  <td>
                    <span className="quantity-display">{item.quantity}</span>
                    {item.quantity <= lowStockThreshold && <span className="low-stock-warning">Low Stock</span>}
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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <button 
                      className="add-new-btn" 
                      onClick={() => setInventoryPage(p => Math.max(1, p - 1))}
                      disabled={inventoryPage === 1}
                    >
                      ← Previous
                    </button>
                    <span style={{ fontSize: '0.9rem', color: '#666' }}>
                      Page {inventoryPage} of {Math.ceil(inventoryItems.filter(item => !applyThresholdFilter || item.quantity <= lowStockThreshold).length / inventoryPerPage)}
                    </span>
                    <button 
                      className="add-new-btn" 
                      onClick={() => setInventoryPage(p => Math.min(Math.ceil(inventoryItems.filter(item => !applyThresholdFilter || item.quantity <= lowStockThreshold).length / inventoryPerPage), p + 1))}
                      disabled={inventoryPage >= Math.ceil(inventoryItems.filter(item => !applyThresholdFilter || item.quantity <= lowStockThreshold).length / inventoryPerPage)}
                    >
                      Next →
                    </button>
                  </div>
                  <span style={{ fontSize: '0.9rem', color: '#666' }}>
                    Showing {((inventoryPage - 1) * inventoryPerPage) + 1}-{Math.min(inventoryPage * inventoryPerPage, inventoryItems.filter(item => !applyThresholdFilter || item.quantity <= lowStockThreshold).length)} of {inventoryItems.filter(item => !applyThresholdFilter || item.quantity <= lowStockThreshold).length}
                  </span>
                </div>
            </div>
      </div>
    </div>
  );
}
