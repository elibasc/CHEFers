const Item = require('../models/itemModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const factory = require('./handlerFactory');

exports.createItem = factory.createOne(Item);
exports.getAllItems = factory.getAll(Item);
exports.getOneItem = factory.getOne(Item, 'item');
exports.updateItem = factory.updateOne(Item, 'item');
exports.deleteItem = factory.deleteOne(Item, 'Item');

exports.updateMenu = catchAsync(async (req, res, next) => {
  const date = new Date();
  const day = date.getDay();
  await Item.updateMany({}, { menuDelDia: false }).updateMany(
    { dia: day },
    { menuDelDia: true }
  );
  next();
});

exports.menuDelDia = catchAsync(async (req, res, next) => {
  const menu = await Item.find({ menuDelDia: true });
  if (!menu) {
    return next(new AppError('Hoy no hay menú del día', 404));
  }
  res.status(200).json({
    status: 'success',
    results: menu.length,
    menu,
  });
});

exports.getTopMenu = catchAsync(async (req, res, next) => {
  const stats = await Item.aggregate([
    { $match: { tipo: 'comida' } },
    { $sort: { vecesPedido: -1 } },
    { $limit: 5 },
  ]);

  res.status(200).json({
    status: 'success',
    results: stats.length,
    top: stats,
  });
});
