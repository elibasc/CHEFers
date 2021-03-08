const express = require('express');
const authController = require('../controllers/authController');
const cartController = require('../controllers/cartController');
const orderController = require('../controllers/orderController');

const router = express.Router();
router.use(authController.protect, cartController.createGetCart);

router.post('/', orderController.createOrder);
router.get('/getMyOrders', orderController.getMyOrders);
router
  .route('/getMyOrders/:id')
  .get(orderController.getMyOrder)
  .patch(orderController.updateMyOrder)
  .delete(orderController.deleteMyOrder);

router.use(authController.restrictTo('admin', 'manager', 'chef'));
router.get('/getAllOrders', orderController.getAllOrders);
router
  .route('/getAllOrders/:id')
  .get(orderController.getOrder)
  .patch(orderController.updateOrder)
  .delete(orderController.deleteOrder);

module.exports = router;
