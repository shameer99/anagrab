const express = require('express');
const router = express.Router();
const { sharesSameRoot } = require('../utils/gameLogic');
const lemmatizer = require('wink-lemmatizer');
const testCases = require('../data/wordTransformationTests.json');

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
          max-width: 800px;
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
        h2 {
          margin-top: 30px;
          border-bottom: 1px solid #eee;
          padding-bottom: 10px;
        }
        .nav-links {
          margin-top: 30px;
          padding-top: 15px;
          border-top: 1px solid #eee;
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

      <div class="nav-links">
        <p><a href="/debug/test-cases">View Test Cases</a> - See examples of allowed and disallowed word transformations</p>
      </div>
    </body>
    </html>
  `;

  res.send(html);
});

// New route for test cases
router.get('/test-cases', (req, res) => {
  // Pre-evaluate all test cases
  const evaluatedAllowed = testCases.allowed.map(test => ({
    ...test,
    result: sharesSameRoot(test.word1, test.word2),
  }));

  const evaluatedDisallowed = testCases.disallowed.map(test => ({
    ...test,
    result: sharesSameRoot(test.word1, test.word2),
  }));
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Word Transformation Test Cases</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px;
        }
        .test-cases {
          margin-top: 30px;
          display: flex;
          gap: 30px;
        }
        .test-section {
          flex: 1;
        }
        .test-case {
          padding: 15px;
          margin-bottom: 15px;
          border: 1px solid #ddd;
          border-radius: 4px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .allowed {
          border-left: 5px solid #28a745;
        }
        .disallowed {
          border-left: 5px solid #dc3545;
        }
        .test-info {
          flex: 1;
        }
        .test-pair {
          font-weight: bold;
          font-size: 1.1em;
          margin-bottom: 5px;
        }
        .test-explanation {
          font-style: italic;
          color: #555;
        }
        .test-result {
          margin-left: 20px;
          font-size: 1.2em;
        }
        .failure-explanation {
          color: #dc3545;
          font-size: 0.9em;
          margin-top: 5px;
        }
        h1, h2, h3 {
          margin-top: 30px;
          border-bottom: 1px solid #eee;
          padding-bottom: 10px;
        }
        .nav-links {
          margin-top: 30px;
          padding-top: 15px;
          border-top: 1px solid #eee;
        }
        .toggle-container {
          margin: 20px 0;
        }
        .hidden {
          display: none;
        }
      </style>
      <script>
        function toggleFailingCases() {
          const showOnlyFailing = document.getElementById('show-failing').checked;
          const testCases = document.querySelectorAll('.test-case');
          
          testCases.forEach(testCase => {
            const isFailure = testCase.querySelector('.failure-explanation');
            if (showOnlyFailing) {
              testCase.classList.toggle('hidden', !isFailure);
            } else {
              testCase.classList.remove('hidden');
            }
          });
        }
      </script>
    </head>
    <body>
      <h1>Word Transformation Test Cases</h1>
      <p>This page shows examples of allowed and disallowed word transformations and evaluates them with the current algorithm.</p>
      
      <div class="toggle-container">
        <label>
          <input type="checkbox" id="show-failing" onchange="toggleFailingCases()">
          Show only failing test cases
        </label>
      </div>

      <div class="test-cases">
        <div class="test-section">
          <h2>Allowed Transformations</h2>
          <p>These word pairs should be considered to have <strong>different</strong> roots, so they can both be valid words in the game. The algorithm should return <strong>false</strong>.</p>
          
          ${evaluatedAllowed
            .map(
              test => `
            <div class="test-case allowed">
              <div class="test-info">
                <div class="test-pair">"${test.word1}" → "${test.word2}"</div>
                <div class="test-explanation">${test.explanation}</div>
                ${
                  test.result
                    ? `
                <div class="failure-explanation">
                  False Positive: Algorithm incorrectly identified these as sharing the same root
                </div>`
                    : ''
                }
              </div>
              <div class="test-result">
                ${!test.result ? '✅' : '❌'}
              </div>
            </div>
          `
            )
            .join('')}
        </div>
        
        <div class="test-section">
          <h2>Disallowed Transformations</h2>
          <p>These word pairs should be considered to share the <strong>same</strong> root, so they cannot both be valid words in the game. The algorithm should return <strong>true</strong>.</p>
          
          ${evaluatedDisallowed
            .map(
              test => `
            <div class="test-case disallowed">
              <div class="test-info">
                <div class="test-pair">"${test.word1}" → "${test.word2}"</div>
                <div class="test-explanation">${test.explanation}</div>
                ${
                  !test.result
                    ? `
                <div class="failure-explanation">
                  False Negative: Algorithm failed to identify these as sharing the same root
                </div>`
                    : ''
                }
              </div>
              <div class="test-result">
                ${test.result ? '✅' : '❌'}
              </div>
            </div>
          `
            )
            .join('')}
        </div>
      </div>

      <div class="nav-links">
        <p><a href="/debug/shareroot">Back to Test Tool</a></p>
      </div>
    </body>
    </html>
  `;

  res.send(html);
});

module.exports = router;
