import 'dotenv/config';

export default ({ config }) => ({
  ...config,
  extra: {
    ...config.extra,
    USDA_API_KEY: process.env.USDA_API_KEY,
  },
});
