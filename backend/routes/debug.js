const express = require('express');
const router = express.Router();
const { sharesSameRoot } = require('../utils/gameLogic');
const lemmatizer = require('wink-lemmatizer');
const testCases = require('../data/wordTransformationTests.json');
const path = require('path');
const fs = require('fs');
const Handlebars = require('handlebars');

// Load and compile templates
const shareRootTemplate = Handlebars.compile(
  fs.readFileSync(path.join(__dirname, '../views/debug/shareroot.html'), 'utf8')
);
const testCasesTemplate = Handlebars.compile(
  fs.readFileSync(path.join(__dirname, '../views/debug/test-cases.html'), 'utf8')
);

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

  const html = shareRootTemplate({
    word1: word1 || '',
    word2: word2 || '',
    result: result,
    word1Forms: word1Forms,
    word2Forms: word2Forms,
  });

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

  const html = testCasesTemplate({
    allowedTests: evaluatedAllowed,
    disallowedTests: evaluatedDisallowed,
  });

  res.send(html);
});

module.exports = router;
