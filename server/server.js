const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');
const inventoryRoutes = require('./routes/inventoryRoutes');
const itemRoutes = require('./routes/itemRoutes');
const authRoutes = require('./routes/authRoutes');
const invoiceSettingsRoutes = require('./routes/invoiceSettings');
const logoUploadRoutes = require('./routes/logoUpload');
dotenv.config();

const app = express();

const allowedOrigins = [
  "http://localhost:5173",
  "http://127.0.0.1:3000",
  "https://vyapaarbuddy.store"
];

app.use(cors({
  origin: function (origin, callback) {
    // allow requests with no origin (like curl or mobile apps)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = "The CORS policy for this site does not allow access from the specified Origin.";
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true
}));


app.use(express.json({ limit: '10mb' }));

// Routes

app.use('/api', inventoryRoutes); 
app.use('/api/auth', authRoutes);
app.use('/api/inventory', require('./routes/inventory'));
app.use('/api/invoice', require('./routes/invoices'));
app.use('/api/transactions', require('./routes/transaction'));
app.use('/api/items', itemRoutes);
app.use('/api/invoice-settings', invoiceSettingsRoutes);
app.use('/api/logo', logoUploadRoutes);
app.use('/uploads', express.static('uploads'));

const axios = require("axios");


const SELF_URL = "https://vyapaarbuddy.onrender.com";

setInterval(() => {
  axios
    .get(SELF_URL)
    .then(() => {
      console.log("Self ping successful");
    })
    .catch((err) => {
      console.log("Self ping failed", err.message);
    });
}, 2 * 60 * 1000); 





const startServer = async () => {
  try {
    await connectDB();
    console.log('✅ MongoDB connected');

    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('❌ Failed to connect to MongoDB:', err);
    process.exit(1);
  }
};

startServer();

