import express from "express";
import pool from "../db.js";

const router = express.Router();
import multer from 'multer';




// image handling
const storage  = multer.memoryStorage();
const upload = multer({ storage: storage });

/**
 * Route to upload an image for a food item.
 * @name POST /upload-image
 * @function
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
router.post('/upload-image', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file uploaded' });
    }
    const {food_id} = req.body;
    const {buffer, mimetype} = req.file;

    if(!food_id || !buffer || !mimetype) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const query = `
      INSERT INTO food_images (food_id, image_data, mime_type)
      VALUES ($1, $2, $3)
      RETURNING id
      `;

    const values = [food_id, buffer, mimetype];

    await pool.query(query, values);
    res.status(201).send('Image uploaded successfully');

  } catch (err) {
    console.error('Error uploading image:', err);
    res.status(500).json({ error: 'Failed to upload image' });
  }
});

/**
 * Route to upload an image for an appetizer or drink.
 * @name POST /upload-appetizer-drink-image
 * @function
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
router.post('/upload-appetizer-drink-image', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file uploaded' });
    }
    const {appetizer_drink_id} = req.body;
    const {buffer, mimetype} = req.file;
    if(!appetizer_drink_id || !buffer || !mimetype) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    const query = `
      INSERT INTO appetizer_images (appetizer_drink_id, image_data, mime_type)
      VALUES ($1, $2, $3)
      RETURNING id
      `;
    const values = [appetizer_drink_id, buffer, mimetype];
    await pool.query(query, values);
    res.status(201).send('Image uploaded successfully');
  } catch (err) { 
    console.error('Error uploading image:', err);
    res.status(500).json({ error: 'Failed to upload image' });
  }
});

/**
 * Route to serve a food image by food ID.
 * @name GET /food-image/:id
 * @function
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
router.get('/food-image/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) return res.status(400).json({ error: 'Invalid id' });

    // Find the most recent image for this food_id (avoid matching by image id)
    const result = await pool.query(
      `SELECT image_data, mime_type FROM food_images WHERE food_id = $1 ORDER BY id DESC LIMIT 1`,
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Image not found' });
    }

    const row = result.rows[0];
    const imageBuffer = row.image_data;
    const mime = row.mime_type || 'application/octet-stream';

    res.set('Content-Type', mime);
    // Send raw buffer back to client
    return res.send(imageBuffer);
  } catch (err) {
    console.error('Error fetching image:', err);
    return res.status(500).json({ error: 'Failed to fetch image' });
  }
});


/**
 * Route to serve an appetizer/drink image by its ID.
 * @name GET /appetizer-drink-image/:id
 * @function
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
router.get('/appetizer-drink-image/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) return res.status(400).json({ error: 'Invalid id' });
    const result = await pool.query(
      `SELECT image_data, mime_type FROM appetizer_images WHERE appetizer_drink_id = $1 ORDER BY id DESC LIMIT 1`,
      [id]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Image not found' });
    }
    const row = result.rows[0];
    const imageBuffer = row.image_data;
    const mime = row.mime_type || 'application/octet-stream';
    res.set('Content-Type', mime);
    return res.send(imageBuffer);
  } catch (err) {
    console.error('Error fetching image:', err);
    return res.status(500).json({ error: 'Failed to fetch image' });
  }
});

export default router;