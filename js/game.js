class Game {
    constructor(canvas) {
        console.log('Game constructor called');
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.score = 0;
        this.level = 1;
        this.state = GAME_STATES.READY;
        this.animationFrameId = null;
        this.player = null;
        this.ghosts = [];
        this.maze = null;
        this.lastFrameTime = performance.now();
        this.setupLevelSelector();
        this.initGame();
        console.log('Game initialized');
        this.gameLoop(); // Start game loop immediately
    }

    setupLevelSelector() {
        const buttons = document.querySelectorAll('.level-btn');
        buttons.forEach(button => {
            button.addEventListener('click', () => {
                const selectedLevel = parseInt(button.dataset.level);
                this.switchLevel(selectedLevel);
                
                // Update active button
                buttons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
            });
        });
        
        // Set initial active button
        buttons[0].classList.add('active');
    }

    switchLevel(newLevel) {
        this.level = newLevel;
        this.score = 0;
        this.updateScore();
        document.getElementById('level').textContent = `Level: ${this.level}`;
        this.initGame();
        this.state = GAME_STATES.READY;
    }

    getLevelConfig(level) {
        const configs = {
            1: {
                name: "Storage",
                description: [
                    "Welcome to Storage.",
                    "It's all nice and easy here",
                    "and noone is actually chasing you."
                ],
                ghostSpeed: 1
            },
            2: {
                name: "Data catalog",
                description: [
                    "Good job, welcome to data sharing.",
                    "The data and enemies starts flowing",
                    "but more faster here and things gets bit messier."
                ],
                ghostSpeed: 1.5
            }
        };
        return configs[level];
    }

    cleanup() {
        // Clear all game objects
        this.player = null;
        this.ghosts = [];
        this.maze = null;
        
        // Reset game state
        this.state = GAME_STATES.READY;
    }

    initGame() {
        // Clean up existing game objects
        this.cleanup();

        // Create maze with current level
        this.maze = new Maze(this.level);
        
        // Set starting positions based on level
        let startX, startY, ghostY;
        if (this.level === 1) {
            startX = 14 * CELL_SIZE;
            startY = 23 * CELL_SIZE;
            ghostY = 11 * CELL_SIZE;
        } else {
            // Level 2 starting positions - in the bottom free space
            startX = 14 * CELL_SIZE;
            startY = 26 * CELL_SIZE; // Bottom area where there's free space
            ghostY = 1 * CELL_SIZE;  // Top area where there's free space
        }
        
        this.player = new Player(startX, startY);

        // Get ghost speed from level config
        const config = this.getLevelConfig(this.level);
        const ghostSpeed = config.ghostSpeed;

        // Create ghosts with level-specific positions
        if (this.level === 1) {
            this.ghosts = [
                new Ghost(13 * CELL_SIZE, ghostY, '#FF0000', ghostSpeed),
                new Ghost(14 * CELL_SIZE, ghostY, '#FFB8FF', ghostSpeed),
                new Ghost(15 * CELL_SIZE, ghostY, '#00FFFF', ghostSpeed),
                new Ghost(16 * CELL_SIZE, ghostY, '#FFB852', ghostSpeed)
            ];
        } else {
            // Level 2 ghost positions spread across the top free space
            this.ghosts = [
                new Ghost(3 * CELL_SIZE, ghostY, '#FF0000', ghostSpeed),
                new Ghost(10 * CELL_SIZE, ghostY, '#FFB8FF', ghostSpeed),
                new Ghost(18 * CELL_SIZE, ghostY, '#00FFFF', ghostSpeed),
                new Ghost(24 * CELL_SIZE, ghostY, '#FFB852', ghostSpeed)
            ];
        }

        // Setup input handling
        this.setupControls();
    }

    setupControls() {
        // Remove existing event listener if it exists
        if (this.keydownHandler) {
            document.removeEventListener('keydown', this.keydownHandler);
        }

        this.keydownHandler = (event) => {
            const action = KEY_CODES[event.keyCode];
            
            // Prevent default browser scrolling for arrow keys
            if (action === 'UP' || action === 'DOWN' || action === 'LEFT' || action === 'RIGHT') {
                event.preventDefault();
            }
            
            if (action === 'RESTART') {
                this.restartGame();
                return;
            }
            
            if (Object.values(DIRECTIONS).includes(DIRECTIONS[action])) {
                this.player.setDirection(DIRECTIONS[action]);
                
                // Start game on first movement keypress
                if (this.state === GAME_STATES.READY) {
                    this.lastFrameTime = performance.now();
                    this.state = GAME_STATES.PLAYING;
                }
            }
        };
        
        document.addEventListener('keydown', this.keydownHandler);
    }

    checkCollisions() {
        // Check pellet collection
        this.maze.pellets.forEach((pellet, index) => {
            if (checkCollision(this.player, pellet)) {
                this.maze.pellets.splice(index, 1);
                this.score += 10;
                this.updateScore();
            }
        });

        // Check key collection
        const collectedKeyColor = this.maze.collectKey(this.player);
        if (collectedKeyColor) {
            // Visual feedback for key collection
            this.showKeyCollectedMessage(collectedKeyColor);
            this.score += 50; // Bonus points for collecting a key
            this.updateScore();
        }

        // Check ghost collisions
        for (const ghost of this.ghosts) {
            if (checkCollision(this.player, ghost)) {
                this.gameOver();
                return;
            }
        }

        // Check level completion
        if (this.maze.isComplete()) {
            if (this.level < 2) {
                this.level++;
                this.initGame();
                this.state = GAME_STATES.READY;
            } else {
                this.restartGame();
            }
        }
    }

    showKeyCollectedMessage(keyColor) {
        // Convert hex color to name for message
        const colorNames = {
            '#FF0000': 'Red',
            '#00FF00': 'Green',
            '#0000FF': 'Blue'
        };
        const colorName = colorNames[keyColor] || 'Unknown';
        
        // Create and show message
        const message = document.createElement('div');
        message.textContent = `${colorName} key collected!`;
        message.style.position = 'absolute';
        message.style.left = '50%';
        message.style.bottom = '10px';  // Position at bottom
        message.style.transform = 'translateX(-50%)';
        message.style.color = keyColor;
        message.style.fontFamily = '"Press Start 2P"';
        message.style.fontSize = '16px';
        message.style.textShadow = '2px 2px 2px black';
        message.style.zIndex = '1000';
        message.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        message.style.padding = '5px 10px';
        message.style.borderRadius = '5px';
        
        document.body.appendChild(message);
        
        // Animate and remove
        setTimeout(() => {
            message.style.transition = 'all 1s ease-out';
            message.style.opacity = '0';
            setTimeout(() => message.remove(), 1000);
        }, 2000);
    }

    updateScore() {
        document.getElementById('score').textContent = `Score: ${this.score}`;
    }

    setState(newState) {
        this.state = newState;
        this.lastFrameTime = performance.now(); // Reset timing on state change
        
        if (newState === GAME_STATES.READY) {
            // Reset positions based on level
            let startX, startY, ghostY;
            if (this.level === 1) {
                startX = 14 * CELL_SIZE;
                startY = 23 * CELL_SIZE;
                ghostY = 11 * CELL_SIZE;
            } else {
                startX = 14 * CELL_SIZE;
                startY = 26 * CELL_SIZE;
                ghostY = 1 * CELL_SIZE;
            }
            
            this.player.x = startX;
            this.player.y = startY;
            this.player.direction = DIRECTIONS.RIGHT;
            this.player.nextDirection = null;
            this.player.reset();

            // Reset ghosts based on level
            if (this.level === 1) {
                this.ghosts.forEach((ghost, index) => {
                    ghost.reset((13 + index) * CELL_SIZE, ghostY);
                });
            } else {
                const ghostXPositions = [3, 10, 18, 24];
                this.ghosts.forEach((ghost, index) => {
                    ghost.reset(ghostXPositions[index] * CELL_SIZE, ghostY);
                });
            }
        }
    }

    restartGame() {
        // Reset score and level
        this.score = 0;
        this.level = 1;
        this.updateScore();
        document.getElementById('level').textContent = `Level: ${this.level}`;

        // Update level selector
        const buttons = document.querySelectorAll('.level-btn');
        buttons.forEach(btn => btn.classList.remove('active'));
        buttons[0].classList.add('active');

        // Stop the current game loop
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }

        // Reset all game objects
        this.cleanup();
        this.initGame();

        // Start fresh game loop
        this.lastFrameTime = performance.now();
        this.gameLoop();
    }

    gameOver() {
        this.state = GAME_STATES.GAME_OVER;
    }

    draw() {
        console.log('Drawing frame');
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw game elements
        if (this.maze) {
            console.log('Drawing maze');
            this.maze.draw(this.ctx);
        } else {
            console.log('No maze to draw');
        }
        
        if (this.player) {
            console.log('Drawing player');
            this.player.draw(this.ctx);
        }
        
        if (this.ghosts.length > 0) {
            console.log('Drawing ghosts');
            this.ghosts.forEach(ghost => ghost.draw(this.ctx));
        }

        // Draw semi-transparent overlay for READY and GAME OVER states
        if (this.state === GAME_STATES.READY || this.state === GAME_STATES.GAME_OVER) {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        }

        // Draw ready screen text
        if (this.state === GAME_STATES.READY) {
            const config = this.getLevelConfig(this.level);
            this.ctx.textAlign = 'center';
            
            // Draw level name
            this.ctx.fillStyle = '#4CAF50';
            this.ctx.font = '24px "Press Start 2P"';
            this.ctx.fillText(`Level ${this.level}: ${config.name}`, this.canvas.width / 2, this.canvas.height / 2 - 60);
            
            // Draw level description
            this.ctx.fillStyle = '#90CAF9';
            this.ctx.font = '12px "Press Start 2P"';
            config.description.forEach((line, index) => {
                this.ctx.fillText(line, this.canvas.width / 2, this.canvas.height / 2 - 20 + (index * 20));
            });
            
            // Draw controls text
            this.ctx.fillStyle = '#ffffff';
            this.ctx.font = '16px "Press Start 2P"';
            this.ctx.fillText('Use arrow keys to move', this.canvas.width / 2, this.canvas.height / 2 + 80);
            this.ctx.fillText('Press any to start', this.canvas.width / 2, this.canvas.height / 2 + 110);
        }

        // Draw game over screen text
        if (this.state === GAME_STATES.GAME_OVER) {
            this.ctx.fillStyle = '#ff0000';
            this.ctx.font = '32px "Press Start 2P"';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('GAME OVER', this.canvas.width / 2, this.canvas.height / 2 - 20);
            
            this.ctx.font = '16px "Press Start 2P"';
            this.ctx.fillText(`Score: ${this.score}`, this.canvas.width / 2, this.canvas.height / 2 + 20);
            this.ctx.fillText('Press R to restart', this.canvas.width / 2, this.canvas.height / 2 + 50);
        }
    }

    drawKeyIndicator() {
        const keyColors = ['#FF0000', '#00FF00', '#0000FF'];
        const startX = 10;
        const startY = this.canvas.height - 30;
        
        this.ctx.font = '12px "Press Start 2P"';
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.textAlign = 'left';
        this.ctx.fillText('Keys:', startX, startY);
        
        keyColors.forEach((color, index) => {
            const x = startX + 80 + (index * 40);
            const y = startY - 5;
            
            // Draw key icon
            this.ctx.fillStyle = color;
            this.ctx.strokeStyle = '#FFFFFF';
            this.ctx.lineWidth = 1;
            
            if (this.maze.collectedKeys.has(color)) {
                // Draw checkmark for collected keys
                this.ctx.fillStyle = '#4CAF50';
                this.ctx.font = '12px "Press Start 2P"';
                this.ctx.fillText('✓', x, y);
            } else {
                // Draw key icon for uncollected keys
                this.ctx.beginPath();
                this.ctx.arc(x, y - 3, 5, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.stroke();
            }
        });
    }

    update() {
        const currentTime = performance.now();
        const deltaTime = Math.min((currentTime - this.lastFrameTime) / 1000, 0.1);
        this.lastFrameTime = currentTime;

        // Only update player and ghosts during gameplay
        if (this.state === GAME_STATES.PLAYING) {
            // Update ghosts
            this.ghosts.forEach(ghost => ghost.update(this.maze, deltaTime));
            
            this.player.update(this.maze);
            this.checkCollisions();
        }
    }

    gameLoop() {
        this.update();
        this.draw();
        this.animationFrameId = requestAnimationFrame(() => this.gameLoop());
    }
}

// Start the game when the page loads
window.addEventListener('load', () => {
    const canvas = document.getElementById('gameCanvas');
    const game = new Game(canvas);
}); 