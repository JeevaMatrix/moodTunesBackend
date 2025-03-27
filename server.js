// server/index.js
const express = require('express');
const mongoose = require('mongoose');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

const User = require('./models/User');
const Log = require('./models/Log');

const app = express();
// app.use(cors({
//   origin: "https://moodtuner.netlify.app", // your deployed frontend
//   credentials: true // if you're using cookies or auth headers
// }));

const allowedOrigins = ['http://localhost:3000', 'https://moodtuner.netlify.app'];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));

app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB Error:', err));

// --- Routes ---

// User Signup
app.post('/signup', async (req, res) => {
    const { username, email, password } = req.body;
  
    // Check if email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email already exists' });
    }
  
    // Save new user
    const newUser = new User({ username, email, password });
    await newUser.save();
  
    res.json({ success: true, userId: newUser._id });
  });
  
// Basic login (no auth)
app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email, password });
  if (user) {
    res.json({ success: true, userId: user._id, user: user.username});
  } else {
    res.status(401).json({ success: false, message: 'Invalid credentials' });
  }
});

//song fetch
app.get('/songs/:mood', async (req, res) => {
    const mood = req.params.mood;
    const lang = req.query.lang || 'English';
    const apiKey = process.env.YOUTUBE_API_KEY;
    const query = `${mood} ${lang} music`;

  
    try {
      const response = await axios.get(
        `https://www.googleapis.com/youtube/v3/search`,
        {
          params: {
            key: apiKey,
            q: query,
            part: 'snippet',
            maxResults: 32,
            type: 'video',
            videoEmbeddable: 'true',
          }
        }
      );
  
      const videos = response.data.items.map(item => ({
        title: item.snippet.title,
        videoId: item.id.videoId,
        thumbnail: item.snippet.thumbnails.medium.url
      }));
  
      res.json({ success: true, videos, nextPageToken: response.data.nextPageToken || null});
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: 'Error fetching songs' });
    }
  });
  

// Log mood selection
app.post('/log', async (req, res) => {
  const { userId, mood } = req.body;
  const log = new Log({ userId, mood });
  await log.save();
  res.json({ success: true });
});

// Get mood logs (optional route)
app.get('/logs/:userId', async (req, res) => {
  const logs = await Log.find({ userId: req.params.userId });
  res.json(logs);
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
