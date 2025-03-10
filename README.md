# Anagrab

A real-time multiplayer word game where players compete to form words from shared letters.

## Development Setup

### Prerequisites

- Node.js (v16 or higher)
- npm (v7 or higher)

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

| Environment | Frontend                    | Backend                       |
| ----------- | --------------------------- | ----------------------------- |
| Development | http://localhost:5173       | http://localhost:5001         |
| Production  | https://anagrab.vercel.app/ | https://anagrab.onrender.com/ |

### Debug

The debug interface provides tools for testing word root comparisons and transformation rules:

| Page         | Description                                                                         | Local URL                              | Production URL                                |
| ------------ | ----------------------------------------------------------------------------------- | -------------------------------------- | --------------------------------------------- |
| Root Checker | Test if two words share the same root using the game's algorithm                    | http://localhost:5001/debug/shareroot  | https://anagrab.onrender.com/debug/shareroot  |
| Test Cases   | View and validate predefined test cases for allowed/disallowed word transformations | http://localhost:5001/debug/test-cases | https://anagrab.onrender.com/debug/test-cases |

## About Snatch (The Word Game)

Snatch is a fast-paced word game where players compete to form and steal words using letter tiles. Here's how it works:

### Basic Rules

- Letter tiles are revealed one at a time in the center of the play area
- Players can form words using available letters at any time
- Words must be at least 4 letters long
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
