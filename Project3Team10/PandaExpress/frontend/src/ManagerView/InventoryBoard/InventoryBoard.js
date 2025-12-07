import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./InventoryBoard.css";
import API_URL from '../../config';
// Initially empty; real data is fetched from backend /api/inventory
const INITIAL_ITEMS = [];

export default function InventoryBoard({ onBackToInventory }) {
	const navigate = useNavigate();

	async function apiFetch(path, options = {}) {
		return fetch(`${API_URL}${path}`, options);
	}

	const [items, setItems] = useState(INITIAL_ITEMS.map(i => ({ ...i })));
	const [editingQtyId, setEditingQtyId] = useState(null);
	const [editingQtyValue, setEditingQtyValue] = useState('');
	const [editingNameId, setEditingNameId] = useState(null);
	const [editingNameValue, setEditingNameValue] = useState('');
	const [editingWetDryId, setEditingWetDryId] = useState(null);
	const [editingWetDryValue, setEditingWetDryValue] = useState('');
	const [editingSupId, setEditingSupId] = useState(null);
	const [editingSupValue, setEditingSupValue] = useState('');
	const [newName, setNewName] = useState('');
	const [newQty, setNewQty] = useState('');
	const [newStatus, setNewStatus] = useState('Dry');
	const [newSupplier, setNewSupplier] = useState('');

	// Fetch actual inventory items from server when component mounts
	useEffect(() => {
		let mounted = true;
		const fetchInventory = async () => {
			try {
				const resp = await apiFetch('/api/inventory');
				if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
				const data = await resp.json();
			if (!mounted) return;
			setItems((data || []).map(d => ({
					...d,
					quantity: Number(d.quantity),
					// map wet column to string
			
					wet: d.wet
				  })));
			} catch (err) {
				console.error('Failed to fetch inventory from server:', err);
			}
		};
		fetchInventory();
		return () => { mounted = false; };
	}, []);


	// Get CSS class for status badge
	const getStatusClass = (status) => {
		switch (status) {
			case "Running Low":
				return "status-badge running-low";
			case "Low":
				return "status-badge low";
			case "In Stock":
			default:
				return "status-badge in-stock";
		}
	};

	// Remove item from inventory
	const removeItem = async (id) => {
		try{
			const removed = items.find(it => it.id === id);			

			// Fetch for response following removal of item
			const removeResp = await apiFetch('/inventory-board', {
				method: 'DELETE',
				headers: {'Content-Type': 'application/json'},
				body: JSON.stringify(removed)
			}) 

			if(!removeResp.ok) {
				throw new Error('Could not remove inventory item from inventory board');
			}

			const data = await removeResp.json();

			setItems(prev => prev.filter(i => i.id !== id));

			console.log(`SQL: DELETE FROM inventory WHERE id=${id} OR name='${removed?.name}';`);
			console.log(data.message);


		} catch (err) {
			console.error(err);
		}
	};


	const startEditQty = (id, current) => {
		setEditingQtyId(id);
		setEditingQtyValue(String(current));
	};

	// Save edited quantity for an item
	const saveQty = async (id) => {
		const parsed = parseInt(editingQtyValue || '0', 10);
		setItems(prev => prev.map(i => i.id === id ? { ...i, quantity: parsed } : i));
		
		const item = items.find(i => i.id === id);
		if (item) {
			const wetBool = item.wet === 'Wet' ? true : false;
			try {
				const updateResp = await apiFetch('/inventory-board', {
					method: 'PUT',
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						id: item.id,
						name: item.name,
						quantity: parsed,
						wet: wetBool,
						supplier: item.supplier
					})
				});
				if (!updateResp.ok) throw new Error('Failed to update quantity');
			} catch (err) {
				console.error('Error saving quantity:', err);
				alert('Failed to save quantity');
			}
		}
		setEditingQtyId(null);
		setEditingQtyValue('');
	};

	const startEditName = (id, current) => {
		setEditingNameId(id);
		setEditingNameValue(current);
	};

	const saveName = async (id) => {
		const trimmed = editingNameValue.trim();
		if (!trimmed) {
			alert('Item name cannot be empty');
			return;
		}
		setItems(prev => prev.map(i => i.id === id ? { ...i, name: trimmed } : i));
		
		const item = items.find(i => i.id === id);
		if (item) {
			const wetBool = item.wet === 'Wet' ? true : false;
			try {
				const updateResp = await apiFetch('/inventory-board', {
					method: 'PUT',
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						id: item.id,
						name: trimmed,
						quantity: item.quantity,
						wet: wetBool,
						supplier: item.supplier
					})
				});
				if (!updateResp.ok) throw new Error('Failed to update name');
			} catch (err) {
				console.error('Error saving name:', err);
				alert('Failed to save name');
			}
		}
		setEditingNameId(null);
		setEditingNameValue('');
	};

	const startEditWetDry = (id, current) => {
		setEditingWetDryId(id);
		setEditingWetDryValue(current);
	};

	const saveWetDry = async (id) => {
		setItems(prev => prev.map(i => i.id === id ? { ...i, wet: editingWetDryValue } : i));
		
		const item = items.find(i => i.id === id);
		if (item) {
			const wetBool = editingWetDryValue === 'Wet' ? true : false;
			try {
				const updateResp = await apiFetch('/inventory-board', {
					method: 'PUT',
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						id: item.id,
						name: item.name,
						quantity: item.quantity,
						wet: wetBool,
						supplier: item.supplier
					})
				});
				if (!updateResp.ok) throw new Error('Failed to update wet/dry');
			} catch (err) {
				console.error('Error saving wet/dry:', err);
				alert('Failed to save wet/dry');
			}
		}
		setEditingWetDryId(null);
		setEditingWetDryValue('');
	};

	const startEditSupplier = (id, current) => {
		setEditingSupId(id);
		setEditingSupValue(current);
	};

	const saveSupplier = async (id) => {
		const trimmed = editingSupValue.trim();
		setItems(prev => prev.map(i => i.id === id ? { ...i, supplier: trimmed } : i));
		
		const item = items.find(i => i.id === id);
		if (item) {
			const wetBool = item.wet === 'Wet' ? true : false;
			try {
				const updateResp = await apiFetch('/inventory-board', {
					method: 'PUT',
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						id: item.id,
						name: item.name,
						quantity: item.quantity,
						wet: wetBool,
						supplier: trimmed
					})
				});
				if (!updateResp.ok) throw new Error('Failed to update supplier');
			} catch (err) {
				console.error('Error saving supplier:', err);
				alert('Failed to save supplier');
			}
		}
		setEditingSupId(null);
		setEditingSupValue('');
	};


	// Update all items to backend
	const handleUpdateAll = async () => {
		try{
			const updatedItemsPromise = items.map(async item => {
				const wetBool = item.wet === 'Wet' ? true : false;
			  
				const updateData = { 
					id: item.id,
					name: item.name,
					quantity: item.quantity,
					wet: wetBool,
					supplier: item.supplier 
				};
				
				console.log('Sending update for item:', updateData);
				
				const updateResp = await apiFetch('/inventory-board', {
				  method: 'PUT',
				  headers: { "Content-Type": "application/json" },
				  body: JSON.stringify(updateData)
				});
			  
				if (!updateResp.ok) {
					const errorText = await updateResp.text();
					console.error('Update failed:', errorText);
					throw new Error('Failed to update inventory item');
				}
			  
				const data = await updateResp.json();
				console.log('Received response:', data);
				return { ...item, status: data.status, wet: data.wet, name: data.name, supplier: data.supplier };
			});
			// Need to wait for actual result
			const updatedItems = await Promise.all(updatedItemsPromise);
			setItems(updatedItems);
			alert('All changes saved successfully!');
			console.log('Render complete');	
		}
	  catch (err) {
			console.error('In catch clause: failed to update item(s) to inventory board', err);
			alert('Failed to save changes. Please try again.');
		}
	};
	

	// Add new item to inventory
	const addItem = async () => {
		try{
			const name = (newName || '').trim();
			const qty = parseInt(newQty || '0', 10);
			// const status = newStatus || 'In Stock';
			if (!name) {
				alert('Please enter a valid item name');
				return;
			}
			if (isNaN(qty) || qty < 0) {
				alert('Please enter a valid non-negative quantity');
				return;
			}
			// Database generates ID
			// const nextId = items.length ? Math.max(...items.map(i => i.id)) + 1 : 1;

			const createdItem = { 
				name, 
				quantity: qty, 
				wet: newStatus === 'Wet', // true if Wet, false if Dry
				supplier: newSupplier.trim() || 'N/A'
			};


			const addResp = await apiFetch('/inventory-board', {
				method: "POST",
				headers: {"Content-Type": "application/json"},
         		body: JSON.stringify(createdItem)
			})

			if (!addResp.ok) {
				console.error('Failed to add item into inventory board');
				throw new Error('Failed to add item into inventory board');
				
			}

			const data = await addResp.json();

			const newItem = ({...createdItem, id: data.id, status: data.status, wet: data.wet});

			setItems(prev => [newItem, ...prev]);
			console.log(`SQL: INSERT INTO inventory (name, quantity) VALUES ('${newItem.name}', ${newItem.quantity});`);
			setNewName('');
			setNewQty('');
			setNewStatus('In Stock');
			setNewSupplier('');
		}
		catch(err) {
			console.error('In catch clause: failed to add item to inventory board');
			return;
		}
	};

	return (
		<div className="inventory-page full-viewport">
			{/* Header Section */}
			<header className="inventory-header">
				<h1 className="inventory-title">Inventory Board</h1>

				<div className="inventory-header-actions">
					<button 
						className="btn-close-window"
						onClick={() => window.close()}
					>
						Close Window
					</button>
					<button 
						className="btn-home"
						onClick={() => navigate('/')}
					>
						Home
					</button>
				</div>
			</header>

			{/* Add Item Form */}
			<div className="add-form">
				<input
					className="add-input"
					placeholder="Item name"
					value={newName}
					onChange={e => setNewName(e.target.value)}
				/>
				<input
					className="add-input"
					placeholder="Quantity"
					value={newQty}
					onChange={e => setNewQty(e.target.value)}
				/>
				<select
					className="add-input"
					value={newStatus}
					onChange={e => setNewStatus(e.target.value)}
				>
					<option value="Dry">Dry</option>
					<option value="Wet">Wet</option>
				</select>
				<input
					className="add-input"
					placeholder="Supplier"
					value={newSupplier}
					onChange={e => setNewSupplier(e.target.value)}
				/>
				<button className="btn-add" onClick={addItem}>Add Item</button>
			</div>

			
			{/* Column Headers */}
			<div className="inventory-columns">
				<span className="col-item">Item</span>
				<span className="col-wetdry">Wet/Dry</span>
				<span className="col-supplier">Supplier</span>
				<span className="col-quantity">Status</span>
				<span className="col-quantity">Quantity</span>
				<span className="col-action">Action</span>
			</div>

			
			{/* Inventory List */}
			<div className="inventory-list scrollable">
				{items.map((item) => (
				<div key={item.id} className="inventory-row">
				<div className="row-item">
				  <div className="item-dot" />
				  {editingNameId === item.id ? (
					<input
					  className="name-input"
					  value={editingNameValue}
					  onChange={e => setEditingNameValue(e.target.value)}
					  onBlur={() => saveName(item.id)}
					  onKeyDown={e => e.key === 'Enter' && saveName(item.id)}
					  autoFocus
					/>
				  ) : (
					<span className="item-name" onDoubleClick={() => startEditName(item.id, item.name)}>{item.name}</span>
				  )}
				</div>				<div className="row-wetdry">
				  {editingWetDryId === item.id ? (
					<select
					  className="wetdry-select"
					  value={editingWetDryValue}
					  onChange={e => setEditingWetDryValue(e.target.value)}
					  onBlur={() => saveWetDry(item.id)}
					  onKeyDown={e => e.key === 'Enter' && saveWetDry(item.id)}
					  autoFocus
					>
					  <option value="Wet">Wet</option>
					  <option value="Dry">Dry</option>
					</select>
				  ) : (
					<span onDoubleClick={() => startEditWetDry(item.id, item.wet)}>{item.wet}</span>
				  )}
				</div>				<div className="row-supplier">
				  {editingSupId === item.id ? (
					<input
					  className="supplier-input"
					  value={editingSupValue}
					  onChange={e => setEditingSupValue(e.target.value)}
					  onBlur={() => saveSupplier(item.id)}
					  onKeyDown={e => e.key === 'Enter' && saveSupplier(item.id)}
					  autoFocus
					/>
				  ) : (
					<span onDoubleClick={() => startEditSupplier(item.id, item.supplier)}>{item.supplier || 'N/A'}</span>
				  )}
				</div>					<div className="row-status">
					<span className={getStatusClass(item.status)}>
						{item.status}
					</span>
					</div>
										
					<div className="row-quantity">
					  {editingQtyId === item.id ? (
						<input
						  className="quantity-input"
						  value={editingQtyValue}
						  onChange={e => setEditingQtyValue(e.target.value)}
						  onBlur={() => saveQty(item.id)}
						  onKeyDown={e => e.key === 'Enter' && saveQty(item.id)}
						  autoFocus
						/>
					  ) : (
						<div className="quantity-box" onDoubleClick={() => startEditQty(item.id, item.quantity)}>
						  {item.quantity}
						</div>
					  )}
					</div>
				  
					<div className="row-action">
					  <button className="btn-remove" onClick={() => removeItem(item.id)}>Remove</button>
					</div>
				  </div>
				 
				))}
			</div>

			{/* Update Button */}
			<div className="update-wrapper">
				<button className="btn-update" onClick={handleUpdateAll}>Update</button>
			</div>
		</div>
	);
}
