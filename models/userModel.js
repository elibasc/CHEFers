const crypto = require('crypto');
const mongoose = require('mongoose');
const passportLocalMongoose = require('passport-local-mongoose');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
  },
  nombre: {
    type: String,
    required: [true, 'Debe introducir su nombre'],
  },
  apellido: {
    type: String,
    required: [true, 'Debe introducir su apellido'],
  },
  rol: {
    type: String,
    default: 'mozo',
    enum: {
      values: ['mozo', 'chef', 'admin', 'manager'],
    },
  },
  foto: { type: String },
  cartId: {
    type: String,
    default: null,
  },
  passwordConfirm: {
    type: String,
    required: [true, 'Por favor confirme su contraseña'],
  },
  passwordResetToken: String,
  passwordResetExpires: Date,
  active: {
    type: Boolean,
    default: true,
    select: false,
  },
  createdAt: { type: Date, default: Date.now },
});

const passportOptions = {
  errorMessages: {
    MissingPasswordError: 'Por favor introducir contraseña.',
    AttemptTooSoonError:
      'Esta cuenta se encuentra bloqueada. Vuelva a intentarlo más tarde.',
    TooManyAttemptsError:
      'Cuenta bloqueada debido a cantidad de intentos fallidos.',
    NoSaltValueStoredError: 'Autenticación fallida. No hay ningun salt.',
    IncorrectPasswordError: 'La contraseña o el username no son correctos.',
    IncorrectUsernameError: 'La contraseña o el username no son correctos.',
    MissingUsernameError: 'Por favor introducir username.',
    UserExistsError: 'Ya existe un user con ese username.',
  },
};
userSchema.pre('save', function (next) {
  this.passwordConfirm = undefined;
  next();
});
userSchema.plugin(passportLocalMongoose, passportOptions);

userSchema.methods.createForgotPasswordToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex');

  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

  return resetToken;
};

module.exports = mongoose.model('User', userSchema);
