# Anagrab Frontend

A modern, responsive frontend for the Anagrab word game built with React, Tailwind CSS, and Framer Motion.

## Features

- 🎮 Real-time multiplayer word game using WebSockets
- 🎨 Modern, clean UI with animations and responsive design
- 📱 Mobile-friendly layout that works on all devices
- 🚀 Fast performance with optimized components

## Tech Stack

- **React** - UI framework
- **Tailwind CSS** - Utility-first CSS framework for styling
- **Framer Motion** - Animation library for smooth transitions
- **Socket.io** - Real-time client-server communication

## Getting Started

### Prerequisites

- Node.js 14+ and npm

### Installation

1. Clone the repository and navigate to the project directory
2. Install dependencies:

```bash
# From the root directory:
npm run install:all

# Or directly in the frontend directory:
cd frontend/anagrab-frontend
npm install
```

3. Create a `.env` file in the frontend directory with:

```
VITE_BACKEND_URL="http://localhost:3001"
```

### Development

To run both frontend and backend concurrently:

```bash
# From the root directory:
npm run dev
```

To run only the frontend:

```bash
# From the frontend directory:
cd frontend/anagrab-frontend
npm run dev
```

The app will be available at http://localhost:5173

## How to Play

1. Enter your name to join the game
2. Start a new game or wait for another player to start one
3. Flip letters from the deck to the play area
4. Form words using the available letters and claim them
5. The player with the most words wins!
