const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

// Create a visit record (students and any authenticated user)
router.post('/', authenticateToken, (req, res) => {
  const user = req.user;
  const { purpose = '', note = '' } = req.body;

  const query = `INSERT INTO visits (user_id, name, role, purpose, note, created_at) VALUES (?, ?, ?, ?, ?, NOW())`;
  db.query(query, [user.id, user.name, user.role, purpose, note], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: 'Database error' });
    }

    return res.status(201).json({ id: result.insertId, message: 'Visit recorded' });
  });
});

// Get visits list (admin only)
router.get('/', authenticateToken, authorizeRole(['admin']), (req, res) => {
  const query = `SELECT v.id, v.user_id, v.name, v.role, v.purpose, v.note, v.created_at FROM visits v ORDER BY v.created_at DESC`;
  db.query(query, (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: 'Database error' });
    }
    return res.json({ visits: results });
  });
});

// Get visit stats (counts per day for last 30 days) (admin only)
router.get('/stats', authenticateToken, authorizeRole(['admin']), (req, res) => {
  const query = `
    SELECT DATE(created_at) AS date, COUNT(*) AS count
    FROM visits
    WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 29 DAY)
    GROUP BY DATE(created_at)
    ORDER BY DATE(created_at)
  `;

  db.query(query, (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: 'Database error' });
    }
    return res.json({ stats: results });
  });
});

// Admin: create visit record on behalf of any user
router.post('/admin', authenticateToken, authorizeRole(['admin']), (req, res) => {
  const { user_id = null, name = null, role = null, purpose = '', note = '' } = req.body;

  const query = `INSERT INTO visits (user_id, name, role, purpose, note, created_at) VALUES (?, ?, ?, ?, ?, NOW())`;
  db.query(query, [user_id, name, role, purpose, note], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: 'Database error' });
    }

    return res.status(201).json({ id: result.insertId, message: 'Visit recorded by admin' });
  });
});

module.exports = router;
