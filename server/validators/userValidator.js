export const userValidator = {
  validateProfileUpdate(req, res, next) {
    const { fullname, bio, skills, education, socialLinks } = req.body;
    const errors = {};

    if (fullname !== undefined && fullname.trim().length === 0) {
      errors.fullname = 'Full name cannot be empty';
    }

    if (skills !== undefined && !Array.isArray(skills)) {
      errors.skills = 'Skills must be an array of strings';
    }

    if (education !== undefined && !Array.isArray(education)) {
      errors.education = 'Education must be an array of schools';
    }

    if (socialLinks !== undefined && typeof socialLinks !== 'object') {
      errors.socialLinks = 'Social links must be an object';
    }

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ error: 'Validation failed', details: errors });
    }

    next();
  },

  validatePrivacySettings(req, res, next) {
    const { privacySettings } = req.body;
    if (!privacySettings || typeof privacySettings !== 'object') {
      return res.status(400).json({ error: 'Privacy settings must be an object' });
    }
    next();
  },

  validateNotificationSettings(req, res, next) {
    const { notificationSettings } = req.body;
    if (!notificationSettings || typeof notificationSettings !== 'object') {
      return res.status(400).json({ error: 'Notification settings must be an object' });
    }
    next();
  }
};
