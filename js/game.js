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
        this.snowflakes = [];  // Array to hold two snowflakes
        this.snowflakeTimer = null;  // Timer for snowflake respawn
        this.originalSpeed = null;  // Store original speed during snowflake effect
        this.setupLevelSelector();
        this.initGame();
        console.log('Game initialized');
        this.gameLoop();
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
                ghostSpeed: 1.5
            },
            2: {
                name: "Catalog",
                description: [
                    "Good job, welcome to the world",
                    "of data sharing. There are some",
                    "shared buckets and you will need",
                    "to link them by finding proper keys."
                ],
                ghostSpeed: 1.5 * 1.2
            },
            3: {
                name: "Components",
                description: [
                    "Components are unpredictable—",
                    "sometimes they help,",
                    "sometimes they mess with you."
                ],
                ghostSpeed: 1.5 * 1.6
            }
        };
        return configs[level];
    }

    cleanup() {
        if (this.snowflakeTimer) {
            clearTimeout(this.snowflakeTimer);
            this.snowflakeTimer = null;
        }
        if (this.originalSpeed !== null && this.player) {
            this.player.speed = this.originalSpeed;
            this.originalSpeed = null;
        }
        this.snowflakes = [];
        
        // Clear all game objects
        this.player = null;
        this.ghosts = [];
        this.maze = null;
        
        // Reset game state
        this.state = GAME_STATES.READY;
    }

    spawnSnowflakes() {
        // Clear existing snowflakes
        this.snowflakes = [];
        
        // Spawn two new snowflakes
        for (let i = 0; i < 2; i++) {
            let pos = this.findEmptyPosition();
            // Make sure second snowflake isn't too close to the first one
            if (i === 1 && this.snowflakes.length > 0) {
                while (getDistance(pos.x, pos.y, this.snowflakes[0].x, this.snowflakes[0].y) < CELL_SIZE * 5) {
                    pos = this.findEmptyPosition();
                }
            }
            
            this.snowflakes.push({
                x: pos.x,
                y: pos.y,
                width: CELL_SIZE - 4,
                height: CELL_SIZE - 4,
                pulseAngle: Math.random() * Math.PI * 2, // Random start angle
                active: true
            });
        }

        // Set timer to respawn snowflakes after 15 seconds
        if (this.snowflakeTimer) {
            clearTimeout(this.snowflakeTimer);
        }
        this.snowflakeTimer = setTimeout(() => {
            if (this.level === 3 && this.state === GAME_STATES.PLAYING) {
                this.spawnSnowflakes();
            }
        }, 15000);
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
        } else if (this.level === 2) {
            startX = 14 * CELL_SIZE;
            startY = 26 * CELL_SIZE;
            ghostY = 1 * CELL_SIZE;
        } else {
            startX = 14 * CELL_SIZE;
            startY = 26 * CELL_SIZE;
            ghostY = 4 * CELL_SIZE;
        }
        
        // Create player first
        this.player = new Player(startX, startY);

        // Initialize snowflakes for level 3
        if (this.level === 3) {
            this.spawnSnowflakes();
        }

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
        } else if (this.level === 2) {
            this.ghosts = [
                new Ghost(3 * CELL_SIZE, ghostY, '#FF0000', ghostSpeed),
                new Ghost(10 * CELL_SIZE, ghostY, '#FFB8FF', ghostSpeed),
                new Ghost(18 * CELL_SIZE, ghostY, '#00FFFF', ghostSpeed),
                new Ghost(24 * CELL_SIZE, ghostY, '#FFB852', ghostSpeed)
            ];
        } else {
            this.ghosts = [
                new Ghost(6 * CELL_SIZE, ghostY, '#FF0000', ghostSpeed),
                new Ghost(12 * CELL_SIZE, ghostY, '#FFB8FF', ghostSpeed),
                new Ghost(16 * CELL_SIZE, ghostY, '#00FFFF', ghostSpeed),
                new Ghost(22 * CELL_SIZE, ghostY, '#FFB852', ghostSpeed)
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

    showGameMessage(text, color) {
        // Create and show message
        const message = document.createElement('div');
        message.textContent = text;
        message.style.position = 'absolute';
        message.style.left = '50%';
        message.style.bottom = '10px';
        message.style.transform = 'translateX(-50%)';
        message.style.color = color;
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

    showKeyCollectedMessage(keyColor) {
        // Convert hex color to name for message
        const colorNames = {
            '#FF0000': 'Red',
            '#00FF00': 'Green',
            '#0000FF': 'Blue'
        };
        const colorName = colorNames[keyColor] || 'Unknown';
        this.showGameMessage(`The ${colorName} buckets are linked!`, keyColor);
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
            } else if (this.level === 2) {
                startX = 14 * CELL_SIZE;
                startY = 26 * CELL_SIZE;
                ghostY = 1 * CELL_SIZE;
            } else {
                // Level 3 - Match initGame positions
                startX = 14 * CELL_SIZE;
                startY = 26 * CELL_SIZE;
                ghostY = 4 * CELL_SIZE;
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
            } else if (this.level === 2) {
                const ghostXPositions = [3, 10, 18, 24];
                this.ghosts.forEach((ghost, index) => {
                    ghost.reset(ghostXPositions[index] * CELL_SIZE, ghostY);
                });
            } else {
                // Level 3 - Match initGame positions
                const ghostXPositions = [6, 12, 16, 22];
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
        
        // Draw snowflakes for level 3
        if (this.level === 3) {
            this.snowflakes.forEach(snowflake => {
                if (snowflake.active) {
                    this.drawSnowflake(snowflake);
                }
            });
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
            this.ctx.font = '20px "Press Start 2P"';
            this.ctx.fillText(`Level ${this.level}: ${config.name}`, this.canvas.width / 2, this.canvas.height / 2 - 60);
            
            // Draw level description
            this.ctx.fillStyle = '#90CAF9';
            this.ctx.font = '12px "Press Start 2P"';
            config.description.forEach((line, index) => {
                this.ctx.fillText(line, this.canvas.width / 2, this.canvas.height / 2 - 20 + (index * 20));
            });
            
            // Draw controls text with more padding (increased from 80/110 to 120/150)
            this.ctx.fillStyle = '#ffffff';
            this.ctx.font = '16px "Press Start 2P"';
            this.ctx.fillText('Use arrow keys to move', this.canvas.width / 2, this.canvas.height / 2 + 120);
            this.ctx.fillText('Press any to start', this.canvas.width / 2, this.canvas.height / 2 + 150);
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

            // Update snowflake animations
            if (this.level === 3) {
                this.snowflakes.forEach(snowflake => {
                    if (snowflake.active) {
                        snowflake.pulseAngle += deltaTime * 5;
                    }
                });
            }
        }
    }

    gameLoop() {
        this.update();
        this.draw();
        this.animationFrameId = requestAnimationFrame(() => this.gameLoop());
    }

    // Helper function to find an empty position in the maze
    findEmptyPosition() {
        // Define valid path coordinates for level 3 - these are the actual free paths in the maze
        const validPaths = [
            // Main horizontal paths
            { y: 1, xStart: 2, xEnd: 25 },     // Top row
            { y: 5, xStart: 2, xEnd: 25 },     // Second row
            { y: 8, xStart: 2, xEnd: 25 },     // Third row
            { y: 20, xStart: 2, xEnd: 25 },    // Fourth row
            { y: 23, xStart: 3, xEnd: 24 },    // Fifth row
            { y: 28, xStart: 2, xEnd: 25 },    // Bottom row
            
            // Vertical paths for more variety
            { x: 13, yStart: 2, yEnd: 27 },    // Left middle column
            { x: 14, yStart: 2, yEnd: 27 },    // Right middle column
        ];

        // First try horizontal paths
        let position = null;
        let attempts = 0;
        const maxAttempts = 10;

        while (!position && attempts < maxAttempts) {
            const pathIndex = Math.floor(Math.random() * validPaths.length);
            const path = validPaths[pathIndex];
            
            if ('xStart' in path) {
                // Horizontal path
                const x = (Math.floor(Math.random() * (path.xEnd - path.xStart + 1)) + path.xStart) * CELL_SIZE + CELL_SIZE / 2;
                const y = path.y * CELL_SIZE + CELL_SIZE / 2;
                
                // Verify position is valid
                if (!this.maze.checkCollision(x - CELL_SIZE/2, y - CELL_SIZE/2, CELL_SIZE, CELL_SIZE) &&
                    getDistance(x, y, this.player.x, this.player.y) >= CELL_SIZE * 5) {
                    position = { x, y };
                }
            } else {
                // Vertical path
                const x = path.x * CELL_SIZE + CELL_SIZE / 2;
                const y = (Math.floor(Math.random() * (path.yEnd - path.yStart + 1)) + path.yStart) * CELL_SIZE + CELL_SIZE / 2;
                
                // Verify position is valid
                if (!this.maze.checkCollision(x - CELL_SIZE/2, y - CELL_SIZE/2, CELL_SIZE, CELL_SIZE) &&
                    getDistance(x, y, this.player.x, this.player.y) >= CELL_SIZE * 5) {
                    position = { x, y };
                }
            }
            
            attempts++;
        }

        // If we couldn't find a valid position after max attempts, use a safe default
        if (!position) {
            position = {
                x: 14 * CELL_SIZE + CELL_SIZE / 2,
                y: 14 * CELL_SIZE + CELL_SIZE / 2
            };
        }

        return position;
    }

    drawSnowflake(snowflake) {
        const ctx = this.ctx;
        ctx.save();
        
        // Update pulse animation
        snowflake.pulseAngle += 0.1;
        const pulse = Math.sin(snowflake.pulseAngle) * 2;
        
        // Draw snowflake
        ctx.translate(snowflake.x, snowflake.y + pulse);
        
        // Main color
        ctx.fillStyle = '#29B5E8';  // Snowflake blue color
        
        // Draw six-pointed snowflake
        for (let i = 0; i < 6; i++) {
            ctx.beginPath();
            ctx.rotate(Math.PI / 3);
            ctx.moveTo(0, 0);
            ctx.lineTo(0, snowflake.width / 2);
            ctx.lineWidth = 3;
            ctx.strokeStyle = '#29B5E8';
            ctx.stroke();
            
            // Add small circles at the ends
            ctx.beginPath();
            ctx.arc(0, snowflake.width / 2, 2, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Add center circle
        ctx.beginPath();
        ctx.arc(0, 0, 4, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
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

        // Check snowflake collisions for level 3
        if (this.level === 3) {
            for (let snowflake of this.snowflakes) {
                if (snowflake.active && checkCollision(this.player, snowflake)) {
                    snowflake.active = false;
                    this.originalSpeed = this.player.speed;
                    this.player.speed = 1.1;
                    
                    // Clear existing speed restore timer
                    if (this.speedRestoreTimer) {
                        clearTimeout(this.speedRestoreTimer);
                    }
                    
                    // Set timer to restore speed after 5 seconds
                    this.speedRestoreTimer = setTimeout(() => {
                        if (this.player && this.originalSpeed !== null) {
                            this.player.speed = this.originalSpeed;
                            this.originalSpeed = null;
                        }
                    }, 5000);

                    // Show snowflake message
                    this.showGameMessage('Snowflake! You are slow now!', '#29B5E8');

                    // If all snowflakes are collected, they'll respawn after the timer anyway
                    break;
                }
            }
        }

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
            if (this.level < 3) {
                this.level++;
                this.initGame();
                this.state = GAME_STATES.READY;
            } else {
                this.restartGame();
            }
        }
    }
}

// Start the game when the page loads
window.addEventListener('load', () => {
    const canvas = document.getElementById('gameCanvas');
    const game = new Game(canvas);
}); 