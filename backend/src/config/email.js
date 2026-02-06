const fs = require('fs');
const path = require('path');

const defaultConfig = {
  enabled: false,
  provider: 'gmail',
  fromEmail: '',
  appUrl: 'http://localhost:5173',
  smtp: {
    host: '',
    port: 465,
    user: '',
    pass: '',
    secure: true
  }
};

const loadEmailConfig = () => {
  const configPath = path.resolve(__dirname, '../../config/email.json');
  if (!fs.existsSync(configPath)) {
    return defaultConfig;
  }

  try {
    const raw = fs.readFileSync(configPath, 'utf8');
    const parsed = JSON.parse(raw);
    return {
      ...defaultConfig,
      ...parsed,
      smtp: {
        ...defaultConfig.smtp,
        ...(parsed.smtp || {})
      }
    };
  } catch (error) {
    return defaultConfig;
  }
};

module.exports = {
  loadEmailConfig
};
