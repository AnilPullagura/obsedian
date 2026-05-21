import app from './app';
import { testConnection } from './config/db';

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  console.log('🏁 Starting Obsidian Luxe server boot sequence...');
  
  
  const dbConnected = await testConnection();
  if (!dbConnected) {
    console.error('❌ Critical failure: Unable to establish database connection. Aborting startup.');
    process.exit(1);
  }

  
  app.listen(PORT, () => {
    console.log(`📡 Obsidian Luxe Server listening on port: ${PORT}`);
    console.log(`👉 Environment: ${process.env.NODE_ENV || 'development'}`);
  });
};


startServer();
