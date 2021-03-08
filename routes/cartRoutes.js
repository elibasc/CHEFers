const express = require('express');
const authController = require('../controllers/authController');
const cartController = require('../controllers/cartController');

const router = express.Router();

router.use(authController.protect, cartController.createGetCart);

router.route('/').get(cartController.getCart).delete(cartController.deleteCart);

router.post('/addItem', cartController.addItem);
router.delete('/deleteItem', cartController.deleteItem);

module.exports = router;
