const express = require('express');

const itemController = require('../controllers/itemController');
const authController = require('../controllers/authController');

const router = express.Router();

router
  .route('/')
  .get(itemController.updateMenu, itemController.getAllItems)
  .post(
    authController.protect,
    authController.restrictTo('admin', 'manager'),
    itemController.createItem
  );

router.route('/menu-del-dia').get(itemController.menuDelDia);
router.route('/top-5-pedidos').get(itemController.getTopMenu);

router
  .route('/:id')
  .get(itemController.getOneItem)
  .patch(
    authController.protect,
    authController.restrictTo('admin', 'manager', 'chef'),
    itemController.updateItem
  )
  .delete(
    authController.protect,
    authController.restrictTo('admin', 'manager'),
    itemController.deleteItem
  );

module.exports = router;
