// Game configuration
const CELL_SIZE = 16;
const GRID_WIDTH = 28;
const GRID_HEIGHT = 31;

// Colors
const COLORS = {
    MAZE: '#0066cc',
    PLAYER: '#00a1ff',
    ENEMY: '#ff0000',
    PELLET: '#ffffff',
    POWER_PELLET: '#ffb897'
};

// Direction constants
const DIRECTIONS = {
    UP: { x: 0, y: -1 },
    DOWN: { x: 0, y: 1 },
    LEFT: { x: -1, y: 0 },
    RIGHT: { x: 1, y: 0 }
};

// Key mappings
const KEY_CODES = {
    37: 'LEFT',
    38: 'UP',
    39: 'RIGHT',
    40: 'DOWN',
    82: 'RESTART'  // R key
};

// Game states
const GAME_STATES = {
    READY: 'READY',
    PLAYING: 'PLAYING',
    PAUSED: 'PAUSED',
    GAME_OVER: 'GAME_OVER'
}; 