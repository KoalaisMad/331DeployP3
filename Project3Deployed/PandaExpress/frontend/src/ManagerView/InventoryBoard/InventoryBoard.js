import React, { useState, useEffect } from "react";
import "./InventoryBoard.css";
// Initially empty; real data is fetched from backend /api/inventory
const INITIAL_ITEMS = [];

export default function InventoryBoard({ onBackToInventory }) {
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

	const removeItem = (id) => {
		const removed = items.find(it => it.id === id);
		setItems(prev => prev.filter(i => i.id !== id));
		console.log(`SQL: DELETE FROM inventory WHERE id=${id} OR name='${removed?.name}';`);
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

	const handleUpdateAll = () => {
		
		items.forEach(i => {
			console.log(`SQL: UPDATE inventory SET quantity=${i.quantity} WHERE id=${i.id} -- name='${i.name}';`);
		});
		alert('Inventory updated - MOCK!!!. SQL logged to console.');
	};

	const addItem = () => {
		const name = (newName || '').trim();
		const qty = parseInt(newQty || '0', 10);
		const status = newStatus || 'In Stock';
		if (!name) {
			alert('Please enter a valid item name');
			return;
		}
		if (isNaN(qty) || qty < 0) {
			alert('Please enter a valid non-negative quantity');
			return;
		}
		const nextId = items.length ? Math.max(...items.map(i => i.id)) + 1 : 1;
		const created = { id: nextId, name, quantity: qty, status };
		setItems(prev => [created, ...prev]);
		console.log(`SQL: INSERT INTO inventory (id, name, quantity, status) VALUES (${created.id}, '${created.name}', ${created.quantity}, '${created.status}');`);
		setNewName('');
		setNewQty('');
		setNewStatus('In Stock');
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
				<select className="add-select" value={newStatus} onChange={e => setNewStatus(e.target.value)}>
					<option>In Stock</option>
					<option>Low</option>
					<option>Running Low</option>
				</select>
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
