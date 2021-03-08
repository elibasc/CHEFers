const mongoose = require('mongoose');
const Item = require('./itemModel');

const orderSchema = new mongoose.Schema({
  items: [
    {
      item: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Item',
      },
      qty: { type: Number, default: 1 },
      comentarios: [{ type: String }],
      subTotal: { type: Number, default: 0 },
    },
  ],
  total: { type: Number },
  estado: {
    type: String,
    default: 'recibida',
    enum: {
      values: ['recibida', 'en elaboración', 'completa'],
    },
  },
  pago: { type: Boolean, default: false },
  mesa: { type: Number, required: true },
  creadaPor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'La orden precisa ser creada por un user'],
  },
  createdAt: { type: Date, index: { expires: '20d' }, default: Date.now },
});

orderSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 });

orderSchema.statics.calcVecesPedido = async function (itemId) {
  const stats = await this.aggregate([
    { $unwind: '$items' },
    { $match: { 'items.item': itemId } },
    {
      $group: {
        _id: '$items.item',
        nPedido: { $sum: '$items.qty' },
      },
    },
  ]);

  await Item.findByIdAndUpdate(itemId, { vecesPedido: stats[0].nPedido });
};

orderSchema.post('save', function () {
  const itemArr = this.items;
  itemArr.forEach((i) => this.constructor.calcVecesPedido(i.item, i.qty));
});

const Order = mongoose.model('Order', orderSchema);
module.exports = Order;
