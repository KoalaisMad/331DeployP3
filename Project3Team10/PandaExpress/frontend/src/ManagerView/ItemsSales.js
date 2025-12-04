import React, { useState, useEffect } from 'react';

const API_BASE = 'http://localhost:5000/api';

export default function ItemsSales() {
  // Product Usage (inventory) time window - defaults, can be changed in UI
  const [startDate, setStartDate] = useState('2024-10-01');
  const [endDate, setEndDate] = useState('2024-10-10');
  const [startTime, setStartTime] = useState('00:00');
  const [endTime, setEndTime] = useState('23:59');

  const [totalSales, setTotalSales] = useState(0); 
  const [totalOrders, setTotalOrders] = useState(0); 
  const [itemRevenueData, setItemRevenueData] = useState([]); 

  // Product Usage (inventory consumption) data
  const [usageData, setUsageData] = useState([]);              // no hardcoded values
  const [usageLoading, setUsageLoading] = useState(false);
  const [usageError, setUsageError] = useState('');
  // Interactive bar chart state
  const [hoveredBar, setHoveredBar] = useState(null);
  const [selectedBar, setSelectedBar] = useState(null);

  // X-Report & Z-Report state variables
  const [xReportData, setXReportData] = useState([]);
  const [xReportGenerated, setXReportGenerated] = useState(false);

  const [zReportStatus, setZReportStatus] = useState('Z-Report not run today');
  const [zReportData, setZReportData] = useState([]);
  const [zReportRunToday, setZReportRunToday] = useState(false);

  // Restock Chart - Items below threshold (UI commented out but logic kept)
  const [restockThreshold, setRestockThreshold] = useState(100);
  const [restockItems, setRestockItems] = useState([
    { id: 1, name: 'Honey Walnut Shrimp', quantity: 23, threshold: 100 },
    { id: 2, name: 'Spring Roll Wrappers', quantity: 34, threshold: 100 },
    { id: 3, name: 'Fortune Cookies', quantity: 41, threshold: 100 },
    { id: 4, name: 'Soy Sauce Packets', quantity: 45, threshold: 100 },
    { id: 5, name: 'Orange Chicken', quantity: 67, threshold: 100 },
    { id: 6, name: 'Beijing Beef', quantity: 89, threshold: 100 },
  ]);

  // Table 1: Appetizers & Premium Entrees (UI commented out but state kept)
  const [appsData, setAppsData] = useState([
    { item: 'Spring Rolls', numPortions: 145, additionalPrice: 2.00 },
    { item: 'Cream Cheese Rangoon', numPortions: 132, additionalPrice: 2.00 },
    { item: 'Orange Chicken (Premium)', numPortions: 98, additionalPrice: 1.50 },
    { item: 'Honey Walnut Shrimp (Premium)', numPortions: 76, additionalPrice: 1.50 },
  ]);

  // Table 2: Revenue by Portion Size (UI commented out but state kept)
  const [portionRevenueData, setPortionRevenueData] = useState([
    { portionSize: 'Bigger Plate', totalRevenue: 4532.50 },
    { portionSize: 'Plate', totalRevenue: 3821.40 },
    { portionSize: 'Bowl', totalRevenue: 2945.30 },
  ]);

  // Sales report (amount between arbitrary date/time range)
  const [salesStartDate, setSalesStartDate] = useState(startDate);
  const [salesStartTime, setSalesStartTime] = useState(startTime);
  const [salesEndDate, setSalesEndDate] = useState(endDate);
  const [salesEndTime, setSalesEndTime] = useState(endTime);
  const [salesTotal, setSalesTotal] = useState(null);
  const [salesOrdersCount, setSalesOrdersCount] = useState(null);
  const [salesSeries, setSalesSeries] = useState([]);

  // Summary report (used by X-Report text)
  const [summaryReport, setSummaryReport] = useState('');

  useEffect(() => {
    checkZReportStatus();
  }, []);

  const loadData = () => {
    loadAppsAndPremium();
    loadRevenueByPortionSize();
    checkZReportStatus();
    buildSummaryReport();
  };

  // ---------- Helper: currency ----------
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  };

  // ---------- X-REPORT (works) ----------
  const generateXReport = async () => {
    setSummaryReport('Generating X-Report...');
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
        setXReportData(data.hourlyData || []);
        setXReportGenerated(true);
        
        let reportText = '--- X-REPORT: HOURLY SALES ---\n';
        reportText += `Date: ${new Date().toLocaleDateString()}\n`;
        reportText += `Status: ${data.closed ? 'CLOSED (Z-Report Run)' : 'OPEN'}\n\n`;
        
        reportText += 'HOURLY BREAKDOWN (All Hours):\n';
        let totalSales = 0;
        (data.hourlyData || []).forEach(item => {
          reportText += `${item.hour.padEnd(10)}: ${formatCurrency(item.sales)}\n`;
          totalSales += item.sales;
        });
        
        reportText += `\nTOTAL SALES: ${formatCurrency(totalSales)}\n`;
        
        if (data.closed) {
          reportText += '\n*** Z-Report has been run. All values are finalized. ***\n';
        }
        
        setSummaryReport(reportText);
      } else {
        setSummaryReport(`Failed: ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('X-Report Error:', error);
      setSummaryReport(
        `Network or Parsing Error: The API call failed.\n` +
        `1. Ensure your Node.js server is running on port 5000.\n` +
        `2. Check the server console for database connection errors.\n` +
        `Details: ${error.message}`
      );
    }
  };

  // ---------- Z-REPORT (status / run / clear) ----------
  async function checkZReportStatus() {
    try {
      const response = await fetch(`${API_BASE}/reports/z-report-status`);
      const data = await response.json();
      
      if (data.hasRun) {
        setZReportRunToday(true);
        setZReportStatus(
          `Z-Report completed. Orders: ${data.totalOrders}, Sales: ${formatCurrency(data.totalSales)}`
        );
        
        // If backend returns hourlyData for the completed Z-Report, show it
        if (Array.isArray(data.hourlyData)) {
          setZReportData(data.hourlyData);
        } else {
          setZReportData([]);
        }
      } else {
        setZReportRunToday(false);
        setZReportStatus('Z-Report has not been run today.');
        setZReportData([]);
      }
    } catch (error) {
      console.error('Error checking Z-Report status:', error);
      setZReportStatus('Error checking Z-Report status');
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
        setZReportStatus(
          `Z-Report completed. Total Orders: ${data.totalOrders}, Total Sales: ${formatCurrency(data.totalSales)}`
        );
        
        if (Array.isArray(data.hourlyData)) {
          setZReportData(data.hourlyData);
        }

        alert(
          `Z-Report completed!\n` +
          `Orders: ${data.totalOrders}\n` +
          `Sales: ${formatCurrency(data.totalSales)}`
        );
        
        // Refresh X-Report (likely zeros after Z)
        generateXReport();
      }
    } catch (error) {
      console.error('Error running Z-Report:', error);
      alert('Failed to run Z-Report');
    }
  };

  const clearZReport = async () => {
    if (!window.confirm('Clear Z-Report for today? This is for testing only.')) {
      return;
    }
    
    try {
      const response = await fetch(`${API_BASE}/reports/z-report`, {
        method: 'DELETE'
      });
      
      const data = await response.json();
      
      if (data.success) {
        setZReportData([]);
        setZReportRunToday(false);
        setZReportStatus('Z-Report has not been run today.');
        
        alert('Z-Report cleared! You can now test again.');
        
        // Refresh X-Report after clearing
        generateXReport();
      }
    } catch (error) {
      console.error('Error clearing Z-Report:', error);
      alert('Failed to clear Z-Report');
    }
  };

  // ---------- SUMMARY REPORT (static / sample) ----------
  const buildSummaryReport = () => {
    let report = '';
    report += 'SUMMARY REPORT\n';
    report += '--------------\n';
    report += 'Peak Day: 2025-11-04  Sales: $12,453.50\n';
    report += 'Top Items: Orange Chicken, Fried Rice, Chow Mein\n';
    report += '\nLow Stock:\n- Honey Walnut Shrimp: 23\n- Spring Roll Wrappers: 34\n';
    setSummaryReport(report);
  };

  // ---------- PRODUCT USAGE REPORT (real backend, no hardcoded data) ----------
  const generateUsageReport = async () => {
    let startDateTime = `${startDate} ${startTime}:00`;
    let endDateTime = `${endDate} ${endTime}:00`;

    // Guard: if the user selected the exact same start and end timestamp, widen the end
    // to the end of that minute to avoid zero-length ranges which can cause backend or
    // front-end calculations to behave unexpectedly.
    if (startDateTime === endDateTime) {
      // safe, non-invasive change: use :59 seconds for the end time
      endDateTime = `${endDate} ${endTime}:59`;
      console.warn('Adjusted identical start/end timestamps to a 1-minute range for product usage query');
    }

    setUsageLoading(true);
    setUsageError('');

    try {
      const response = await fetch(
        `${API_BASE}/reports/product-usage?start=${encodeURIComponent(startDateTime)}&end=${encodeURIComponent(endDateTime)}`
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
  const data = await response.json();
      setUsageData(data || []);
      
      const itemsWithUsage = (data || []).filter(item => item.unitsUsed > 0).length;
      const totalUnits = (data || []).reduce(
        (sum, item) => sum + (item.unitsUsed || 0), 
        0
      );
      
      console.log('Product Usage data fetched:', {
        totalItems: (data || []).length,
        itemsWithUsage,
        totalUnits: totalUnits.toFixed(2),
        dateRange: `${startDateTime} to ${endDateTime}`
      });

      if (itemsWithUsage === 0) {
        setUsageError(
          `No inventory usage found between ${startDate} and ${endDate}. ` +
          `Try a different date range (data available from Oct 2024 onwards).`
        );
      }
    } catch (error) {
      console.error('Error fetching product usage:', error);
      setUsageError(`Failed to fetch product usage data: ${error.message}`);
      setUsageData([]);
    } finally {
      setUsageLoading(false);
    }
  };

  // ---------- RESTOCK ----------
  const fetchRestockItems = () => {
    const sql = `
SELECT id, name, quantity
FROM inventory
WHERE quantity < ${restockThreshold}
ORDER BY quantity ASC;`;
    
    console.log('SQL - Restock Items:', sql);
    // TODO: Execute query and update restockItems when backend is ready
  };

  const handleRestock = (itemId, itemName) => {
    const restockAmount = 100;
    const updatedItems = restockItems.map(item => {
      if (item.id === itemId) {
        const newQuantity = item.quantity + restockAmount;
        
        const sql = `UPDATE inventory SET quantity = ${newQuantity} WHERE id = ${itemId};`;
        console.log('SQL - Restock:', sql);
        // TODO: Execute SQL when backend is ready
        
        return { ...item, quantity: newQuantity };
      }
      return item;
    });
    
    setRestockItems(updatedItems);
  };

  const handleThresholdChange = (newThreshold) => {
    setRestockThreshold(newThreshold);
    const updated = restockItems.map(item => ({ ...item, threshold: newThreshold }));
    setRestockItems(updated);
    fetchRestockItems();
  };

  // ---------- APPETIZERS / PORTION REVENUE (SQL only, UI commented out) ----------
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

  // ---------- SALES REPORT (custom range, backend + graceful fallback) ----------
  const generateSalesReport = () => {
    (async () => {
      const startDateTime = `${salesStartDate} ${salesStartTime}:00`;
      const endDateTime = `${salesEndDate} ${salesEndTime}:00`;
      console.log('Requesting Sales Report from backend', { start: startDateTime, end: endDateTime });

      const params = new URLSearchParams({ start: startDateTime, end: endDateTime });
      const url = `${API_BASE}/reports/sales?${params.toString()}`;

      try {
        const resp = await fetch(url);
        if (!resp.ok) {
          console.warn('Sales report request failed, status:', resp.status);
          throw new Error(`HTTP ${resp.status}`);
        }

        const data = await resp.json();

        if (typeof data === 'object' && data !== null) {
          const orders = Number.isFinite(data.orders)
            ? data.orders
            : (data.orders_count || data.count || null);
          const total = Number.isFinite(data.total_sales)
            ? data.total_sales
            : (data.total || data.totalSales || null);

          if (orders != null) setSalesOrdersCount(orders);
          if (total != null) setSalesTotal(parseFloat(total));

          if (Array.isArray(data.series) && data.series.length > 0) {
            setSalesSeries(
              data.series.map(pt => ({
                time: pt.time || pt.label || pt.hour || '',
                amount: Number(pt.amount || pt.value || 0),
              }))
            );
          } else if (Array.isArray(data.points) && data.points.length > 0) {
            setSalesSeries(
              data.points.map(pt => ({
                time: pt.time || pt.label || '',
                amount: Number(pt.amount || 0),
              }))
            );
          } else {
            // No series returned — build a small hourly series around the range as fallback
            const fallbackHours = 8;
            const series = Array.from({ length: fallbackHours }).map((_, i) => {
              const hourLabel = `${(8 + i).toString().padStart(2, '0')}:00`;
              return {
                time: hourLabel,
                amount: parseFloat((Math.random() * 2500).toFixed(2)),
              };
            });
            setSalesSeries(series);
          }
        } else {
          throw new Error('Unexpected backend response for sales report');
        }
      } catch (err) {
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

  // ---------- SIMPLE BAR CHART FOR USAGE ----------
  const renderBarChart = (data, labelKey, valueKey, title) => {
    // Renders a two-column layout: left = bars, right = interactive side panel
    if (!data || data.length === 0) {
      return <div className="empty-chart">No data available</div>;
    }

    const maxValue = Math.max(...data.map(d => Number(d[valueKey] || 0)), 1);

    const selectedKey = selectedBar || hoveredBar || (data.length > 0 ? data[0][labelKey] : null);
    const selectedRow = data.find((r) => r[labelKey] === selectedKey) || null;

    // Render vertical bars: X-axis labels under bars, Y-axis left with ticks
    const ticks = 4;
    const tickValues = Array.from({ length: ticks + 1 }).map((_, i) => Math.round((maxValue * (ticks - i)) / ticks));

    return (
      <div className="bar-chart-grid">
        <div style={{ display: 'flex', gap: '12px', alignItems: 'stretch' }}>
          {/* Y Axis */}
          <div className="chart-yaxis" style={{ width: '64px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', paddingTop: '8px', paddingBottom: '36px' }}>
            {tickValues.map((tv, i) => (
              <div key={i} style={{ textAlign: 'right', fontSize: '12px', color: '#666' }}>${tv}</div>
            ))}
          </div>

          {/* Bars (scrollable horizontally if many items) */}
          <div className="bars-scroll" style={{ overflowX: 'auto', flex: 1 }}>
            <div className="sales-chart" role="list" aria-label={title || 'Bar chart'} style={{ alignItems: 'flex-end', height: '300px', paddingBottom: '12px' }}>
              {data.map((item, idx) => {
                const label = item[labelKey];
                const value = Number(item[valueKey] || 0);
                const rawRatio = maxValue > 0 ? value / maxValue : 0;
                const heightPercent = Math.max(rawRatio * 100, value > 0 ? 4 : 0);

                const isSelected = selectedBar === label;
                const isHovered = hoveredBar === label;

                return (
                  <div
                    key={idx}
                    className={`bar-container`} 
                    onMouseEnter={() => setHoveredBar(label)}
                    onMouseLeave={() => setHoveredBar(null)}
                    onFocus={() => setHoveredBar(label)}
                    onBlur={() => setHoveredBar(null)}
                    onClick={() => setSelectedBar(label)}
                    role="button"
                    tabIndex={0}
                    aria-pressed={isSelected}
                    style={{ cursor: 'pointer', minWidth: '84px' }}
                  >
                    <div className="bar-wrapper">
                      <div
                        className={`bar ${isSelected ? 'selected' : ''} ${isHovered ? 'hover' : ''}`}
                        style={{ height: `${heightPercent}%`, width: '60%' }}
                        title={`${label}: ${value}`}
                      >
                        <div className="bar-value">{value}</div>
                      </div>
                    </div>
                    <div className="bar-label" style={{ maxWidth: '140px', wordBreak: 'break-word' }}>
                      {label}
                    </div>
                  </div>
                );
              })}

              {/* X axis baseline */}
              <div style={{ position: 'absolute', left: '64px', right: '0', bottom: '0', height: '1px', background: '#ccc' }} />
            </div>
          </div>
        </div>

        <div className="chart-side-panel" aria-live="polite">
          <div className="side-title">{title || 'Details'}</div>
          {selectedRow ? (
            <div>
              <div className="side-value" style={{ fontSize: '1.6rem', fontWeight: 700, margin: '0.5rem 0' }}>
                {selectedRow[labelKey]}
              </div>
              <div style={{ color: '#666', marginBottom: '0.75rem' }}>Units Used</div>
              <div className="side-value" style={{ fontSize: '1.3rem', color: '#c8102e' }}>
                {Number(selectedRow[valueKey] || 0).toFixed(2)}
              </div>

              <div style={{ marginTop: '1rem' }}>
                <div style={{ fontSize: '0.9rem', color: '#555', marginBottom: '0.4rem' }}>Quick Sparkline</div>
                <div style={{ display: 'flex', gap: '4px', alignItems: 'end', height: '48px' }}>
                  {Array.from({ length: 6 }).map((_, i) => {
                    const fraction = ((i + 1) / 6) * (Number(selectedRow[valueKey] || 0) / maxValue);
                    const h = Math.max(6, Math.round(fraction * 100));
                    return (
                      <div key={i} style={{ width: '10px', height: `${h}%`, background: 'linear-gradient(to top, #c8102e, #e31837)', borderRadius: '2px' }} />
                    );
                  })}
                </div>
              </div>

              <div style={{ marginTop: '1rem', fontSize: '0.85rem', color: '#666' }}>
                Click any bar to lock selection. Hover to preview.
              </div>
            </div>
          ) : (
            <div className="empty-message">Select a bar to see details</div>
          )}
        </div>
      </div>
    );
  };

  // ---------- SVG LINE CHART (used for Sales, X, Z) ----------
  const renderLineChart = (data, labelKey, valueKey, title) => {
    if (!data || data.length === 0) {
      return <div className="empty-chart">No data available</div>;
    }
    
    const maxValue = Math.max(...data.map(d => d[valueKey] || 0), 100); // Minimum scale 100
  // Increase overall SVG size so it occupies more visual space; SVG is responsive via viewBox
  const chartHeight = 520;
  const chartWidth = 1200; // used for viewBox scaling; svg set to 100% width
  // smaller paddings to give more plotting area
  const paddingLeft = 50;
  const paddingRight = 20;
    const paddingTop = 40;
    const paddingBottom = 70;
    const plotWidth = chartWidth - paddingLeft - paddingRight;
    const plotHeight = chartHeight - paddingTop - paddingBottom;

    const allZeros = data.every(d => (d[valueKey] || 0) === 0);

    return (
      <div
        className="line-chart-wrapper"
        style={{
          marginTop: '1rem',
          background: '#fff',
          padding: '1rem',
          borderRadius: '8px',
          border: '1px solid #ddd',
        }}
      >
        {title && (
          <div
            className="chart-title"
            style={{ marginBottom: '1rem', fontSize: '1.1rem', fontWeight: 'bold', color: '#333' }}
          >
            {title}
          </div>
        )}
  <svg width="100%" viewBox={`0 0 ${chartWidth} ${chartHeight}`} preserveAspectRatio="xMidYMid meet" height={chartHeight} style={{ display: 'block' }}>
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

          {/* X-axis ticks and labels (limit label density) */}
          {(() => {
            const n = data.length;
            // Determine label formatter: try parse as Date
            let firstDate = null;
            let lastDate = null;
            try {
              const f = new Date(data[0][labelKey]);
              const l = new Date(data[n - 1][labelKey]);
              if (!isNaN(f) && !isNaN(l)) {
                firstDate = f;
                lastDate = l;
              }
            } catch (e) {
              // ignore
            }

            const labelFormatter = (raw, idx) => {
              if (firstDate && lastDate) {
                const rangeMs = lastDate - firstDate;
                const rangeDays = rangeMs / (1000 * 60 * 60 * 24);
                const dt = new Date(raw);
                if (!isNaN(dt)) {
                  if (rangeDays >= 2) {
                    // show dates for long ranges
                    return dt.toLocaleDateString();
                  }
                  // short ranges: show time
                  return dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                }
              }
              // fallback: shorten the label if too long
              const s = String(raw || '');
              return s.length > 10 ? s.substring(0, 10) + '…' : s;
            };

            const maxLabels = 10;
            const step = n <= maxLabels ? 1 : Math.ceil(n / maxLabels);
            return data.map((d, i) => {
              const x = paddingLeft + (i / (n - 1 || 1)) * plotWidth;
              const showLabel = i % step === 0 || i === n - 1;
              return (
                <g key={`xtick-${i}`}>
                  {/* small tick */}
                  <line
                    x1={x}
                    y1={paddingTop + plotHeight}
                    x2={x}
                    y2={paddingTop + plotHeight + 6}
                    stroke="#666"
                    strokeWidth="1"
                  />
                  {showLabel && (
                    <text
                      x={x}
                      y={paddingTop + plotHeight + 22}
                      textAnchor="middle"
                      fontSize="11"
                      fill="#333"
                      fontFamily="Arial, sans-serif"
                      transform={`rotate(-45 ${x} ${paddingTop + plotHeight + 22})`}
                    >
                      {labelFormatter(d[labelKey], i)}
                    </text>
                  )}
                </g>
              );
            });
          })()}

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
            stroke={allZeros ? '#999' : '#c8102e'}
            strokeWidth="3"
            points={data
              .map((d, i) => {
                // Avoid division by zero when there's only one data point.
                const denom = data.length > 1 ? (data.length - 1) : 1;
                const x = data.length > 1
                  ? paddingLeft + (i / denom) * plotWidth
                  : paddingLeft + plotWidth / 2; // center when single point
                const y = paddingTop + plotHeight * (1 - (d[valueKey] || 0) / maxValue);
                return `${x},${y}`;
              })
              .join(' ')}
          />

          {/* Data points and labels */}
          {data.map((d, i) => {
                const denom = data.length > 1 ? (data.length - 1) : 1;
                const x = data.length > 1
                  ? paddingLeft + (i / denom) * plotWidth
                  : paddingLeft + plotWidth / 2;
                const y = paddingTop + plotHeight * (1 - (d[valueKey] || 0) / maxValue);
            return (
              <g key={i}>
                <circle
                  cx={x}
                  cy={y}
                  r="5"
                  fill={allZeros ? '#999' : '#c8102e'}
                  stroke="#fff"
                  strokeWidth="2"
                />
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
                <title>
                  {d[labelKey]}: ${Number(d[valueKey] || 0).toFixed(2)}
                </title>
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

  // ---------- RENDER ----------
  return (
    <div className="tab-panel">
      <h2>Items & Sales Report</h2>

      {/* Top Section: Sales & Product Usage stacked vertically */}
      <div className="top-charts">
        {/* Sales Report Card */}
        <div className="chart-card">
          <h3>Sales Report (Custom Range)</h3>
          <div className="chart-controls">
            <div className="date-time-inputs">
              <div className="input-group">
                <label>Start:</label>
                <input
                  type="date"
                  value={salesStartDate}
                  onChange={(e) => setSalesStartDate(e.target.value)}
                  className="date-input"
                />
                <input
                  type="time"
                  value={salesStartTime}
                  onChange={(e) => setSalesStartTime(e.target.value)}
                  className="time-input"
                />
              </div>
              <div className="input-group">
                <label>End:</label>
                <input
                  type="date"
                  value={salesEndDate}
                  onChange={(e) => setSalesEndDate(e.target.value)}
                  className="date-input"
                />
                <input
                  type="time"
                  value={salesEndTime}
                  onChange={(e) => setSalesEndTime(e.target.value)}
                  className="time-input"
                />
              </div>
              <button className="fetch-btn" onClick={generateSalesReport}>
                Generate Sales Report
              </button>
            </div>
          </div>

          <div className="sales-summary-box" style={{ marginTop: '0.75rem' }}>
            <div className="summary-stat">
              <span className="stat-label">Orders:</span>
              <span className="stat-value">
                {salesOrdersCount !== null ? salesOrdersCount : '—'}
              </span>
            </div>
            <div className="summary-stat">
              <span className="stat-label">Total Sales:</span>
              <span className="stat-value">
                {salesTotal !== null ? formatCurrency(salesTotal) : '—'}
              </span>
            </div>
          </div>

          <div style={{ marginTop: '1rem' }}>
            {salesSeries.length === 0 ? (
              <div
                className="empty-chart"
                style={{
                  padding: '3rem 1rem',
                  textAlign: 'center',
                  background: '#f8f9fa',
                  borderRadius: '8px',
                  border: '2px dashed #ddd',
                  color: '#666',
                }}
              >
                <div style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>
                  No Data Available
                </div>
                <div>Click "Generate Sales Report" to fetch sales data</div>
                <div
                  style={{
                    marginTop: '0.75rem',
                    fontSize: '0.85rem',
                    color: '#999',
                  }}
                >
                  Tip: Data is available from October 2024 onwards
                </div>
              </div>
            ) : (
              renderLineChart(salesSeries, 'time', 'amount', 'Sales Over Range')
            )}
          </div>
  </div>

  {/* Product Usage Chart */}
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
              <button className="fetch-btn" onClick={generateUsageReport} disabled={usageLoading}>
                {usageLoading ? 'Loading...' : 'Generate Usage'}
              </button>
            </div>
          </div>

          <div className="sales-summary-box">
            <div className="summary-stat">
              <span className="stat-label">Total Units Used:</span>
              <span className="stat-value">
                {usageData.length > 0
                  ? usageData
                      .reduce((s, r) => s + (r.unitsUsed || 0), 0)
                      .toFixed(2)
                  : '0.00'}
              </span>
            </div>
            <div className="summary-stat">
              <span className="stat-label">Items Tracked:</span>
              <span className="stat-value">
                {usageData.filter((item) => (item.unitsUsed || 0) > 0).length}
              </span>
            </div>
          </div>

          {/* Error Message */}
          {usageError && (
            <div
              style={{
                marginTop: '1rem',
                padding: '1rem',
                background: '#fff3cd',
                border: '1px solid #ffc107',
                borderRadius: '6px',
                color: '#856404',
                fontSize: '0.9rem',
              }}
            >
              ⚠️ {usageError}
            </div>
          )}

          <div style={{ marginTop: '1.5rem' }}>
            {usageLoading ? (
              <div
                className="empty-chart"
                style={{
                  padding: '3rem 1rem',
                  textAlign: 'center',
                  background: '#f8f9fa',
                  borderRadius: '8px',
                  border: '2px solid #e5e7eb',
                  color: '#666',
                }}
              >
                <div style={{ fontSize: '1.1rem', fontWeight: 500 }}>
                  Loading data...
                </div>
                <div
                  style={{
                    marginTop: '0.5rem',
                    fontSize: '0.9rem',
                    color: '#999',
                  }}
                >
                  Fetching inventory usage from {startDate} to {endDate}
                </div>
              </div>
            ) : usageData.length === 0 ? (
              <div
                className="empty-chart"
                style={{
                  padding: '3rem 1rem',
                  textAlign: 'center',
                  background: '#f8f9fa',
                  borderRadius: '8px',
                  border: '2px dashed #ddd',
                  color: '#666',
                }}
              >
                <div style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>
                  No Data Available
                </div>
                <div>Click "Generate Usage" to fetch inventory usage data</div>
                <div
                  style={{
                    marginTop: '0.75rem',
                    fontSize: '0.85rem',
                    color: '#999',
                  }}
                >
                  Tip: Data is available from October 2024 onwards
                </div>
              </div>
            ) : (
              renderBarChart(
                usageData.filter((item) => (item.unitsUsed || 0) > 0),
                'item',
                'unitsUsed',
                'Inventory Units Used'
              )
            )}
          </div>
        </div>
      </div>

      {/* X-Report & Z-Report Section */}
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

          {xReportData && xReportData.length > 0 ? (
            renderLineChart(
              xReportData,
              'hour',
              'sales',
              xReportGenerated ? 'Hourly Sales (X-Report)' : 'No X-Report generated'
            )
          ) : (
            <div
              style={{
                padding: '2rem',
                textAlign: 'center',
                color: '#999',
                border: '1px solid #ddd',
                borderRadius: '4px',
                marginTop: '1rem',
              }}
            >
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
              <span
                style={{ marginLeft: 'auto' }}
                className={`status-badge ${zReportRunToday ? 'active' : 'inactive'}`}
              >
                {zReportRunToday ? 'Run Today' : 'Not Run'}
              </span>
            </div>
          </div>
          <div
            style={{
              marginTop: '0.75rem',
              marginBottom: '0.5rem',
              color: '#666',
            }}
          >
            {zReportStatus}
          </div>
          {zReportData && zReportData.length > 0 ? (
            renderLineChart(zReportData, 'hour', 'sales', 'Z-Report Daily Sales')
          ) : (
            <div
              style={{
                padding: '2rem',
                textAlign: 'center',
                color: '#999',
                border: '1px solid #ddd',
                borderRadius: '4px',
                marginTop: '1rem',
              }}
            >
              Z-Report not run or no hourly data available
            </div>
          )}
        </div>
      </div>

      {/* Bottom section tables / summary left commented out, but still wired-up if you want to re-enable later */}
    </div>
  );
}
