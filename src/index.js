import dotenv from 'dotenv';
import connectDB from './db/index.js'; // Fixed typo
import { app } from './app.js';

dotenv.config({ path: './.env' }); // Ensures dotenv reads the .env file

const startServer = async () => {
  try {
    // Connect to the database
    await connectDB();
    console.log("Connected to DATABASE successfully!");

    // Start the server
    const PORT = process.env.PORT || 8000;
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server is running on http://localhost:${PORT}`);
    });

    // Handle server errors
    app.on('error', (err) => {
      console.error("Server encountered an error: ", err);
    });
  } catch (error) {
    console.error("DB Connection FAILED: ", error);
    process.exit(1); // Exit process if DB connection fails
  }
};

// Start the server
startServer();
