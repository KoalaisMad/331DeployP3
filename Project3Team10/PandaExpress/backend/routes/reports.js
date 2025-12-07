import express from "express";
import pool from "../db.js";

const router = express.Router();



// X-REPORT & Z-REPORT ROUTES

// Check if Z-Report has been run today
// Check if Z-Report has been run today
// Mounted at /api/reports -> GET /api/reports/z-report-status
router.get("/z-report-status", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT z_report_run, total_sales, total_orders 
      FROM daily_reports 
      WHERE report_date = CURRENT_DATE AT TIME ZONE 'America/Chicago'
    `);
    
    const runToday = result.rows.length > 0 && result.rows[0].z_report_run === true;
    
    let hourlyData = null;
    
    // If Z-Report was run, also fetch the hourly breakdown
    if (runToday) {
      hourlyData = [];
      for (let hour = 0; hour <= 23; hour++) {
        const hourResult = await pool.query(`
          SELECT COALESCE(SUM(cost), 0) AS total 
          FROM orders 
          WHERE DATE(timestamp AT TIME ZONE 'America/Chicago') = CURRENT_DATE AT TIME ZONE 'America/Chicago'
          AND EXTRACT(HOUR FROM (timestamp AT TIME ZONE 'America/Chicago')) = $1
        `, [hour]);
        
        hourlyData.push({
          hour: `${hour.toString().padStart(2, '0')}:00`,
          sales: parseFloat(hourResult.rows[0].total)
        });
      }
    }
    
    res.json({ 
      success: true, 
      hasRun: runToday,
      totalSales: runToday ? parseFloat(result.rows[0].total_sales) : 0,
      totalOrders: runToday ? parseInt(result.rows[0].total_orders) : 0,
      hourlyData: hourlyData
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to check Z-Report status" });
  }
});

// Generate X-Report (hourly sales for today)
// GET /api/reports/x-report
router.get("/x-report", async (req, res) => {
  try {
    // 1. Check if Z-Report has been run today
    const zCheckResult = await pool.query(`
      SELECT z_report_run FROM daily_reports 
      WHERE report_date = CURRENT_DATE AND z_report_run = TRUE
    `);
    
    const zReportRun = zCheckResult.rows.length > 0;
    
    if (zReportRun) {
      // Return all zeros for each hour (8:00 to 17:00)
      const hourlyData = [];
      for (let hour = 0; hour <= 23; hour++) {
        hourlyData.push({
          hour: `${hour.toString().padStart(2, '0')}:00`,
          sales: 0
        });
      }
      
      return res.json({
        success: true,
        closed: true,
        message: "X Report Closed for the Day (Z Report already run)",
        hourlyData: hourlyData
      });
    }
    
    // 2. Get hourly sales for today (8:00 to 17:00)
    const hourlyData = [];
    for (let hour = 0; hour <= 23; hour++) {
      const result = await pool.query(`
        SELECT COALESCE(SUM(cost), 0) AS total 
        FROM orders 
        WHERE DATE(timestamp AT TIME ZONE 'UTC' AT TIME ZONE 'America/Chicago') = CURRENT_DATE 
        AND EXTRACT(HOUR FROM (timestamp AT TIME ZONE 'UTC' AT TIME ZONE 'America/Chicago')) = $1
      `, [hour]);
      
      hourlyData.push({
        hour: `${hour.toString().padStart(2, '0')}:00`,
        sales: parseFloat(result.rows[0].total)
      });
    }
    
    res.json({
      success: true,
      closed: false,
      message: "X Report - Today's Hourly Sales",
      hourlyData: hourlyData
    });
    
  } catch (err) {
    console.error("Error generating X-Report:", err);
    res.status(500).json({ 
      success: false, 
      error: "Failed to generate X-Report" 
    });
  }
});

// Run Z-Report (end of day)
// Run Z-Report (end of day)
// POST /api/reports/z-report
router.post("/z-report", async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const checkResult = await client.query(`
      SELECT z_report_run, total_sales FROM daily_reports WHERE report_date = CURRENT_DATE AT TIME ZONE 'America/Chicago'
    `);

    if (checkResult.rows.length > 0 && checkResult.rows[0].z_report_run) {
      await client.query('COMMIT');
      return res.status(409).json({ success: false, error: "Z-Report already run today. Sales finalized." });
    }

    const summaryResult = await client.query(`
        SELECT 
            COUNT(o.id) AS total_orders,
            COALESCE(SUM(o.cost), 0) AS total_sales
        FROM orders o
        WHERE DATE(o.timestamp AT TIME ZONE 'America/Chicago') = CURRENT_DATE AT TIME ZONE 'America/Chicago'
    `);

    const { total_orders, total_sales } = summaryResult.rows[0];
    const totalSalesFloat = parseFloat(total_sales);
    const totalOrdersInt = parseInt(total_orders, 10);
    
    // Get hourly breakdown for the Z-Report
    const hourlyData = [];
    for (let hour = 0; hour <= 23; hour++) {
      const result = await client.query(`
        SELECT COALESCE(SUM(cost), 0) AS total 
        FROM orders 
        WHERE DATE(timestamp AT TIME ZONE 'America/Chicago') = CURRENT_DATE AT TIME ZONE 'America/Chicago'
        AND EXTRACT(HOUR FROM (timestamp AT TIME ZONE 'America/Chicago')) = $1
      `, [hour]);
      
      hourlyData.push({
        hour: `${hour.toString().padStart(2, '0')}:00`,
        sales: parseFloat(result.rows[0].total)
      });
    }
    
    await client.query(`
        INSERT INTO daily_reports (report_date, z_report_run, z_report_timestamp, total_orders, total_sales) 
        VALUES (
            CURRENT_DATE AT TIME ZONE 'America/Chicago', 
            TRUE, 
            NOW(), 
            $1, 
            $2
        )
        ON CONFLICT (report_date) DO UPDATE SET
            z_report_run = TRUE,
            z_report_timestamp = NOW(),
            total_orders = $1,
            total_sales = $2
    `, [totalOrdersInt, totalSalesFloat]);

    await client.query('COMMIT');

    res.json({
      success: true,
      message: "Z-Report successfully recorded and finalized.",
      totalSales: totalSalesFloat,
      totalOrders: totalOrdersInt,
      hourlyData: hourlyData
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error("Error running Z-Report:", err);
    res.status(500).json({ success: false, error: "Failed to run Z-Report." });
  } finally {
      client.release();
  }
});

// Clear Z-Report (for testing)
// DELETE /api/reports/z-report
router.delete("/z-report", async (req, res) => {
  try {
    await pool.query("DELETE FROM daily_reports WHERE report_date = CURRENT_DATE");
    res.json({ success: true, message: "Z-Report cleared for today" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to clear Z-Report" });
  }
});



// Sales report for an arbitrary date/time range
// GET /api/reports/sales
router.get('/sales', async (req, res) => {
  try {
    let { start, end } = req.query;

    if (!start || !end) {
      const today = new Date().toISOString().slice(0, 10);
      start = `${today} 00:00:00`;
      end = `${today} 23:59:59`;
    }

    // Convert input times (assumed to be Central) to UTC for comparison
    const summaryResult = await pool.query(
      `SELECT COUNT(*) AS orders, COALESCE(SUM(cost),0) AS total_sales 
       FROM orders 
       WHERE timestamp AT TIME ZONE 'UTC' AT TIME ZONE 'America/Chicago' 
       BETWEEN ($1::timestamp) AND ($2::timestamp)`,
      [start, end]
    );

    const orders = parseInt(summaryResult.rows[0].orders, 10) || 0;
    const totalSales = parseFloat(summaryResult.rows[0].total_sales) || 0.0;

    const seriesResult = await pool.query(
      `SELECT 
         to_char(date_trunc('hour', timestamp AT TIME ZONE 'UTC' AT TIME ZONE 'America/Chicago'), 'YYYY-MM-DD HH24:MI') AS time, 
         COALESCE(SUM(cost),0) AS amount
       FROM orders
       WHERE timestamp AT TIME ZONE 'UTC' AT TIME ZONE 'America/Chicago' 
       BETWEEN ($1::timestamp) AND ($2::timestamp)
       GROUP BY date_trunc('hour', timestamp AT TIME ZONE 'UTC' AT TIME ZONE 'America/Chicago')
       ORDER BY date_trunc('hour', timestamp AT TIME ZONE 'UTC' AT TIME ZONE 'America/Chicago')`,
      [start, end]
    );

    const series = seriesResult.rows.map(r => ({ time: r.time, amount: parseFloat(r.amount) }));

    res.json({ orders, total_sales: totalSales, series });
  } catch (err) {
    console.error('Failed to fetch sales report:', err);
    res.status(500).json({ error: 'Failed to fetch sales report' });
  }
});

// Product Usage Report - Inventory consumption for a date/time range
// GET /api/reports/product-usage
router.get('/product-usage', async (req, res) => {
  try {
    let { start, end } = req.query;

    if (!start || !end) {
      const today = new Date().toISOString().slice(0, 10);
      start = `${today} 00:00:00`;
      end = `${today} 23:59:59`;
    }

    console.log('Product Usage Query:', { start, end });

    // Simpler query - get inventory usage from orders
    const usageResult = await pool.query(
      `SELECT 
         i.name AS item,
         COALESCE(SUM(fti.servingsize), 0) AS unitsUsed
       FROM orders o
       JOIN orders_to_food_sizes ofs ON o.id = ofs.orderid
       JOIN sizes_to_food stf ON ofs.foodsizeid = stf.id
       JOIN food f ON stf.foodid = f.id
       JOIN food_to_inventory fti ON f.id = fti.foodid
       JOIN inventory i ON fti.inventoryid = i.id
       WHERE o.timestamp AT TIME ZONE 'UTC' AT TIME ZONE 'America/Chicago' 
       BETWEEN ($1::timestamp) AND ($2::timestamp)
       GROUP BY i.id, i.name
       ORDER BY unitsUsed DESC
       LIMIT 10`,
      [start, end]
    );

    const usage = usageResult.rows.map(r => ({
      item: r.item,
      unitsUsed: parseFloat(r.unitsused) || 0
    }));

    console.log('Product Usage Results:', usage.length, 'items found');

    res.json({ success: true, usage });
  } catch (err) {
    console.error('Failed to fetch product usage report:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch product usage report' });
  }
});


export default router;