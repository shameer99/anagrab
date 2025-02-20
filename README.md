# Anagrab

A real-time multiplayer word game where players compete to form words from shared letters.

## Development Setup

### Prerequisites
- Node.js (v16 or higher)
- npm (v7 or higher)

### Environment Setup
1. Copy the backend environment file:
```bash
cp backend/.env.example backend/.env
```

2. Copy the frontend environment file:
```bash
cp frontend/anagrab-frontend/.env.example frontend/anagrab-frontend/.env
```

### Quick Start
If you haven't installed dependencies yet:
```bash
npm run dev:install
```

If you've already installed dependencies:
```bash
npm run dev
```

### What This Does
- Installs all dependencies for root, frontend, and backend (when using `dev:install`)
- Starts both frontend and backend development servers concurrently
- Auto-reloads backend on file changes using nodemon
- Uses Vite's dev server for frontend hot module replacement

### Server Locations
- Frontend: http://localhost:5173
- Backend: http://localhost:5001

## About Snatch (The Word Game)

Snatch is a fast-paced word game where players compete to form and steal words using letter tiles. Here's how it works:

### Basic Rules
- Letter tiles are revealed one at a time in the center of the play area
- Players can form words using available letters at any time
- Words must be at least 3 letters long
- Once a player claims a word, they keep those letters in front of them

### The "Snatching" Mechanic
- Players can steal (snatch) words from other players by:
  1. Adding letters from the center to make a longer word
  2. Rearranging letters to form a completely new word
- Example: If a player has "CAT", another player could:
  - Add "S" to make "CATS"
  - Add "H" to make "CHAT" 
  - Rearrange with new letters to make "ACTOR"

### Winning
- The game ends when all tiles are revealed and no more valid moves can be made
- The player with the most words typically wins
- Some variations score based on word length or total letters claimed

### Strategy
- Speed is crucial - you must spot opportunities quickly
- Watch other players' words for potential steals
- Sometimes it's worth waiting to form longer words
- Defensive play (making words harder to steal) can be important

This digital adaptation brings the excitement of Snatch to an online multiplayer format while maintaining the core mechanics of the original game.
