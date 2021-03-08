const mongoose = require('mongoose');
const slugify = require('slugify');

const itemSchema = new mongoose.Schema(
  {
    nombre: {
      type: String,
      required: [true, 'Los items deben tener un nombre'],
      unique: true,
      trim: true,
      maxlength: [40, 'Los items deben tener un nombre entre 10-40 caracteres'],
      minlength: [10, 'Los items deben tener un nombre entre 10-40 caracteres'],
    },
    precio: {
      type: Number,
      required: [true, 'Todo item debe tener un precio'],
    },
    stock: {
      type: Number,
      default: 20,
    },
    descripcion: {
      type: String,
      trim: true,
      required: [true, 'Los items deben tener una descripción'],
    },
    categoria: {
      type: [String],
      required: [true, 'Un item debe pertenecer al menos a una categoría'],
      enum: {
        values: [
          'ensalada',
          'snack',
          'vegetariano',
          'vegano',
          'gluten free',
          'hamburguesa',
          'postre',
          'jugo',
          'refresco',
          'cafetería',
        ],
        message: 'Una/s de las categorías escritas no existe',
      },
    },
    ingredientes: {
      type: String,
      required: [true, 'Un item debe tener especificado los ingredientes'],
    },
    slug: { type: String },
    vecesPedido: { type: Number, default: 0 },
    tipo: {
      type: String,
      required: [true, 'Un item debe tener especificado su tipo'],
      enum: {
        values: ['comida', 'bebida'],
        message: 'El tipo del item puede ser bebida o comida',
      },
    },
    menuDelDia: { type: Boolean, default: false },
    imagen: { type: String },
    creadoEl: {
      type: Date,
      default: Date.now(),
      select: false,
    },
    dia: { type: Number, select: false },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

itemSchema.pre('save', function (next) {
  this.slug = slugify(this.nombre, { lower: true });
  next();
});

itemSchema.methods.updateSlug = function () {
  const newNameSlug = slugify(this.nombre, { lower: true });
  if (newNameSlug !== this.slug) this.slug = newNameSlug;
};

const Item = mongoose.model('Item', itemSchema);

module.exports = Item;
