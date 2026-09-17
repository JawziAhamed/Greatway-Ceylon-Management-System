const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
    },
    code: {
      type: String,
      trim: true,
      uppercase: true,
    },
    description: {
      type: String,
      trim: true,
    },
    category: {
      type: String,
      default: 'Fresh Produce',
      trim: true,
    },
    unit: {
      type: String,
      default: 'Cartons',
      trim: true,
    },
    defaultWeightPerBox: {
      type: String,
      trim: true,
      default: '5.5 kg',
    },
    defaultRatePerNutKg: {
      type: Number,
      default: 0,
    },
    defaultBoxRate: {
      type: Number,
      default: 0,
    },
    currency: {
      type: String,
      default: 'USD',
      uppercase: true,
      trim: true,
    },
    active: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Product', productSchema);
