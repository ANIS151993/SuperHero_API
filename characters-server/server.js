import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
// Import Routes
import superheroCharacterRoutes from './routes/SuperheroCharacter.js';

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json()); // To parse JSON bodies

// Use Routes
app.use('/api/superhero-characters', superheroCharacterRoutes);

// Root Route
app.get('/', (req, res) => {
  res.send('Welcome to the SuperHero Characters API');
});

// Connect to MongoDB and Start Server
const PORT = process.env.PORT || 5500;
const DB_CONNECTION_STRING = process.env.DB_CONNECTION_STRING;

const mongooseOptions = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
};

mongoose
  .connect(DB_CONNECTION_STRING, mongooseOptions)
  .then(() => {
    console.log('Connected to MongoDB');
    app.listen(PORT, () =>
      console.log(`Server running on http://localhost:${PORT}`)
    );
  })
  .catch((error) => {
    console.error('Error connecting to MongoDB:', error.message);
    process.exit(1);
  });
