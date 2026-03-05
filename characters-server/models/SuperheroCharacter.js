// models/SuperHeroCharacter.js
import mongoose from 'mongoose';

const { Schema } = mongoose;

const superheroCharacterSchema = new Schema(
  {
    id: {
      type: Number,
      unique: true,
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    fullName: {
      type: String,
      default: "Unknown",
      trim: true,
    },
    publisher: {
      type: String,
      default: "Unknown",
      trim: true,
    },
    alignment: {
      type: String,
      default: "neutral",
      trim: true,
    },
    gender: {
      type: String,
      default: "Unknown",
      trim: true,
    },
    race: {
      type: String,
      default: "Unknown",
      trim: true,
    },
    firstAppearance: {
      type: String,
      default: "Unknown",
      trim: true,
    },
    image: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt fields
    collection: 'superheroCharacters' // Custom collection name
  }
);

const characters = mongoose.model('characters', superheroCharacterSchema);

export default characters;
