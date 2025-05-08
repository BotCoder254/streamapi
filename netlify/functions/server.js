const express = require('express');
const serverless = require('serverless-http');
const app = require('../../server'); // Import your Express app

// Handle Netlify functions
const handler = serverless(app);

module.exports = {
  handler: async (event, context) => {
    // Add CORS headers
    const response = await handler(event, context);
    response.headers = {
      ...response.headers,
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE'
    };
    return response;
  }
}; 