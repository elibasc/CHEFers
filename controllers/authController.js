const crypto = require('crypto');
const passport = require('passport');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const sendEmail = require('../utils/email');

const signToken = (id) => {
  return jwt.sign({ id: id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

const createSendToken = (user, status, req, res) => {
  const token = signToken(user._id);

  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
    secure: req.secure || req.headers['x-fowarded-proto'] === 'https',
  };
  res.cookie('jwt', token, cookieOptions);
  res.status(status).json({
    status: 'success',
    token,
    data: {
      id: req.user._id,
      username: req.user.username,
      email: req.user.email,
      nombreCompleto: `${req.user.nombre} ${req.user.apellido}`,
    },
  });
};

exports.signUpUser = catchAsync(async (req, res, next) => {
  const {
    email,
    username,
    password,
    nombre,
    apellido,
    passwordConfirm,
  } = req.body;

  if (password !== passwordConfirm) {
    return next(new AppError('Las contraseñas no coinciden', 400));
  }

  const user = new User({ email, username, nombre, apellido, passwordConfirm });
  const newUser = await User.register(user, password);
  req.user = newUser;

  createSendToken(newUser, 201, req, res);
});

exports.logInUser = catchAsync(async (req, res, next) => {
  passport.authenticate('local', function (err, user, info) {
    if (err) {
      return next(err);
    }
    if (!user) {
      const message =
        info.message === 'Missing credentials'
          ? 'Por favor introduzca username y password.'
          : 'La contraseña o el username no son correctos.';
      return next(new AppError(message, 401));
    }
    req.login(user, { session: false }, (loginErr) => {
      if (loginErr) {
        return next(loginErr);
      }
      createSendToken(user, 200, req, res);
    });
  })(req, res, next);
});

exports.logOut = catchAsync(async (req, res, next) => {
  req.logout();
  res.cookie('jwt', 'loggedout', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });

  res.status(200).json({
    status: 'success',
    message: 'Sesión cerrada con éxito',
  });
});

exports.protect = (req, res, next) => {
  passport.authenticate('jwt', { session: false }, (err, user, info) => {
    if (info) {
      return next(
        new AppError(
          'Debe iniciar sesión en /login para tener acceso a esta ruta',
          401
        )
      );
    }
    if (err) {
      return next(
        new AppError(
          'Hubo un error, por favor vuelve a intentarlo más tarde',
          500
        )
      );
    }
    if (!user) {
      return next(
        new AppError('Este usuario no existe, vuelva a iniciar sesión', 401)
      );
    }

    req.user = user;
    next();
  })(req, res, next);
};

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.rol)) {
      return next(new AppError('No tienes permiso para realizar esta acción!'));
    }
    next();
  };
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new AppError('Ningún user pertenece a ese email', 404));
  }
  const resetToken = user.createForgotPasswordToken();
  await user.save({ validateBeforeSave: false });

  const resetURL = `${req.protocol}://${req.get(
    'host'
  )}/api/v1/user/reset-password/${resetToken}`;
  const message = `Olvidó su contraseña? Realiza un PATCH request con su nuevo "password" a : ${resetURL}
  \nSi no olvidó su contraseña, por favor ignore este mensaje.`;

  try {
    await sendEmail({
      email: user.email,
      subject: 'Cambio de contraseña (valido por 10 minutos)',
      message,
    });
    res.status(200).json({
      status: 'success',
      message: 'El token fue envíado a su email!',
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return next(
      new AppError(
        'Ocurrió un error enviando el email. Por favor vuelva a intentarlo',
        500
      )
    );
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  const newPassword = req.body.password;
  const newPasswordConfirm = req.body.passwordConfirm;
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  if (!user) {
    return next(new AppError('El token es inválido o ya ha expirado!', 400));
  }

  if (newPassword !== newPasswordConfirm && newPasswordConfirm) {
    return next(new AppError('Las contraseñas no coinciden.', 401));
  }
  user.passwordConfirm = newPasswordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  user.setPassword(newPassword, (error, user) => {
    if (error) {
      return next(new AppError('Ha ocurrido un error', 500));
    }
    user.save({ validateBeforeSave: false }, (err, user) => {
      if (err) {
        return next(new AppError('Ha ocurrido un error', 500));
      }
      passport.authenticate('local', function (error, user, info) {
        if (error) {
          return next(new AppError('Ha ocurrido un error', 500));
        }
        req.login(user, { session: false }, (loginErr) => {
          if (loginErr) {
            return next(loginErr);
          }
        });
      })(req, res, next);
    });
  });
  req.user = user;
  createSendToken(user, 200, req, res);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user.id);
  const { oldPassword, newPassword, newPasswordConfirm } = req.body;
  if (newPassword !== newPasswordConfirm) {
    return next(new AppError('Confirme su nueva contraseña!'));
  }
  user.passwordConfirm = newPasswordConfirm;
  const passwordChange = await user.changePassword(oldPassword, newPassword);
  console.log(passwordChange);
  createSendToken(user, 200, req, res);
});
