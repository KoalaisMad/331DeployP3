import React, { useState, useEffect } from "react";
import "./InventoryBoard.css";
// Initially empty; real data is fetched from backend /api/inventory
const INITIAL_ITEMS = [];

export default function InventoryBoard({ onBackToInventory }) {

	const API_BASE = 'http://localhost:5000/api';

	async function apiFetch(path, options = {}) {
		return fetch(`${API_BASE}${path}`, options);
	}

	const [items, setItems] = useState(INITIAL_ITEMS.map(i => ({ ...i })));
	const [editingQtyId, setEditingQtyId] = useState(null);
	const [editingQtyValue, setEditingQtyValue] = useState('');
	const [newName, setNewName] = useState('');
	const [newQty, setNewQty] = useState('');
	const [newStatus, setNewStatus] = useState('In Stock');

	// Fetch actual inventory items from server when component mounts
	useEffect(() => {
		let mounted = true;
		const fetchInventory = async () => {
			try {
				const resp = await fetch('/api/inventory');
				if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
				const data = await resp.json();
				if (!mounted) return;
				// Ensure quantities are numeric
				setItems((data || []).map(d => ({ ...d, quantity: Number(d.quantity) })));
			} catch (err) {
				console.error('Failed to fetch inventory from server:', err);
				// leave existing items (mock/fallback) intact
			}
		};
		fetchInventory();
		return () => { mounted = false; };
	}, []);

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

	const saveQty = (id) => {
		const parsed = parseInt(editingQtyValue || '0', 10);
		setItems(prev => prev.map(i => i.id === id ? { ...i, quantity: parsed } : i));
		setEditingQtyId(null);
		setEditingQtyValue('');
		console.log(`SQL: UPDATE inventory SET quantity=${parsed} WHERE id=${id};`);
	};

	const handleUpdateAll = async () => {
		try{
			const updatedItemsPromise = items.map(async item => {
				console.log(`SQL: UPDATE inventory SET quantity=${item.quantity} WHERE id=${item.id} -- name='${item.name}';`);

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
				console.log(item);
				return {...item, status: data.status};
			});
			// Need to wait for actual result
			const updatedItems = await Promise.all(updatedItemsPromise);
			setItems(updatedItems);
			console.log('Render complete');	
		}
	  catch (err) {
			console.error('In catch clause: failed to update item(s) to inventory board');
		}
	};
	

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
			// No need for nextId since this is taken care in database
			// const nextId = items.length ? Math.max(...items.map(i => i.id)) + 1 : 1;

			// Don't need status
			const createdItem = {name, quantity: qty};

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

			const newItem = ({...createdItem, id: data.id, status: data.status});

			setItems(prev => [newItem, ...prev]);
			console.log(`SQL: INSERT INTO inventory (name, quantity) VALUES ('${newItem.name}', ${newItem.quantity});`);
			setNewName('');
			setNewQty('');
			setNewStatus('In Stock');
		}
		catch(err) {
			console.error('In catch clause: failed to add item to inventory board');
			return;
		}
	};

	return (
		<div className="inventory-page full-viewport">
			<header className="inventory-header">
				<h1 className="inventory-title">Inventory Board</h1>

				<div className="translation-pill">
					<span>Spanish Translation</span>
					<span className="translation-sub">(Espanol)</span>
				</div>
			</header>

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
				{/* <select className="add-select" value={newStatus} onChange={e => setNewStatus(e.target.value)}>
					<option>In Stock</option>
					<option>Low</option>
					<option>Running Low</option>
				</select> */}
				<button className="btn-add" onClick={addItem}>Add Item</button>
			</div>

			
			<div className="inventory-columns">
				<span className="col-item">Item</span>
				<span className="col-quantity">Status</span>
				<span className="col-quantity">Quantity</span>
				<span className="col-action">Action</span>
			</div>

			
			<div className="inventory-list scrollable">
				{items.map((item) => (
					<div key={item.id} className="inventory-row">
						<div className="row-left">
							<div className="item-dot" />
							<span className="item-name">{item.name}</span>
						</div>

						<div className="row-center">
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
								<div className="quantity-box" onDoubleClick={() => startEditQty(item.id, item.quantity)}>{item.quantity}</div>
							)}
						</div>

						<div className="row-action">
							<button className="btn-remove" onClick={() => removeItem(item.id)}>Remove</button>
						</div>
					</div>
				))}
			</div>

			<div className="update-wrapper">
				<button className="btn-update" onClick={handleUpdateAll}>Update</button>
			</div>
		</div>
	);
}
