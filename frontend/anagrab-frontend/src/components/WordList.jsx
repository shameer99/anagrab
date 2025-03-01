import React, { useState } from 'react';

export const WordList = ({ players = {} }) => {
  const [filterPlayer, setFilterPlayer] = useState('all');
  const [sortBy, setSortBy] = useState('player'); // 'player', 'length-asc', 'length-desc'

  // Extract all words with player information
  const allWords = Object.entries(players).flatMap(([playerId, player]) => {
    return player.words.map(word => ({
      word,
      playerId,
      playerName: player.name,
      length: word.length,
    }));
  });

  // Apply filters
  const filteredWords =
    filterPlayer === 'all' ? allWords : allWords.filter(item => item.playerId === filterPlayer);

  // Apply sorting
  const sortedWords = [...filteredWords].sort((a, b) => {
    if (sortBy === 'player') {
      return a.playerName.localeCompare(b.playerName);
    } else if (sortBy === 'length-asc') {
      return a.length - b.length;
    } else if (sortBy === 'length-desc') {
      return b.length - a.length;
    }
    return 0;
  });

  // Get unique players for filter options
  const uniquePlayers = Object.entries(players).map(([id, player]) => ({
    id,
    name: player.name,
  }));

  return (
    <div className="word-list-container">
      <div className="word-list-controls">
        <div className="filter-chips">
          <button
            className={`filter-chip ${filterPlayer === 'all' ? 'active' : ''}`}
            onClick={() => setFilterPlayer('all')}
          >
            All Players
          </button>
          {uniquePlayers.map(player => (
            <button
              key={player.id}
              className={`filter-chip ${filterPlayer === player.id ? 'active' : ''}`}
              onClick={() => setFilterPlayer(player.id)}
            >
              {player.name}
            </button>
          ))}
        </div>

        <div className="sort-chips">
          <button
            className={`sort-chip ${sortBy === 'player' ? 'active' : ''}`}
            onClick={() => setSortBy('player')}
          >
            By Player
          </button>
          <button
            className={`sort-chip ${sortBy === 'length-asc' ? 'active' : ''}`}
            onClick={() => setSortBy('length-asc')}
          >
            Shortest First
          </button>
          <button
            className={`sort-chip ${sortBy === 'length-desc' ? 'active' : ''}`}
            onClick={() => setSortBy('length-desc')}
          >
            Longest First
          </button>
        </div>
      </div>

      <div className="word-list">
        {sortedWords.map((item, index) => (
          <div key={index} className="word-item">
            <span className="word-text">{item.word}</span>
            <span className="word-player">{item.playerName}</span>
          </div>
        ))}
        {sortedWords.length === 0 && <div className="no-words">No words found</div>}
      </div>
    </div>
  );
};
