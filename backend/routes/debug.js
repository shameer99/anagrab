const express = require('express');
const router = express.Router();
const { sharesSameRoot } = require('../utils/gameLogic');
const testCases = require('../data/wordTransformationTests.json');
const {
  createGame,
  getGame,
  joinGame,
  leaveGame,
  listGames,
  DEFAULT_GAME_ID,
} = require('../gameState');

// Debug route for testing sharesSameRoot function
router.get('/shareroot', (req, res) => {
  const { word1, word2 } = req.query;
  let result = null;
  let word1Forms = [];
  let word2Forms = [];

  if (word1 && word2) {
    result = sharesSameRoot(word1, word2);
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
          <h2>Allowed Transformations (!sharesSameRoot)</h2>
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
          <h2>Disallowed Transformations (sharesSameRoot)</h2>
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

// List all games
router.get('/games', (req, res) => {
  const games = listGames();
  res.json({
    games,
    defaultGameId: DEFAULT_GAME_ID,
  });
});

// Get a specific game
router.get('/games/:gameId', (req, res) => {
  const { gameId } = req.params;
  const game = getGame(gameId);

  if (!game) {
    return res.status(404).json({ error: 'Game not found' });
  }

  res.json(game);
});

// Create a new game
router.post('/games', (req, res) => {
  const hostId = req.body.hostId || 'debug-user';
  const settings = req.body.settings || {};

  const game = createGame(hostId, settings);
  res.json(game);
});

// Add a player to a game
router.post('/games/:gameId/players', (req, res) => {
  const { gameId } = req.params;
  const { playerId, playerName } = req.body;

  if (!playerId || !playerName) {
    return res.status(400).json({ error: 'Player ID and name are required' });
  }

  const game = joinGame(gameId, playerId, playerName);

  if (!game) {
    return res.status(404).json({ error: 'Game not found' });
  }

  res.json(game);
});

// Remove a player from a game
router.delete('/games/:gameId/players/:playerId', (req, res) => {
  const { gameId, playerId } = req.params;

  const game = leaveGame(gameId, playerId);

  if (!game) {
    return res.status(404).json({ error: 'Game not found' });
  }

  res.json(game);
});

// Multi-game debug UI
router.get('/multi-game', (req, res) => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Multi-Game Debug</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px;
        }
        .container {
          display: flex;
          gap: 20px;
        }
        .panel {
          flex: 1;
          border: 1px solid #ccc;
          border-radius: 5px;
          padding: 15px;
        }
        .game-list {
          list-style: none;
          padding: 0;
        }
        .game-item {
          padding: 10px;
          margin-bottom: 5px;
          background-color: #f5f5f5;
          border-radius: 3px;
          cursor: pointer;
        }
        .game-item:hover {
          background-color: #e0e0e0;
        }
        .game-item.selected {
          background-color: #d0e0ff;
        }
        .form-group {
          margin-bottom: 15px;
        }
        label {
          display: block;
          margin-bottom: 5px;
        }
        input, button {
          padding: 8px;
          width: 100%;
          box-sizing: border-box;
        }
        button {
          background-color: #4CAF50;
          color: white;
          border: none;
          cursor: pointer;
          margin-top: 10px;
        }
        button:hover {
          background-color: #45a049;
        }
        pre {
          background-color: #f5f5f5;
          padding: 10px;
          border-radius: 3px;
          overflow: auto;
          max-height: 400px;
        }
      </style>
    </head>
    <body>
      <h1>Multi-Game Debug Interface</h1>
      <div class="container">
        <div class="panel">
          <h2>Games</h2>
          <button id="refreshGames">Refresh Games</button>
          <button id="createGame">Create New Game</button>
          <ul id="gameList" class="game-list"></ul>
        </div>
        <div class="panel">
          <h2>Game Details</h2>
          <div id="gameDetails">
            <p>Select a game to view details</p>
          </div>
        </div>
        <div class="panel">
          <h2>Actions</h2>
          <div class="form-group">
            <label for="gameId">Game ID:</label>
            <input type="text" id="gameId" placeholder="Enter game ID">
          </div>
          <div class="form-group">
            <label for="playerId">Player ID:</label>
            <input type="text" id="playerId" placeholder="Enter player ID">
          </div>
          <div class="form-group">
            <label for="playerName">Player Name:</label>
            <input type="text" id="playerName" placeholder="Enter player name">
          </div>
          <button id="addPlayer">Add Player to Game</button>
          <button id="removePlayer">Remove Player from Game</button>
        </div>
      </div>

      <script>
        // Helper function to fetch and display games
        async function fetchGames() {
          try {
            const response = await fetch('/debug/games');
            const data = await response.json();
            
            const gameList = document.getElementById('gameList');
            gameList.innerHTML = '';
            
            data.games.forEach(game => {
              const li = document.createElement('li');
              li.className = 'game-item';
              li.textContent = \`\${game.id} (\${game.playerCount} players)\`;
              li.dataset.gameId = game.id;
              li.addEventListener('click', () => fetchGameDetails(game.id));
              gameList.appendChild(li);
            });
            
            // Highlight default game
            const defaultGameItem = Array.from(gameList.children).find(
              item => item.dataset.gameId === data.defaultGameId
            );
            if (defaultGameItem) {
              defaultGameItem.textContent += ' (Default)';
              defaultGameItem.style.fontWeight = 'bold';
            }
          } catch (error) {
            console.error('Error fetching games:', error);
          }
        }
        
        // Fetch and display game details
        async function fetchGameDetails(gameId) {
          try {
            const response = await fetch(\`/debug/games/\${gameId}\`);
            const game = await response.json();
            
            const gameDetails = document.getElementById('gameDetails');
            gameDetails.innerHTML = \`
              <h3>Game ID: \${game.id}</h3>
              <p>Host: \${game.host}</p>
              <p>Active: \${game.isActive ? 'Yes' : 'No'}</p>
              <p>Created: \${new Date(game.createdAt).toLocaleString()}</p>
              <p>Pot Size: \${game.pot.length}</p>
              <p>Deck Size: \${game.deck}</p>
              <h4>Players (\${Object.keys(game.players).length}):</h4>
              <pre>\${JSON.stringify(game.players, null, 2)}</pre>
            \`;
            
            // Update the gameId input field
            document.getElementById('gameId').value = gameId;
            
            // Highlight the selected game
            const gameItems = document.querySelectorAll('.game-item');
            gameItems.forEach(item => {
              if (item.dataset.gameId === gameId) {
                item.classList.add('selected');
              } else {
                item.classList.remove('selected');
              }
            });
          } catch (error) {
            console.error('Error fetching game details:', error);
          }
        }
        
        // Create a new game
        async function createNewGame() {
          try {
            const response = await fetch('/debug/games', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                hostId: 'debug-' + Date.now(),
                settings: {}
              })
            });
            
            const game = await response.json();
            console.log('Created game:', game);
            
            // Refresh the game list
            fetchGames();
            
            // Show the new game details
            fetchGameDetails(game.id);
          } catch (error) {
            console.error('Error creating game:', error);
          }
        }
        
        // Add a player to a game
        async function addPlayerToGame() {
          const gameId = document.getElementById('gameId').value;
          const playerId = document.getElementById('playerId').value;
          const playerName = document.getElementById('playerName').value;
          
          if (!gameId || !playerId || !playerName) {
            alert('Game ID, Player ID, and Player Name are required');
            return;
          }
          
          try {
            const response = await fetch(\`/debug/games/\${gameId}/players\`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                playerId,
                playerName
              })
            });
            
            if (!response.ok) {
              const error = await response.json();
              throw new Error(error.error || 'Failed to add player');
            }
            
            const game = await response.json();
            console.log('Added player to game:', game);
            
            // Refresh the game details
            fetchGameDetails(gameId);
            // Refresh the game list to update player counts
            fetchGames();
          } catch (error) {
            console.error('Error adding player:', error);
            alert(error.message);
          }
        }
        
        // Remove a player from a game
        async function removePlayerFromGame() {
          const gameId = document.getElementById('gameId').value;
          const playerId = document.getElementById('playerId').value;
          
          if (!gameId || !playerId) {
            alert('Game ID and Player ID are required');
            return;
          }
          
          try {
            const response = await fetch(\`/debug/games/\${gameId}/players/\${playerId}\`, {
              method: 'DELETE'
            });
            
            if (!response.ok) {
              const error = await response.json();
              throw new Error(error.error || 'Failed to remove player');
            }
            
            const game = await response.json();
            console.log('Removed player from game:', game);
            
            // Refresh the game details
            fetchGameDetails(gameId);
            // Refresh the game list to update player counts
            fetchGames();
          } catch (error) {
            console.error('Error removing player:', error);
            alert(error.message);
          }
        }
        
        // Set up event listeners
        document.getElementById('refreshGames').addEventListener('click', fetchGames);
        document.getElementById('createGame').addEventListener('click', createNewGame);
        document.getElementById('addPlayer').addEventListener('click', addPlayerToGame);
        document.getElementById('removePlayer').addEventListener('click', removePlayerFromGame);
        
        // Initialize the page
        fetchGames();
      </script>
    </body>
    </html>
  `;

  res.send(html);
});

module.exports = router;
