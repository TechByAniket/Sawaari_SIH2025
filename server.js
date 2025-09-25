require('dotenv').config();
const express = require('express');

const pool = require('./config/db'); // Correctly import the database pool
const app = express();
const cors = require('cors');
app.use(cors());
const port = 3000;

const busRoutes = require('./routes/busRoutes');
const stopRoutes = require('./routes/stopRoutes');

app.use(express.json());
app.use('/buses', busRoutes);
app.use('/stops', stopRoutes);

// Test database connection before starting the server
async function testDbConnection() {
  try {
    await pool.query('SELECT 1');
    console.log('✅ Database connected successfully!');
  } catch (err) {
    console.error('❌ Database connection failed:', err.stack);
    // You might want to exit the application if the DB connection fails
    process.exit(1); 
  }
}

// Start the server only after the database connection is verified
testDbConnection().then(() => {
  app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
  });
});