export const authValidator = {
  validateRegister(req, res, next) {
    const { fullname, email, password, role, year } = req.body;
    const errors = {};

    if (!fullname || fullname.trim().length === 0) {
      errors.fullname = 'Full name is required';
    }

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = 'A valid email address is required';
    }

    if (!password || password.length < 6) {
      errors.password = 'Password must be at least 6 characters long';
    } else {
      const hasUppercase = /[A-Z]/.test(password);
      const hasLowercase = /[a-z]/.test(password);
      const hasNumber = /[0-9]/.test(password);
      if (!hasUppercase || !hasLowercase || !hasNumber) {
        // Soft validation for password complexity
        // We'll log it or can make it mandatory. Let's make it mandatory for high security:
        errors.password = 'Password must contain at least one uppercase letter, one lowercase letter, and one number';
      }
    }

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ error: 'Validation failed', details: errors });
    }

    next();
  },

  validateLogin(req, res, next) {
    const { email, password } = req.body;
    const errors = {};

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = 'A valid email address is required';
    }

    if (!password) {
      errors.password = 'Password is required';
    }

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ error: 'Validation failed', details: errors });
    }

    next();
  },

  validateForgotPassword(req, res, next) {
    const { email } = req.body;
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'A valid email address is required' });
    }
    next();
  },

  validateResetPassword(req, res, next) {
    const { email, resetToken, newPassword } = req.body;
    const errors = {};

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = 'A valid email address is required';
    }

    if (!resetToken || resetToken.trim().length === 0) {
      errors.resetToken = 'Reset token is required';
    }

    if (!newPassword || newPassword.length < 6) {
      errors.newPassword = 'Password must be at least 6 characters long';
    }

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ error: 'Validation failed', details: errors });
    }

    next();
  },

  validateVerifyEmail(req, res, next) {
    const { email, otp } = req.body;
    const errors = {};

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = 'A valid email address is required';
    }

    if (!otp || otp.length !== 6) {
      errors.otp = 'OTP must be exactly 6 characters';
    }

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ error: 'Validation failed', details: errors });
    }

    next();
  },

  validateVerifyOTP(req, res, next) {
    const { email, otp, type } = req.body;
    const errors = {};

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = 'A valid email address is required';
    }

    if (!otp || otp.length !== 6) {
      errors.otp = 'OTP must be exactly 6 characters';
    }

    if (type && !['EMAIL_VERIFICATION', 'PASSWORD_RESET'].includes(type)) {
      errors.type = 'Invalid OTP verification type';
    }

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ error: 'Validation failed', details: errors });
    }

    next();
  }
};
