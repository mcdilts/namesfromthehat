const path = require('path');
const express = require('express')
const app = require('./api/index.js'); // Ensure the path is correct

const PORT = process.env.PORT || 3003;

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Fallback for serving static files for other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
