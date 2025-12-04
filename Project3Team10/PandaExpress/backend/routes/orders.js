import express from "express";
import pool from "../db.js";

const router = express.Router();

// POST /api/orders  -> mounted as app.use('/api/orders', ordersRouter)
router.post("/", async (req, res) => {
  const { combos, appetizers, drinks, totalPrice } = req.body;

  try {
    // Insert order
    const orderResult = await pool.query(
      "INSERT INTO orders (timestamp, cost) VALUES (NOW(), $1) RETURNING id",
      [totalPrice]
    );
    const orderId = orderResult.rows[0].id;

    // Combos
    for (const combo of combos) {
      // Get size ID from name
      const sizeRes = await pool.query(
        "SELECT id FROM sizes WHERE name = $1",
        [combo.size]
      );
      if (sizeRes.rowCount === 0) continue;
      const sizeId = sizeRes.rows[0].id;

      try {
        await pool.query(
          "INSERT INTO orders_to_food_sizes (id, orderid, foodsizeid) VALUES (DEFAULT, $1, $2)",
          [orderId, sizeId]
        );
      } catch (insErr) {
        await pool.query(
          "INSERT INTO orders_to_food_sizes (id, orderid, foodsizeid) VALUES ((SELECT COALESCE(MAX(id),0)+1 FROM orders_to_food_sizes), $1, $2)",
          [orderId, sizeId]
        );
      }

      // Insert entrees
      for (const itemName of combo.items) {
        const foodRes = await pool.query(
          "SELECT id FROM food WHERE name = $1",
          [itemName]
        );
        if (foodRes.rowCount === 0) continue;
        const foodId = foodRes.rows[0].id;

        try {
          await pool.query(
            "INSERT INTO orders_to_food_sizes (id, orderid, foodsizeid) VALUES (DEFAULT, $1, $2)",
            [orderId, foodId]
          );
        } catch (insErr) {
          await pool.query(
            "INSERT INTO orders_to_food_sizes (id, orderid, foodsizeid) VALUES ((SELECT COALESCE(MAX(id),0)+1 FROM orders_to_food_sizes), $1, $2)",
            [orderId, foodId]
          );
        }
      }

      // Insert sides
      if (combo.sides && combo.sides.length > 0) {
        for (const sideName of combo.sides) {
          const sideRes = await pool.query(
            "SELECT id FROM food WHERE name = $1 AND is_side = true",
            [sideName]
          );
          if (sideRes.rowCount === 0) continue;
          const sideId = sideRes.rows[0].id;

          try {
            await pool.query(
              "INSERT INTO orders_to_food_sizes (id, orderid, foodsizeid) VALUES (DEFAULT, $1, $2)",
              [orderId, sideId]
            );
          } catch (insErr) {
            await pool.query(
              "INSERT INTO orders_to_food_sizes (id, orderid, foodsizeid) VALUES ((SELECT COALESCE(MAX(id),0)+1 FROM orders_to_food_sizes), $1, $2)",
              [orderId, sideId]
            );
          }
        }
      }
    }

    // appetizers & drinks
    for (const itemName of [...appetizers, ...drinks]) {
      const itemRes = await pool.query(
        "SELECT id FROM appetizers_and_drinks WHERE name = $1",
        [itemName]
      );
      if (itemRes.rowCount === 0) continue;
      const itemId = itemRes.rows[0].id;

      try {
        await pool.query(
          "INSERT INTO orders_to_appetizers_and_drinks (id, orderid, appetizeranddrinkid) VALUES (DEFAULT, $1, $2)",
          [orderId, itemId]
        );
      } catch (insErr) {
        await pool.query(
          "INSERT INTO orders_to_appetizers_and_drinks (id, orderid, appetizeranddrinkid) VALUES ((SELECT COALESCE(MAX(id),0)+1 FROM orders_to_appetizers_and_drinks), $1, $2)",
          [orderId, itemId]
        );
      }
    }

    res.json({ orderId });
  } catch (err) {
    console.error("Failed to insert order:", err);
    res.status(500).json({ error: "Failed to submit order" });
  }
});


export default router;