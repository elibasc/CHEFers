const Cart = require('../models/cartModel');
const User = require('../models/userModel');
const Order = require('../models/orderModel');
const catchAsync = require('../utils/catchAsync');
const factory = require('./handlerFactory');
const AppError = require('../utils/appError');

exports.getAllOrders = factory.getAll(Order);

exports.getOrder = factory.getOne(Order, 'orden');

exports.updateOrder = factory.updateOne(Order, 'orden');

exports.deleteOrder = factory.deleteOne(Order, 'orden');

exports.createOrder = catchAsync(async (req, res, next) => {
  const { items, total } = req.cart;
  const { mesa } = req.body;

  if (!items[0]) {
    return next(
      new AppError('Agregue productos para poder confirmar su pedido', 404)
    );
  }

  const order = await Order.create({
    items,
    total,
    mesa,
    creadaPor: req.user._id,
  });

  await Cart.findByIdAndDelete({ _id: req.cart._id });
  await User.findByIdAndUpdate({ _id: req.user._id }, { cartId: null });

  res.status(200).json({
    status: 'success',
    order,
  });
});

exports.getMyOrders = catchAsync(async (req, res, next) => {
  const orders = await Order.find({ creadaPor: req.user._id });
  if (!orders[0]) {
    return next(new AppError('Aún no has realizado ninguna orden', 404));
  }

  res.status(200).json({
    status: 'success',
    ordenes: orders,
  });
});

exports.getMyOrder = catchAsync(async (req, res, next) => {
  const order = await Order.findOne({
    _id: req.params.id,
    creadaPor: req.user._id,
  });

  if (!order) {
    return next(
      new AppError(' Esta orden no existe o no pertenece a este usuario', 404)
    );
  }

  res.status(200).json({
    status: 'success',
    orden: order,
  });
});

exports.updateMyOrder = catchAsync(async (req, res, next) => {
  const updatedOrder = await Order.findOneAndUpdate(
    {
      _id: req.params.id,
      creadaPor: req.user._id,
    },
    req.body,
    {
      new: true,
      runValidators: true,
    }
  );

  if (!updatedOrder) {
    return next(
      new AppError('Esta orden no existe o no pertenece a este usuario', 404)
    );
  }

  res.status(200).json({
    status: 'success',
    orden: updatedOrder,
  });
});

exports.deleteMyOrder = catchAsync(async (req, res, next) => {
  const updatedOrder = await Order.findOneAndDelete({
    _id: req.params.id,
    creadaPor: req.user._id,
  });

  if (!updatedOrder) {
    return next(
      new AppError('Esta orden no existe o no pertenece a este usuario', 404)
    );
  }

  res.status(204).json({
    status: 'success',
    data: null,
  });
});
