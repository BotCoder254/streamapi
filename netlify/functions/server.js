const serverless = require('serverless-http');
const express = require('express');
const path = require('path');
const fs = require('fs');

// Set up the server path
let serverPath;
if (fs.existsSync(path.join(__dirname, '../../server.js'))) {
  serverPath = path.join(__dirname, '../../server.js');
} else if (fs.existsSync(path.join(__dirname, '../../../server.js'))) {
  serverPath = path.join(__dirname, '../../../server.js');
}

// Import the Express app from your main server.js file
const app = require(serverPath);

// Export the serverless function
module.exports.handler = serverless(app); 