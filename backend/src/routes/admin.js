const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { protect, adminOnly } = require('../middleware/auth');

// All admin routes require auth + admin role
router.use(protect, adminOnly);

// GET /api/admin/overview - Dashboard stats
router.get('/overview', adminController.getOverview);

// GET /api/admin/users - All users with memberships
router.get('/users', adminController.getUsers);

// PUT /api/admin/users/:id/approve - Approve pending user
router.put('/users/:id/approve', adminController.approveUser);

// PUT /api/admin/users/:id/status - Update user status
router.put('/users/:id/status', adminController.updateUserStatus);

// DELETE /api/admin/users/:id - Delete a user
router.delete('/users/:id', adminController.deleteUser);

// POST /api/admin/users/:id/membership - Add user to stokvel
router.post('/users/:id/membership', adminController.addUserToStokvel);

// GET /api/admin/contributions - All contributions
router.get('/contributions', adminController.getAllContributions);

module.exports = router;
