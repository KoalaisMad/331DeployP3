import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './KitchenBoard.css';
import API_URL from '../../config';

function KitchenBoard() {
  const navigate = useNavigate();
  const [currentOrders, setCurrentOrders] = useState([]);
  const [pastOrders, setPastOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    initializeDatabase();
    loadOrders();
    // Refresh orders every 10 seconds
    const interval = setInterval(loadOrders, 10000);
    return () => clearInterval(interval);
  }, []);

  const initializeDatabase = async () => {
    try {
      console.log('Initializing kitchen board database...');
      const response = await fetch(`${API_URL}/api/kitchen/init-db`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Database initialized:', result);
      } else {
        console.error('Failed to initialize database');
      }
    } catch (error) {
      console.error('Error initializing database:', error);
    }
  };

  const loadOrders = async () => {
    try {
      console.log('Fetching kitchen orders from API...');
      const response = await fetch(`${API_URL}/api/kitchen/orders');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Received data:', data);
      
      // Log sides for debugging
      if (data.currentOrders && data.currentOrders.length > 0) {
        data.currentOrders.forEach(order => {
          console.log(`Order #${order.id} sides:`, order.sides);
        });
      }
      
      setCurrentOrders(data.currentOrders || []);
      setPastOrders(data.pastOrders || []);
      setError(null);
      setLoading(false);
    } catch (error) {
      console.error('Failed to load kitchen orders:', error);
      setError('Failed to load orders. Please try again.');
      setLoading(false);
    }
  };

  const completeOrder = async (orderId) => {
    try {
      console.log('Completing order:', orderId);
      const response = await fetch(`${API_URL}/api/kitchen/complete-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId })
      });

      if (response.ok) {
        console.log('Order completed successfully');
        await loadOrders(); 
      } else {
        const errorData = await response.json();
        console.error('Failed to complete order:', errorData);
        alert(`Failed to complete order: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Failed to complete order:', error);
      alert('Failed to complete order. Please try again.');
    }
  };

  const cancelOrder = async (orderId) => {
    if (!window.confirm(`Are you sure you want to cancel order #${orderId}?`)) {
      return;
    }

    try {
      console.log('Canceling order:', orderId);
      const response = await fetch(`${API_URL}/api/kitchen/cancel-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId })
      });

      if (response.ok) {
        console.log('Order canceled successfully');
        await loadOrders(); 
      } else {
        const errorData = await response.json();
        console.error('Failed to cancel order:', errorData);
        alert(`Failed to cancel order: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Failed to cancel order:', error);
      alert('Failed to cancel order. Please try again.');
    }
  };

  const remakeOrder = async (orderId) => {
    try {
      console.log('Remaking order:', orderId);
      const response = await fetch(`${API_URL}/api/kitchen/remake-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId })
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Order remade successfully as order #', result.newOrderId);
        alert(`Order remade successfully! New order #${result.newOrderId}`);
        await loadOrders();
      } else {
        const errorData = await response.json();
        console.error('Failed to remake order:', errorData);
        alert(`Failed to remake order: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Failed to remake order:', error);
      alert('Failed to remake order. Please try again.');
    }
  };

  const markIncomplete = async (orderId) => {
    try {
      console.log('Marking order as incomplete:', orderId);
      const response = await fetch(`${API_URL}/api/kitchen/incomplete-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId })
      });

      if (response.ok) {
        console.log('Order marked as incomplete successfully');
        // Reload orders
        await loadOrders(); 
      } else {
        const errorData = await response.json();
        console.error('Failed to mark order as incomplete:', errorData);
        alert(`Failed to mark order as incomplete: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Failed to mark order as incomplete:', error);
      alert('Failed to mark order as incomplete. Please try again.');
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  const getOrderColor = (index, totalOrders) => {
    if (totalOrders === 1) return 'orange';
    
    const ratio = index / (totalOrders - 1);
    
    if (ratio < 0.33) return 'red'; //RED (most urgent)
    if (ratio < 0.66) return 'orange'; // ORANGE
    return 'yellow'; // YELLOW (least urgent)
  };

  const getOrderOpacity = (timestamp, totalOrders, currentIndex) => {
    return 1.0;
  };

  if (loading) {
    return <div className="kitchen-board-loading">Loading kitchen orders...</div>;
  }

  if (error) {
    return (
      <div className="kitchen-board-error">
        <h2>Error Loading Orders</h2>
        <p>{error}</p>
        <button onClick={loadOrders} className="btn-retry">Retry</button>
      </div>
    );
  }

  return (
    <div className="kitchen-board-container">
      <div className="kitchen-board-header">
        <h1>Current Orders</h1>
        <div className="kitchen-board-actions">
          <button 
            className="btn-return-manager"
            onClick={() => window.close()}
          >
            Close Window
          </button>
          <button 
            className="btn-translation"
            onClick={() => navigate('/')}
          >
            Home
          </button>
        </div>
      </div>

      <div className="current-orders-grid">
        {currentOrders.length === 0 ? (
          <div className="no-orders">No current orders</div>
        ) : (
          currentOrders.map((order, index) => (
            <div 
              key={order.id} 
              className={`order-card ${getOrderColor(index, currentOrders.length)}`}
              style={{ opacity: getOrderOpacity(order.timestamp, currentOrders.length, index) }}
            >
              <div className="order-card-header">
                Order #{order.id} - In Progress
              </div>
              <div className="order-card-body">
                <div className="order-content">
                  {order.combos && order.combos.length > 0 ? (
                    order.combos.map((combo, comboIdx) => (
                      <div key={`combo-${comboIdx}`} className="combo-section">
                        <div className="order-size">
                          <strong>{combo.size}</strong>
                        </div>

                        {combo.entrees && combo.entrees.length > 0 && (
                          <div className="order-section">
                            <strong>{combo.entrees.length > 1 ? 'Entrees:' : 'Entree:'}</strong>
                            {combo.entrees.map((entree, idx) => (
                              <div key={idx} className="order-item">{entree}</div>
                            ))}
                          </div>
                        )}

                        {combo.sides && combo.sides.length > 0 && (
                          <div className="order-section">
                            <strong>{combo.sides.length > 1 ? 'Sides:' : 'Side:'}</strong>
                            {combo.sides.map((side, idx) => (
                              <div key={idx} className="order-item">{side}</div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="order-size">
                      <strong>No combos</strong>
                    </div>
                  )}

                  <div className="order-time">{formatTime(order.timestamp)}</div>

                  {order.appetizers && order.appetizers.length > 0 && (
                    <div className="order-section appetizers-section">
                      <strong>Appetizers:</strong>
                      {order.appetizers.map((app, idx) => (
                        <div key={idx} className="order-item">{app}</div>
                      ))}
                    </div>
                  )}

                  {order.drinks && order.drinks.length > 0 && (
                    <div className="order-section drinks-section">
                      <strong>{order.drinks.length > 1 ? 'Drinks:' : 'Drink:'}</strong>
                      {order.drinks.map((drink, idx) => (
                        <div key={idx} className="order-item">{drink}</div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="order-actions">
                  <button 
                    className="btn-complete"
                    onClick={() => completeOrder(order.id)}
                  >
                    Complete
                  </button>
                  <button 
                    className="btn-cancel"
                    onClick={() => cancelOrder(order.id)}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="past-orders-section">
        <h2>Past Orders</h2>
        <div className="past-orders-grid">
          {pastOrders.length === 0 ? (
            <div className="no-orders">No past orders</div>
          ) : (
            pastOrders.map((order, index) => (
              <div 
                key={order.id} 
                className="order-card grey completed"
                style={{ opacity: 1 }}
              >
                <div className="order-card-header">
                  Order #{order.id} - {order.status === 'canceled' ? 'Canceled' : 'Completed'}
                </div>
                <div className="order-card-body">
                  <div className="order-content">
                    {order.combos && order.combos.length > 0 ? (
                      order.combos.map((combo, comboIdx) => (
                        <div key={`combo-${comboIdx}`} className="combo-section">
                          <div className="order-size">
                            <strong>{combo.size}</strong>
                          </div>

                          {combo.entrees && combo.entrees.length > 0 && (
                            <div className="order-section">
                              <strong>{combo.entrees.length > 1 ? 'Entrees:' : 'Entree:'}</strong>
                              {combo.entrees.map((entree, idx) => (
                                <div key={idx} className="order-item">{entree}</div>
                              ))}
                            </div>
                          )}

                          {combo.sides && combo.sides.length > 0 && (
                            <div className="order-section">
                              <strong>{combo.sides.length > 1 ? 'Sides:' : 'Side:'}</strong>
                              {combo.sides.map((side, idx) => (
                                <div key={idx} className="order-item">{side}</div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="order-size">
                        <strong>No combos</strong>
                      </div>
                    )}

                    <div className="order-time">{formatTime(order.timestamp)}</div>

                    {order.appetizers && order.appetizers.length > 0 && (
                      <div className="order-section appetizers-section">
                        <strong>Appetizers:</strong>
                        {order.appetizers.map((app, idx) => (
                          <div key={idx} className="order-item">{app}</div>
                        ))}
                      </div>
                    )}

                    {order.drinks && order.drinks.length > 0 && (
                      <div className="order-section drinks-section">
                        <strong>{order.drinks.length > 1 ? 'Drinks:' : 'Drink:'}</strong>
                        {order.drinks.map((drink, idx) => (
                          <div key={idx} className="order-item">{drink}</div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="order-actions">
                    <button 
                      className="btn-in-progress"
                      onClick={() => markIncomplete(order.id)}
                    >
                      In Progress
                    </button>
                    <button 
                      className="btn-remake"
                      onClick={() => remakeOrder(order.id)}
                    >
                      Remake
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default KitchenBoard;
