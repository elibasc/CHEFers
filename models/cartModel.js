const mongoose = require('mongoose');

const cartSchema = new mongoose.Schema(
  {
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
    createdAt: { type: Date, index: { expires: '30m' }, default: Date.now },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

cartSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 });
cartSchema.virtual('total').get(function () {
  if (this.items[0]) {
    return this.items.map((i) => i.subTotal).reduce((a, b) => a + b);
  }
});

const Cart = mongoose.model('Cart', cartSchema);

module.exports = Cart;
