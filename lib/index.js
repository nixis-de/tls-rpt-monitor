import 'dotenv/config';

import { createApp } from './app.js';

const port = process.env.PORT || 3000;

const reportsURL = new URL('../tmp/reports', import.meta.url);

const app = createApp({
  reportsURL,
  log: true
});

const server = app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});