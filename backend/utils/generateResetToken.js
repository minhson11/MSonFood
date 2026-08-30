const crypto = require('crypto');

// Generate cryptographically secure random token
const generateResetToken = () => {
  // Generate 32 bytes random token
  const resetToken = crypto.randomBytes(32).toString('hex');
  
  // Hash token before storing in database
  const resetTokenHash = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  
  return {
    resetToken, // Send this to user via email
    resetTokenHash // Store this in database
  };
};

module.exports = generateResetToken;
