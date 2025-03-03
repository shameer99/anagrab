import { v4 as uuidv4 } from 'uuid';

const SESSION_KEY = 'anagrab_session';
const TOKEN_KEY = 'anagrab_player_token';

export const getPlayerToken = () => {
  let token = localStorage.getItem(TOKEN_KEY);
  if (!token) {
    token = uuidv4();
    localStorage.setItem(TOKEN_KEY, token);
  }
  return token;
};

export const storeGameSession = (gameId, playerName) => {
  localStorage.setItem(
    SESSION_KEY,
    JSON.stringify({
      gameId,
      playerName,
      token: getPlayerToken(),
      timestamp: Date.now(),
    })
  );
};

export const getLastGameSession = () => {
  const data = localStorage.getItem(SESSION_KEY);
  if (!data) return null;

  const session = JSON.parse(data);
  // Only return if less than 24h old
  const MAX_SESSION_AGE = 24 * 60 * 60 * 1000; // 24 hours
  if (Date.now() - session.timestamp > MAX_SESSION_AGE) {
    clearGameSession();
    return null;
  }
  return session;
};

export const clearGameSession = () => {
  localStorage.removeItem(SESSION_KEY);
};

export const updateGameSession = updates => {
  const session = getLastGameSession();
  if (session) {
    storeGameSession({
      ...session,
      ...updates,
      timestamp: Date.now(),
    });
  }
};
