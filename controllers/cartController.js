const Cart = require('../models/cartModel');
const Item = require('../models/itemModel');
const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

exports.getCart = catchAsync(async (req, res, next) => {
  const { cart } = req;
  if (!cart) {
    return next(new AppError(`Este pedido ya se confirmó o canceló`, 404));
  }

  res.status(200).json({
    status: 'success',
    cart,
  });
});

exports.createGetCart = catchAsync(async (req, res, next) => {
  let cart;
  const existingCart = await Cart.findById(req.user.cartId).populate({
    path: 'items.item',
    select: 'name _id precio descripcion',
  });
  if (!req.user.cartId || !existingCart) {
    cart = await Cart.create({ items: [] });
    await User.findByIdAndUpdate({ _id: req.user._id }, { cartId: cart._id });
    req.user.cartId = cart._id;
    req.cart = cart;
  } else {
    cart = existingCart;
    req.cart = cart;
  }
  next();
});

exports.addItem = catchAsync(async (req, res, next) => {
  const item = req.body.add;
  if (!item.qty) item.qty = 1;
  const { cart } = req;
  const existingItem = cart.items.find((i) => i.item.id === item.item);
  if (existingItem) {
    await Cart.findOneAndUpdate(
      { _id: req.user.cartId },
      {
        $inc: {
          'items.$[itemId].qty': item.qty,
          'items.$[itemId].subTotal': existingItem.item.precio * item.qty,
        },
        $push: { 'items.$[itemId].comentarios': item.comentarios },
      },
      { new: true, arrayFilters: [{ 'itemId._id': existingItem._id }] }
    );
  } else {
    const getPrice = await Item.findById({ _id: item.item }, 'precio');
    item.subTotal = getPrice.precio * item.qty;
    await Cart.findByIdAndUpdate(
      { _id: req.user.cartId },
      { $push: { items: item } }
    );
  }

  res.status(200).json({
    status: 'success',
  });
});

exports.deleteItem = catchAsync(async (req, res, next) => {
  const { item } = req.body;
  const { cart } = req;
  const existingItem = cart.items.find((i) => i.item.id === item);
  if (!existingItem || existingItem.qty <= 0) {
    return next(
      new AppError('Este producto no se encuentra en el pedido actual', 404)
    );
  }
  if (existingItem.qty > 1) {
    await Cart.findOneAndUpdate(
      { _id: req.user.cartId },
      {
        $inc: {
          'items.$[itemId].qty': -1,
          'items.$[itemId].subTotal': -existingItem.item.precio,
        },
      },
      { new: true, arrayFilters: [{ 'itemId._id': existingItem._id }] }
    );
  } else if (existingItem.qty === 1) {
    console.log(existingItem);
    await Cart.findOneAndUpdate(
      { _id: req.user.cartId },
      { $pull: { items: { _id: existingItem._id } } }
    );
  }

  res.status(204).json({
    status: 'success',
    data: null,
  });
});

exports.deleteCart = catchAsync(async (req, res, next) => {
  const { cart, user } = req;
  await Cart.findByIdAndDelete({ _id: cart._id });
  await User.findByIdAndUpdate({ _id: user._id }, { cartId: null });

  res.status(204).json({
    status: 'success',
    data: null,
  });
});
