const express = require('express');
const router = express.Router();
const { sharesSameRoot } = require('../utils/gameLogic');
const lemmatizer = require('wink-lemmatizer');

// Debug route for testing sharesSameRoot function
router.get('/shareroot', (req, res) => {
  const { word1, word2 } = req.query;
  let result = null;
  let word1Forms = [];
  let word2Forms = [];

  if (word1 && word2) {
    result = sharesSameRoot(word1, word2);

    word1Forms = [
      lemmatizer.noun(word1.toLowerCase()),
      lemmatizer.verb(word1.toLowerCase()),
      lemmatizer.adjective(word1.toLowerCase()),
    ];

    word2Forms = [
      lemmatizer.noun(word2.toLowerCase()),
      lemmatizer.verb(word2.toLowerCase()),
      lemmatizer.adjective(word2.toLowerCase()),
    ];
  }

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Test sharesSameRoot Function</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .form-group {
          margin-bottom: 15px;
        }
        label {
          display: block;
          margin-bottom: 5px;
        }
        input {
          padding: 8px;
          width: 100%;
          box-sizing: border-box;
        }
        button {
          padding: 10px 15px;
          background-color: #4a72f5;
          color: white;
          border: none;
          cursor: pointer;
        }
        .result {
          margin-top: 20px;
          padding: 15px;
          border: 1px solid #ddd;
          border-radius: 4px;
        }
        .true {
          background-color: #d4edda;
          color: #155724;
        }
        .false {
          background-color: #f8d7da;
          color: #721c24;
        }
      </style>
    </head>
    <body>
      <h1>Test sharesSameRoot Function</h1>
      <form action="/debug/shareroot" method="get">
        <div class="form-group">
          <label for="word1">Word 1:</label>
          <input type="text" id="word1" name="word1" value="${word1 || ''}" required>
        </div>
        <div class="form-group">
          <label for="word2">Word 2:</label>
          <input type="text" id="word2" name="word2" value="${word2 || ''}" required>
        </div>
        <button type="submit">Check</button>
      </form>
      
      ${
        result !== null
          ? `
        <div class="result ${result}">
          <h2>Result:</h2>
          <p>Do "${word1}" and "${word2}" share the same root? <strong>${result}</strong></p>
          
          <h3>Word Forms:</h3>
          <h4>${word1}:</h4>
          <ul>
            <li>Noun form: ${word1Forms[0]}</li>
            <li>Verb form: ${word1Forms[1]}</li>
            <li>Adjective form: ${word1Forms[2]}</li>
          </ul>
          
          <h4>${word2}:</h4>
          <ul>
            <li>Noun form: ${word2Forms[0]}</li>
            <li>Verb form: ${word2Forms[1]}</li>
            <li>Adjective form: ${word2Forms[2]}</li>
          </ul>
        </div>
      `
          : ''
      }
    </body>
    </html>
  `;

  res.send(html);
});

module.exports = router;
