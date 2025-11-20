import React, { useState, useEffect } from 'react';

const API_BASE = 'http://localhost:5000/api';

export default function ItemsSales() {
  // Product Usage (inventory) time window
  const [startDate, setStartDate] = useState('2025-11-01');
  const [endDate, setEndDate] = useState('2025-11-05');
  const [startTime, setStartTime] = useState('00:00');
  const [endTime, setEndTime] = useState('23:59');

  const [totalSales, setTotalSales] = useState(0); 
  const [totalOrders, setTotalOrders] = useState(0); 
  const [itemRevenueData, setItemRevenueData] = useState([]); 

  // usageData holds inventory consumption (units used) per inventory item
  const [usageData, setUsageData] = useState([
    { item: 'Orange Chicken', unitsUsed: 234 },
    { item: 'Fried Rice', unitsUsed: 198 },
    { item: 'Chow Mein', unitsUsed: 176 },
    { item: 'Teriyaki Chicken', unitsUsed: 145 },
    { item: 'Beijing Beef', unitsUsed: 132 },
  ]);

  // X-Report & Z-Report state variables
  const [xReportData, setXReportData] = useState([]);
  const [xReportGenerated, setXReportGenerated] = useState(false);

  const [zReportStatus, setZReportStatus] = useState('Z-Report not run today');
  const [zReportData, setZReportData] = useState([]);
  const [zReportRunToday, setZReportRunToday] = useState(false);
  
  useEffect(() => {
    checkZReportStatus();
  }, []);

  // Restock Chart - Items below threshold
  const [restockThreshold, setRestockThreshold] = useState(100);
  const [restockItems, setRestockItems] = useState([
    { id: 1, name: 'Honey Walnut Shrimp', quantity: 23, threshold: 100 },
    { id: 2, name: 'Spring Roll Wrappers', quantity: 34, threshold: 100 },
    { id: 3, name: 'Fortune Cookies', quantity: 41, threshold: 100 },
    { id: 4, name: 'Soy Sauce Packets', quantity: 45, threshold: 100 },
    { id: 5, name: 'Orange Chicken', quantity: 67, threshold: 100 },
    { id: 6, name: 'Beijing Beef', quantity: 89, threshold: 100 },
  ]);

  // Table 1: Appetizers & Premium Entrees
  const [appsData, setAppsData] = useState([
    { item: 'Spring Rolls', numPortions: 145, additionalPrice: 2.00 },
    { item: 'Cream Cheese Rangoon', numPortions: 132, additionalPrice: 2.00 },
    { item: 'Orange Chicken (Premium)', numPortions: 98, additionalPrice: 1.50 },
    { item: 'Honey Walnut Shrimp (Premium)', numPortions: 76, additionalPrice: 1.50 },
  ]);

  // Table 2: Revenue by Portion Size
  const [portionRevenueData, setPortionRevenueData] = useState([
    { portionSize: 'Bigger Plate', totalRevenue: 4532.50 },
    { portionSize: 'Plate', totalRevenue: 3821.40 },
    { portionSize: 'Bowl', totalRevenue: 2945.30 },
  ]);

  const loadData = () => {
    loadAppsAndPremium();
    loadRevenueByPortionSize();
    // check Z-report status on load
    checkZReportStatus();
    buildSummaryReport();
  };

  // X-Report: generate hourly sales (mocked until backend available)
  // Replace your existing generateXReport function in ItemsSales.js with this:

const generateXReport = async () => {
  setSummaryReport('Generating X-Report...');
  
  // Clear existing data
  setXReportData([]);
  setXReportGenerated(false);

  try {
    const response = await fetch(`${API_BASE}/reports/x-report`);
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Server returned status ${response.status}: ${errorText.substring(0, 100)}...`);
    }
    
    const data = await response.json();

    if (data.success) {
      // Update state with the hourly data
      setXReportData(data.hourlyData);
      setXReportGenerated(true);
      
      // Build the text report
      let reportText = '--- X-REPORT: HOURLY SALES ---\n';
      reportText += `Date: ${new Date().toLocaleDateString()}\n`;
      reportText += `Status: ${data.closed ? 'CLOSED (Z-Report Run)' : 'OPEN'}\n\n`;
      
      reportText += 'HOURLY BREAKDOWN (8:00 AM - 5:00 PM):\n';
      let totalSales = 0;
      data.hourlyData.forEach(item => {
        reportText += `${item.hour.padEnd(10)}: ${formatCurrency(item.sales)}\n`;
        totalSales += item.sales;
      });
      
      reportText += `\nTOTAL SALES: ${formatCurrency(totalSales)}\n`;
      
      if (data.closed) {
        reportText += '\n*** Z-Report has been run. All values are finalized. ***\n';
      }
      
      setSummaryReport(reportText);

    } else {
      setSummaryReport(`Failed to generate X-Report: ${data.error || 'Unknown error'}`);
      console.error('X-Report Generation Failed:', data.error);
    }
  } catch (error) {
    console.error('API Call Error:', error);
    setSummaryReport(`Network or Parsing Error: The API call failed. 
1. Ensure your Node.js server is running on port 5000. 
2. Check the server console for database connection errors.
Details: ${error.message}`);
  }
};

  // Z-Report: check if run today (mock)
  async function checkZReportStatus() {
    try {
      const response = await fetch(`${API_BASE}/reports/z-report-status`);
      const data = await response.json();
      
      if (data.hasRun) {
        setZReportRunToday(true);
        setZReportStatus(`Z-Report completed. Orders: ${data.totalOrders}, Sales: ${formatCurrency(data.totalSales)}`);
      } else {
        setZReportRunToday(false);
        setZReportStatus('Z-Report has not been run today.');
      }
    } catch (error) {
      console.error('Error checking Z-Report status:', error);
      setZReportStatus('Error checking Z-Report status');
    }
  }

  useEffect(() => {
    checkZReportStatus();
  }, []);
  

  async function checkZReportStatus() {
    try {
      const response = await fetch(`${API_BASE}/reports/z-report-status`);
      const data = await response.json();
      const runZReport = async () => {
        try {
          const response = await fetch(`${API_BASE}/reports/z-report`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
          });
          
          if (!response.ok) {
            const error = await response.json();
            alert(error.error || 'Failed to run Z-Report');
            return;
          }
          
          const data = await response.json();
          
          if (data.success) {
            setZReportRunToday(true);
            setZReportStatus(`Z-Report completed. Total Orders: ${data.totalOrders}, Total Sales: ${formatCurrency(data.totalSales)}`);
            
            alert(`Z-Report completed!\nOrders: ${data.totalOrders}\nSales: ${formatCurrency(data.totalSales)}`);
            
            // Refresh the X-Report to show zeros
            generateXReport();
          }
        } catch (error) {
          console.error('Error running Z-Report:', error);
          alert('Failed to run Z-Report');
        }
      };
      if (data.hasRun) {
        setZReportRunToday(true);
        setZReportStatus(`Z-Report completed. Orders: ${data.totalOrders}, Sales: ${formatCurrency(data.totalSales)}`);
        
        // Load the hourly data
        const xResponse = await fetch(`${API_BASE}/reports/x-report`);
        const xData = await xResponse.json();
        if (xData.closed) {
          setZReportData(xData.data);
        }
      } else {
        setZReportRunToday(false);
        setZReportStatus('Z-Report has not been run today.');
      }
    } catch (error) {
      console.error('Error checking Z-Report status:', error);
    }
  }

  const runZReport = async () => {
    try {
      const response = await fetch(`${API_BASE}/reports/z-report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (!response.ok) {
        const error = await response.json();
        alert(error.error || 'Failed to run Z-Report');
        return;
      }
      
      const data = await response.json();
      
      if (data.success) {
        setZReportRunToday(true);
        setZReportStatus(`Z-Report completed. Total Orders: ${data.totalOrders}, Total Sales: ${formatCurrency(data.totalSales)}`);
        
        alert(`Z-Report completed!\nOrders: ${data.totalOrders}\nSales: ${formatCurrency(data.totalSales)}`);
        
        // Refresh the X-Report to show zeros
        generateXReport();
      }
    } catch (error) {
      console.error('Error running Z-Report:', error);
      alert('Failed to run Z-Report');
    }
  };

  const clearZReport = async () => {
    try {
      const response = await fetch(`${API_BASE}/reports/z-report`, {
        method: 'DELETE'
      });
      
      const data = await response.json();
      
      setZReportData([]);
      setZReportRunToday(false);
      setZReportStatus('Z-Report has not been run today.');
      
      alert('Z-Report cleared! You can now test again.');
    } catch (error) {
      console.error('Error clearing Z-Report:', error);
      alert('Failed to clear Z-Report');
    }
  };

  // Summary report state
  const [summaryReport, setSummaryReport] = useState('');

  const buildSummaryReport = () => {
    let report = '';
    report += 'SUMMARY REPORT\n';
    report += '--------------\n';
    report += 'Peak Day: 2025-11-04  Sales: $12,453.50\n';
    report += 'Top Items: Orange Chicken, Fried Rice, Chow Mein\n';
    report += '\nLow Stock:\n- Honey Walnut Shrimp: 23\n- Spring Roll Wrappers: 34\n';
    setSummaryReport(report);
  };

  // Generate Product Usage report (inventory used between start and end)
  const generateUsageReport = () => {
    const startDateTime = `${startDate} ${startTime}:00`;
    const endDateTime = `${endDate} ${endTime}:00`;
    const sql = `
WITH food_usage AS (
  SELECT fti.inventoryid AS inventory_id, SUM(fti.servingsize) AS units
  FROM orders o
  JOIN orders_to_food_sizes ofs ON ofs.orderid = o.id
  JOIN sizes_to_food stf ON stf.id = ofs.foodsizeid
  JOIN food_to_inventory fti ON fti.foodid = stf.foodid
  WHERE o.timestamp BETWEEN '${startDateTime}' AND '${endDateTime}'
  GROUP BY fti.inventoryid
), app_usage AS (
  SELECT inv.id AS inventory_id, COUNT(*) AS units
  FROM orders o
  JOIN orders_to_appetizers_and_drinks oad ON oad.orderid = o.id
  JOIN appetizers_and_drinks ad ON ad.id = oad.appetizeranddrinkid
  JOIN inventory inv ON inv.name = ad.name
  WHERE o.timestamp BETWEEN '${startDateTime}' AND '${endDateTime}'
  GROUP BY inv.id
)
SELECT inv.name AS item, COALESCE(SUM(u.units), 0) AS units_used
FROM (
  SELECT * FROM food_usage
  UNION ALL
  SELECT * FROM app_usage
) u
JOIN inventory inv ON inv.id = u.inventory_id
GROUP BY inv.name
ORDER BY units_used DESC, inv.name;`;

    console.log('SQL - Product Usage:', sql);

    // Mocked usage data for now
    const mock = [
      { item: 'Orange Chicken', unitsUsed: 234 },
      { item: 'Fried Rice', unitsUsed: 198 },
      { item: 'Chow Mein', unitsUsed: 176 },
      { item: 'Teriyaki Chicken', unitsUsed: 145 },
      { item: 'Beijing Beef', unitsUsed: 132 },
      { item: 'Spring Rolls', unitsUsed: 87 },
      { item: 'Fortune Cookies', unitsUsed: 65 },
    ];

    setUsageData(mock);
  };

  // Fetch items below restock threshold
  const fetchRestockItems = () => {
    const sql = `
SELECT id, name, quantity
FROM inventory
WHERE quantity < ${restockThreshold}
ORDER BY quantity ASC;`;
    
    console.log('SQL - Restock Items:', sql);
    // TODO: Execute query and update restockItems when backend is ready
  };

  // Sales report (amount between arbitrary date/time range)
  const [salesStartDate, setSalesStartDate] = useState(startDate);
  const [salesStartTime, setSalesStartTime] = useState(startTime);
  const [salesEndDate, setSalesEndDate] = useState(endDate);
  const [salesEndTime, setSalesEndTime] = useState(endTime);
  const [salesTotal, setSalesTotal] = useState(null);
  const [salesOrdersCount, setSalesOrdersCount] = useState(null);
  const [salesSeries, setSalesSeries] = useState([]);

  const generateSalesReport = () => {
    (async () => {
      const startDateTime = `${salesStartDate} ${salesStartTime}:00`;
      const endDateTime = `${salesEndDate} ${salesEndTime}:00`;
      console.log('Requesting Sales Report from backend', { start: startDateTime, end: endDateTime });

      // Expecting backend endpoint like: /api/reports/sales?start=YYYY-MM-DD%20HH:MM:SS&end=...
      const params = new URLSearchParams({ start: startDateTime, end: endDateTime });
      const url = `${API_BASE}/reports/sales?${params.toString()}`;

      try {
        const resp = await fetch(url);
        if (!resp.ok) {
          console.warn('Sales report request failed, status:', resp.status);
          throw new Error(`HTTP ${resp.status}`);
        }

        const data = await resp.json();

        // Expected shape (recommended): { orders: number, total_sales: number, series: [{ time: 'HH:MM', amount: number }, ...] }
        if (typeof data === 'object' && data !== null) {
          const orders = Number.isFinite(data.orders) ? data.orders : (data.orders_count || data.count || null);
          const total = Number.isFinite(data.total_sales) ? data.total_sales : (data.total || data.totalSales || null);

          if (orders != null) setSalesOrdersCount(orders);
          if (total != null) setSalesTotal(parseFloat(total));

          if (Array.isArray(data.series) && data.series.length > 0) {
            setSalesSeries(data.series.map(pt => ({ time: pt.time || pt.label || pt.hour || '', amount: Number(pt.amount || pt.value || 0) })));
          } else if (Array.isArray(data.points) && data.points.length > 0) {
            setSalesSeries(data.points.map(pt => ({ time: pt.time || pt.label, amount: Number(pt.amount || 0) })));
          } else {
            // No series returned — build a small hourly series around the range as fallback
            const fallbackHours = 8;
            const series = Array.from({ length: fallbackHours }).map((_, i) => {
              const hourLabel = `${(8 + i).toString().padStart(2, '0')}:00`;
              return { time: hourLabel, amount: parseFloat((Math.random() * 2500).toFixed(2)) };
            });
            setSalesSeries(series);
          }
        } else {
          throw new Error('Unexpected backend response for sales report');
        }
      } catch (err) {
        // Graceful fallback to mocked results so UI remains usable when backend is missing
        console.warn('Falling back to mocked sales report due to error:', err.message || err);
        const mockOrders = Math.floor(Math.random() * 200);
        const mockTotal = parseFloat((Math.random() * 20000).toFixed(2));
        setSalesOrdersCount(mockOrders);
        setSalesTotal(mockTotal);

        const hours = 8;
        const series = Array.from({ length: hours }).map((_, i) => {
          const hourLabel = `${(8 + i).toString().padStart(2, '0')}:00`;
          return { time: hourLabel, amount: parseFloat((Math.random() * 2500).toFixed(2)) };
        });
        setSalesSeries(series);
      }
    })();
  };

  // Handle restock action
  const handleRestock = (itemId, itemName) => {
    const restockAmount = 100;
    const updatedItems = restockItems.map(item => {
      if (item.id === itemId) {
        const newQuantity = item.quantity + restockAmount;
        
        // SQL to update database
        const sql = `UPDATE inventory SET quantity = ${newQuantity} WHERE id = ${itemId};`;
        console.log('SQL - Restock:', sql);
        // TODO: Execute SQL when backend is ready
        
        return { ...item, quantity: newQuantity };
      }
      return item;
    });
    
    setRestockItems(updatedItems);
  };

  // Update threshold for all items
  const handleThresholdChange = (newThreshold) => {
    setRestockThreshold(newThreshold);
    const updated = restockItems.map(item => ({ ...item, threshold: newThreshold }));
    setRestockItems(updated);
    fetchRestockItems(); // Re-fetch with new threshold
  };

  // SQL: Appetizers & Premium Entrees
  const loadAppsAndPremium = () => {
    const sql = `
SELECT ad.name AS item, COUNT(*) AS num_portions,
       COALESCE(ad.additional_price, ad.price) AS additional_price
FROM orders_to_appetizers_and_drinks oad
JOIN appetizers_and_drinks ad ON ad.id = oad.appetizeranddrinkid
WHERE ad.category IN ('Appetizer','Premium Entree')
GROUP BY ad.name, COALESCE(ad.additional_price, ad.price)
ORDER BY num_portions DESC;`;
    
    console.log('SQL - Appetizers/Premium:', sql);
    // TODO: Execute query and update appsData when backend is ready
  };

  // SQL: Revenue grouped by portion size
  const loadRevenueByPortionSize = () => {
    const sql = `
SELECT oad.portion_size AS portion_size, SUM(ad.price) AS total_revenue
FROM orders_to_appetizers_and_drinks oad
JOIN appetizers_and_drinks ad ON ad.id = oad.appetizeranddrinkid
GROUP BY oad.portion_size
ORDER BY total_revenue DESC;`;
    
    console.log('SQL - Portion Revenue:', sql);
    // TODO: Execute query and update portionRevenueData when backend is ready
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  };

  // Render vertical bar chart for usage data
  const renderBarChart = (data, labelKey, valueKey, title) => {
    if (!data || data.length === 0) return <div className="empty-chart">No data available</div>;
    const maxValue = Math.max(...data.map(d => d[valueKey]));
    return (
      <div className="bar-chart">
        {title && <div className="chart-title">{title}</div>}
        <div className="bar-chart-inner">
          {data.map((item, idx) => {
            const h = (item[valueKey] / maxValue) * 100;
            return (
              <div key={idx} className="bar-item">
                <div className="bar-wrapper">
                  <div className="bar-fill" style={{ height: `${h}%`, background: 'linear-gradient(to top, #c8102e, #e31837)' }} title={`${item[labelKey]}: ${item[valueKey]}`} />
                </div>
                <div className="bar-label">{item[labelKey]}</div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Simple line chart renderer for X-Report / Z-Report
  // Replace your renderLineChart function in ItemsSales.js with this improved version:

const renderLineChart = (data, labelKey, valueKey, title) => {
  if (!data || data.length === 0) {
    return <div className="empty-chart">No data available</div>;
  }
  
  const maxValue = Math.max(...data.map(d => d[valueKey]), 100); // Minimum scale of 100
  const chartHeight = 400;
  const chartWidth = 900;
  const paddingLeft = 80;
  const paddingRight = 40;
  const paddingTop = 40;
  const paddingBottom = 70;
  const plotWidth = chartWidth - paddingLeft - paddingRight;
  const plotHeight = chartHeight - paddingTop - paddingBottom;

  // Check if all values are zero
  const allZeros = data.every(d => d[valueKey] === 0);

  return (
    <div className="line-chart-wrapper" style={{ marginTop: '1rem', background: '#fff', padding: '1rem', borderRadius: '8px', border: '1px solid #ddd' }}>
      {title && <div className="chart-title" style={{ marginBottom: '1rem', fontSize: '1.1rem', fontWeight: 'bold', color: '#333' }}>{title}</div>}
      <svg width={chartWidth} height={chartHeight} style={{ display: 'block' }}>
        {/* Y-axis grid lines and labels */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
          const y = paddingTop + plotHeight * (1 - ratio);
          const value = maxValue * ratio;
          return (
            <g key={i}>
              <line
                x1={paddingLeft}
                y1={y}
                x2={chartWidth - paddingRight}
                y2={y}
                stroke="#e0e0e0"
                strokeWidth="1"
              />
              <text
                x={paddingLeft - 10}
                y={y + 5}
                textAnchor="end"
                fontSize="12"
                fill="#666"
                fontFamily="Arial, sans-serif"
              >
                ${value.toFixed(0)}
              </text>
            </g>
          );
        })}

        {/* X-axis line */}
        <line
          x1={paddingLeft}
          y1={paddingTop + plotHeight}
          x2={chartWidth - paddingRight}
          y2={paddingTop + plotHeight}
          stroke="#333"
          strokeWidth="2"
        />

        {/* Y-axis line */}
        <line
          x1={paddingLeft}
          y1={paddingTop}
          x2={paddingLeft}
          y2={paddingTop + plotHeight}
          stroke="#333"
          strokeWidth="2"
        />

        {/* Line chart */}
        <polyline
          fill="none"
          stroke={allZeros ? "#999" : "#c8102e"}
          strokeWidth="3"
          points={data.map((d, i) => {
            const x = paddingLeft + (i / (data.length - 1)) * plotWidth;
            const y = paddingTop + plotHeight * (1 - d[valueKey] / maxValue);
            return `${x},${y}`;
          }).join(' ')}
        />

        {/* Data points and labels */}
        {data.map((d, i) => {
          const x = paddingLeft + (i / (data.length - 1)) * plotWidth;
          const y = paddingTop + plotHeight * (1 - d[valueKey] / maxValue);
          return (
            <g key={i}>
              {/* Data point circle */}
              <circle 
                cx={x} 
                cy={y} 
                r="5" 
                fill={allZeros ? "#999" : "#c8102e"}
                stroke="#fff"
                strokeWidth="2"
              />
              
              {/* X-axis time labels - rotated for better spacing */}
              <text
                x={x}
                y={paddingTop + plotHeight + 20}
                textAnchor="middle"
                fontSize="11"
                fill="#333"
                fontFamily="Arial, sans-serif"
              >
                {d[labelKey]}
              </text>
              
              {/* Tooltip */}
              <title>{d[labelKey]}: ${d[valueKey].toFixed(2)}</title>
            </g>
          );
        })}
        
        {/* Message if all zeros */}
        {allZeros && (
          <text
            x={chartWidth / 2}
            y={chartHeight / 2}
            textAnchor="middle"
            fontSize="16"
            fill="#999"
            fontFamily="Arial, sans-serif"
            fontWeight="bold"
          >
            No sales data or Z-Report has been run
          </text>
        )}
      </svg>
    </div>
  );
};

  return (
    <div className="tab-panel">
      <h2>Items & Sales Report</h2>

      {/* Top Section: Charts */}
      <div className="charts-section">
        {/* Sales Report Card: total sales between arbitrary date/time range */}
        <div className="chart-card">
          <h3>Sales Report (Custom Range)</h3>
          <div className="chart-controls">
            <div className="date-time-inputs">
              <div className="input-group">
                <label>Start:</label>
                <input type="date" value={salesStartDate} onChange={(e)=>setSalesStartDate(e.target.value)} className="date-input" />
                <input type="time" value={salesStartTime} onChange={(e)=>setSalesStartTime(e.target.value)} className="time-input" />
              </div>
              <div className="input-group">
                <label>End:</label>
                <input type="date" value={salesEndDate} onChange={(e)=>setSalesEndDate(e.target.value)} className="date-input" />
                <input type="time" value={salesEndTime} onChange={(e)=>setSalesEndTime(e.target.value)} className="time-input" />
              </div>
              <button className="fetch-btn" onClick={generateSalesReport}>Generate Sales Report</button>
            </div>
          </div>

          <div className="sales-summary-box" style={{ marginTop: '0.75rem' }}>
            <div className="summary-stat">
              <span className="stat-label">Orders:</span>
              <span className="stat-value">{salesOrdersCount !== null ? salesOrdersCount : '—'}</span>
            </div>
            <div className="summary-stat">
              <span className="stat-label">Total Sales:</span>
              <span className="stat-value">{salesTotal !== null ? formatCurrency(salesTotal) : '—'}</span>
            </div>
          </div>
          {
          //Graph for Sales Report (time series)
          }
          <div style={{ marginTop: '1rem' }}>
            {renderLineChart(salesSeries, 'time', 'amount', salesSeries && salesSeries.length ? 'Sales Over Range' : 'No sales series to display')}
          </div>
        </div>
  {/* Project Usage Chart - Inventory Used by Time Period */}
  <div className="chart-card">
          <h3>Product Usage Chart (Inventory Used)</h3>
          <div className="chart-controls">
            <div className="date-time-inputs">
              <div className="input-group">
                <label>Start Date:</label>
                <input 
                  type="date" 
                  value={startDate} 
                  onChange={(e) => setStartDate(e.target.value)}
                  className="date-input"
                />
                <input 
                  type="time" 
                  value={startTime} 
                  onChange={(e) => setStartTime(e.target.value)}
                  className="time-input"
                />
              </div>
              <div className="input-group">
                <label>End Date:</label>
                <input 
                  type="date" 
                  value={endDate} 
                  onChange={(e) => setEndDate(e.target.value)}
                  className="date-input"
                />
                <input 
                  type="time" 
                  value={endTime} 
                  onChange={(e) => setEndTime(e.target.value)}
                  className="time-input"
                />
              </div>
              <button className="fetch-btn" onClick={generateUsageReport}>
                Generate Usage
              </button>
            </div>
          </div>

          <div className="sales-summary-box">
            <div className="summary-stat">
              <span className="stat-label">Total Units Used:</span>
              <span className="stat-value">{usageData.reduce((s, r) => s + (r.unitsUsed || 0), 0)}</span>
            </div>
            <div className="summary-stat">
              <span className="stat-label">Items:</span>
              <span className="stat-value">{usageData.length}</span>
            </div>
          </div>

          {renderBarChart(usageData, 'item', 'unitsUsed', 'Inventory Units Used')}
        </div>

  {/* Restock Chart */}
  <div className="chart-card" style={{ gridColumn: '1 / -1' }}>
          <h3>Restock Chart - Items Below Threshold</h3>
          <div className="threshold-control">
            <label>Restock Threshold:</label>
            <input 
              type="number" 
              value={restockThreshold} 
              onChange={(e) => handleThresholdChange(parseInt(e.target.value) || 0)}
              className="threshold-input"
              min="0"
            />
            <span className="threshold-label">units</span>
          </div>

          <div className="restock-table-container">
            <table className="restock-table">
              <thead>
                <tr>
                  <th>Item Name</th>
                  <th>Current Qty</th>
                  <th>Threshold</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {restockItems.filter(item => item.quantity < restockThreshold).length === 0 ? (
                  <tr>
                    <td colSpan="4" className="empty-message">
                      All items are above threshold
                    </td>
                  </tr>
                ) : (
                  restockItems
                    .filter(item => item.quantity < restockThreshold)
                    .map((item) => (
                      <tr key={item.id} className="low-stock-row">
                        <td>{item.name}</td>
                        <td>
                          <span className="quantity-badge low">{item.quantity}</span>
                        </td>
                        <td>{item.threshold}</td>
                        <td>
                          <button 
                            className="action-btn restock-btn-small"
                            onClick={() => handleRestock(item.id, item.name)}
                          >
                            Restock +100
                          </button>
                        </td>
                      </tr>
                    ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* X-Report & Z-Report Sections (side-by-side, consistent styling) */}
      <div className="charts-section">
        <div className="chart-card">
          <h3>X-Report (Hourly Sales Today)</h3>
          <div className="chart-controls">
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <button className="fetch-btn" onClick={generateXReport}>
                Generate X-Report
              </button>
            </div>
          </div>
          
          {/* Display the line chart */}
          {xReportData && xReportData.length > 0 ? (
            renderLineChart(xReportData, 'hour', 'sales', 
              xReportGenerated ? 'Hourly Sales (X-Report)' : 'No X-Report generated'
            )
          ) : (
            <div style={{ 
              padding: '2rem', 
              textAlign: 'center', 
              color: '#999',
              border: '1px solid #ddd',
              borderRadius: '4px',
              marginTop: '1rem'
            }}>
              Click "Generate X-Report" to view hourly sales data
            </div>
          )}
        </div>

        <div className="chart-card">
          <h3>Z-Report (End of Day)</h3>
          <div className="chart-controls">
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <button className="fetch-btn" onClick={runZReport} disabled={zReportRunToday}>
                Run Z-Report
              </button>
              <button className="delete-btn" onClick={clearZReport}>
                Clear Z-Report
              </button>
              <span style={{ marginLeft: 'auto' }} className={`status-badge ${zReportRunToday ? 'active' : 'inactive'}`}>
                {zReportRunToday ? 'Run Today' : 'Not Run'}
              </span>
            </div>
          </div>
          <div style={{ marginTop: '0.75rem', marginBottom: '0.5rem', color: '#666' }}>{zReportStatus}</div>
          {renderLineChart(zReportData, 'hour', 'sales', zReportRunToday ? 'Z-Report Daily Sales' : 'Z-Report not run')}
        </div>
      </div>

        {/* Bottom Section: Original Tables */}
      <div className="items-sales-layout">
        {/* Appetizers & Premium Entrees (left) */}
        <div className="sales-table-section">
          <h3>Appetizers & Premium Entrees</h3>
          <div className="table-container">
            <table className="manager-table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Num Portions</th>
                  <th>Additional Price</th>
                </tr>
              </thead>
              <tbody>
                {appsData.length === 0 ? (
                  <tr>
                    <td colSpan="3" className="empty-message">No appetizer/premium rows</td>
                  </tr>
                ) : (
                  appsData.map((row, index) => (
                    <tr key={index}>
                      <td>{row.item}</td>
                      <td>{row.numPortions}</td>
                      <td>{formatCurrency(row.additionalPrice)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Revenue by Portion Size (right) */}
        <div className="sales-table-section">
          <h3>Revenue by Portion Size</h3>
          <div className="table-container">
            <table className="manager-table">
              <thead>
                <tr>
                  <th>Portion Size</th>
                  <th>Total Revenue</th>
                </tr>
              </thead>
              <tbody>
                {portionRevenueData.length === 0 ? (
                  <tr>
                    <td colSpan="2" className="empty-message">No portion revenue rows</td>
                  </tr>
                ) : (
                  portionRevenueData.map((row, index) => (
                    <tr key={index}>
                      <td>{row.portionSize}</td>
                      <td>{formatCurrency(row.totalRevenue)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <button className="reload-btn" onClick={loadData}>
            Reload Tables
          </button>
        </div>
      </div>
      
      {/* Summary Report */}
      <div className="summary-section">
        <h3>Summary Report</h3>
        <div className="summary-controls">
          <button className="fetch-btn" onClick={buildSummaryReport}>Refresh Summary</button>
        </div>
        <textarea className="summary-textarea" value={summaryReport} readOnly rows={12} />
      </div>
    </div>
  );
}
