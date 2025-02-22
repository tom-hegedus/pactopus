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
        this.powerBIs = [];    // Array to hold two PowerBI elements
        this.gooddatas = [];   // Array to hold one Gooddata element
        this.snowflakeTimer = null;  // Timer for snowflake respawn
        this.powerBITimer = null;    // Timer for PowerBI respawn
        this.gooddataTimer = null;   // Timer for Gooddata respawn
        this.originalSpeed = null;  // Store original speed during snowflake effect
        this.powerBIActive = false;  // Track if PowerBI effect is active
        this.gooddataActive = false; // Track if Gooddata effect is active
        this.powerBIEffectTimer = null;  // Timer for PowerBI effect duration
        this.gooddataEffectTimer = null; // Timer for Gooddata effect duration
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
        if (this.powerBITimer) {
            clearTimeout(this.powerBITimer);
            this.powerBITimer = null;
        }
        if (this.gooddataTimer) {
            clearTimeout(this.gooddataTimer);
            this.gooddataTimer = null;
        }
        if (this.powerBIEffectTimer) {
            clearTimeout(this.powerBIEffectTimer);
            this.powerBIEffectTimer = null;
        }
        if (this.gooddataEffectTimer) {
            clearTimeout(this.gooddataEffectTimer);
            this.gooddataEffectTimer = null;
        }
        if (this.originalSpeed !== null && this.player) {
            this.player.speed = this.originalSpeed;
            this.originalSpeed = null;
        }
        if (this.player) {
            this.player.powerBIActive = false; // Reset player's PowerBI state
        }
        this.snowflakes = [];
        this.powerBIs = [];
        this.gooddatas = [];
        this.powerBIActive = false;
        this.gooddataActive = false;
        
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

    spawnPowerBIs() {
        // Clear existing PowerBIs
        this.powerBIs = [];
        
        // Spawn two new PowerBIs
        for (let i = 0; i < 2; i++) {
            let pos = this.findEmptyPosition();
            // Make sure second PowerBI isn't too close to the first one
            if (i === 1 && this.powerBIs.length > 0) {
                while (getDistance(pos.x, pos.y, this.powerBIs[0].x, this.powerBIs[0].y) < CELL_SIZE * 5) {
                    pos = this.findEmptyPosition();
                }
            }
            
            this.powerBIs.push({
                x: pos.x,
                y: pos.y,
                width: CELL_SIZE - 4,
                height: CELL_SIZE - 4,
                pulseAngle: Math.random() * Math.PI * 2,
                active: true
            });
        }

        // Set timer to respawn PowerBIs after 15 seconds
        if (this.powerBITimer) {
            clearTimeout(this.powerBITimer);
        }
        this.powerBITimer = setTimeout(() => {
            if (this.level === 3 && this.state === GAME_STATES.PLAYING) {
                this.spawnPowerBIs();
            }
        }, 15000);
    }

    spawnGooddatas() {
        // Clear existing Gooddatas
        this.gooddatas = [];
        
        // Spawn one new Gooddata
        let pos = this.findEmptyPosition();
        
        this.gooddatas.push({
            x: pos.x,
            y: pos.y,
            width: CELL_SIZE - 4,
            height: CELL_SIZE - 4,
            pulseAngle: Math.random() * Math.PI * 2,
            active: true
        });

        // Set timer to respawn Gooddata after 15 seconds
        if (this.gooddataTimer) {
            clearTimeout(this.gooddataTimer);
        }
        this.gooddataTimer = setTimeout(() => {
            if (this.level === 3 && this.state === GAME_STATES.PLAYING) {
                this.spawnGooddatas();
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

        // Initialize snowflakes, PowerBIs, and Gooddatas for level 3
        if (this.level === 3) {
            this.spawnSnowflakes();
            this.spawnPowerBIs();
            this.spawnGooddatas();
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
            this.maze.draw(this.ctx, this.gooddataActive);  // Pass gooddataActive to control pellet color
        } else {
            console.log('No maze to draw');
        }
        
        if (this.player) {
            console.log('Drawing player');
            this.player.draw(this.ctx);
        }
        
        // Draw snowflakes, PowerBIs, and Gooddatas for level 3
        if (this.level === 3) {
            this.snowflakes.forEach(snowflake => {
                if (snowflake.active) {
                    this.drawSnowflake(snowflake);
                }
            });
            
            this.powerBIs.forEach(powerBI => {
                if (powerBI.active) {
                    this.drawPowerBI(powerBI);
                }
            });

            this.gooddatas.forEach(gooddata => {
                if (gooddata.active) {
                    this.drawGooddata(gooddata);
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
            if (this.level === 3 && this.maze.isComplete()) {
                this.showFinishScreen();
            } else {
                this.ctx.fillStyle = '#ff0000';
                this.ctx.font = '32px "Press Start 2P"';
                this.ctx.textAlign = 'center';
                this.ctx.fillText('GAME OVER', this.canvas.width / 2, this.canvas.height / 2 - 20);
                
                this.ctx.font = '16px "Press Start 2P"';
                this.ctx.fillText(`Score: ${this.score}`, this.canvas.width / 2, this.canvas.height / 2 + 20);
                this.ctx.fillText('Press R to restart', this.canvas.width / 2, this.canvas.height / 2 + 50);
            }
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

    drawPowerBI(powerBI) {
        const ctx = this.ctx;
        ctx.save();
        
        // Update pulse animation
        powerBI.pulseAngle += 0.1;
        const pulse = Math.sin(powerBI.pulseAngle) * 2;
        
        // Draw PowerBI
        ctx.translate(powerBI.x, powerBI.y + pulse);
        
        // PowerBI colors
        ctx.fillStyle = '#F2C811';  // Power BI gold color
        ctx.strokeStyle = '#F2C811';
        
        // Draw Power BI logo-inspired shape
        const size = powerBI.width * 0.8; // Make it larger, similar to snowflake
        
        // Add glow effect
        if (this.powerBIActive) {
            ctx.shadowColor = '#F2C811';
            ctx.shadowBlur = 10;
        }
        
        // Draw main shape
        ctx.lineWidth = 3;
        
        // Draw three bars of increasing height
        const barWidth = size / 4;
        const maxHeight = size * 0.8;
        
        // First (shortest) bar
        ctx.fillRect(-size/2, maxHeight/4, barWidth, maxHeight/2);
        
        // Second (medium) bar
        ctx.fillRect(-size/2 + barWidth * 1.5, 0, barWidth, maxHeight * 0.75);
        
        // Third (tallest) bar
        ctx.fillRect(-size/2 + barWidth * 3, -maxHeight/4, barWidth, maxHeight);
        
        // Draw connecting line on top
        ctx.beginPath();
        ctx.moveTo(-size/2, maxHeight/4);
        ctx.lineTo(-size/2 + barWidth * 4, -maxHeight/4);
        ctx.stroke();
        
        ctx.restore();
    }

    drawGooddata(gooddata) {
        const ctx = this.ctx;
        ctx.save();
        
        // Update pulse animation
        gooddata.pulseAngle += 0.1;
        const pulse = Math.sin(gooddata.pulseAngle) * 2;
        
        // Draw Gooddata
        ctx.translate(gooddata.x, gooddata.y + pulse);
        
        // GoodData logo colors
        ctx.fillStyle = '#FF3399';  // Pink color
        ctx.strokeStyle = '#FF3399';
        
        // Draw GoodData logo-inspired shape
        const size = gooddata.width * 1.0;  // Increased from 0.8 to 1.0 to make it bigger
        
        // Add glow effect
        if (this.gooddataActive) {
            ctx.shadowColor = '#FF3399';
            ctx.shadowBlur = 10;
        }
        
        // Draw main circle
        ctx.beginPath();
        ctx.arc(0, 0, size/2, 0, Math.PI * 2);
        ctx.fill();

        // Draw the "G" shape in white
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 2;
        ctx.beginPath();
        // Draw simplified "G" shape
        ctx.arc(0, 0, size/3, -Math.PI/4, Math.PI * 1.2, false);
        ctx.lineTo(size/6, 0);
        ctx.stroke();
        
        ctx.restore();
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

            // Update snowflake and PowerBI animations
            if (this.level === 3) {
                this.snowflakes.forEach(snowflake => {
                    if (snowflake.active) {
                        snowflake.pulseAngle += deltaTime * 5;
                    }
                });
                this.powerBIs.forEach(powerBI => {
                    if (powerBI.active) {
                        powerBI.pulseAngle += deltaTime * 5;
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
            { y: 4, xStart: 2, xEnd: 25 },     // Second row
            { y: 7, xStart: 2, xEnd: 25 },     // Third row
            { y: 18, xStart: 2, xEnd: 25 },    // Fourth row
            { y: 20, xStart: 2, xEnd: 25 },    // Fifth row
            { y: 23, xStart: 2, xEnd: 25 },    // Bottom row
            
            // Vertical paths
            { x: 13, yStart: 2, yEnd: 24 },    // Left middle column
            { x: 14, yStart: 2, yEnd: 24 }     // Right middle column
        ];

        let position = null;
        let attempts = 0;
        const maxAttempts = 20; // Increased attempts to find valid position

        while (!position && attempts < maxAttempts) {
            const pathIndex = Math.floor(Math.random() * validPaths.length);
            const path = validPaths[pathIndex];
            
            if ('xStart' in path) {
                // Horizontal path
                const x = (Math.floor(Math.random() * (path.xEnd - path.xStart + 1)) + path.xStart) * CELL_SIZE + CELL_SIZE / 2;
                const y = path.y * CELL_SIZE + CELL_SIZE / 2;
                
                // Verify position is valid and not too close to player
                if (!this.maze.checkCollision(x - CELL_SIZE/2, y - CELL_SIZE/2, CELL_SIZE, CELL_SIZE) &&
                    getDistance(x, y, this.player.x, this.player.y) >= CELL_SIZE * 5) {
                    position = { x, y };
                }
            } else {
                // Vertical path
                const x = path.x * CELL_SIZE + CELL_SIZE / 2;
                const y = (Math.floor(Math.random() * (path.yEnd - path.yStart + 1)) + path.yStart) * CELL_SIZE + CELL_SIZE / 2;
                
                // Verify position is valid and not too close to player
                if (!this.maze.checkCollision(x - CELL_SIZE/2, y - CELL_SIZE/2, CELL_SIZE, CELL_SIZE) &&
                    getDistance(x, y, this.player.x, this.player.y) >= CELL_SIZE * 5) {
                    position = { x, y };
                }
            }
            
            attempts++;
        }

        // If we couldn't find a valid position after max attempts, use a safe default position
        if (!position) {
            position = {
                x: 13 * CELL_SIZE + CELL_SIZE / 2, // Middle of maze
                y: 7 * CELL_SIZE + CELL_SIZE / 2   // Upper section of maze
            };
        }

        return position;
    }

    checkCollisions() {
        // Check pellet collection
        this.maze.pellets.forEach((pellet, index) => {
            if (checkCollision(this.player, pellet)) {
                this.maze.pellets.splice(index, 1);
                // Increase score based on Gooddata effect
                this.score += this.gooddataActive ? 30 : 10;
                this.updateScore();
            }
        });

        // Only check special element collisions for level 3
        if (this.level === 3) {
            // Check snowflake collisions
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

                    // Show snowflake message ONLY when eaten
                    this.showGameMessage('Snowflake! You are slow now!', '#29B5E8');
                    break;
                }
            }

            // Check Gooddata collisions
            for (let gooddata of this.gooddatas) {
                if (gooddata.active && checkCollision(this.player, gooddata)) {
                    gooddata.active = false;
                    this.gooddataActive = true;
                    
                    // Clear existing Gooddata effect timer
                    if (this.gooddataEffectTimer) {
                        clearTimeout(this.gooddataEffectTimer);
                    }
                    
                    // Set timer to end Gooddata effect after 5 seconds
                    this.gooddataEffectTimer = setTimeout(() => {
                        this.gooddataActive = false;
                    }, 5000);

                    // Show Gooddata message ONLY when eaten
                    this.showGameMessage('Gooddata! Pellets are worth more!', '#FF3399');
                    break;
                }
            }

            // Check PowerBI collisions
            for (let powerBI of this.powerBIs) {
                if (powerBI.active && checkCollision(this.player, powerBI)) {
                    powerBI.active = false;
                    this.powerBIActive = true;
                    this.player.powerBIActive = true; // Set player's PowerBI state
                    this.player.powerBIStartTime = performance.now(); // Set the start time
                    
                    // Clear existing PowerBI effect timer
                    if (this.powerBIEffectTimer) {
                        clearTimeout(this.powerBIEffectTimer);
                    }
                    
                    // Set timer to end PowerBI effect after 7 seconds
                    this.powerBIEffectTimer = setTimeout(() => {
                        this.powerBIActive = false;
                        this.player.powerBIActive = false; // Reset player's PowerBI state
                    }, 7000);

                    // Show PowerBI message ONLY when eaten
                    this.showGameMessage('Power BI! You can eat ghosts now!', '#F2C811');
                    break;
                }
            }

            // Check ghost collisions with PowerBI effect
            if (this.powerBIActive) {
                for (let i = this.ghosts.length - 1; i >= 0; i--) {
                    const ghost = this.ghosts[i];
                    // Only check collision if ghost is not frozen
                    if (!ghost.frozen && checkCollision(this.player, ghost)) {
                        // Increase score
                        this.score += 1000;
                        this.updateScore();
                        
                        // Show score message ONLY when ghost eaten
                        this.showGameMessage('+1000 Points!', '#F2C811');
                        
                        // Define corner areas where ghosts can respawn
                        const corners = [
                            { x: 1, y: 1 },     // Top-left corner
                            { x: 26, y: 1 },    // Top-right corner
                            { x: 1, y: 26 },    // Bottom-left corner
                            { x: 26, y: 26 }    // Bottom-right corner
                        ];
                        
                        // Select corner based on ghost index
                        const corner = corners[i % corners.length];
                        
                        // Try positions around the corner until a valid one is found
                        const offsets = [
                            { x: 0, y: 0 },     // Try exact corner first
                            { x: 1, y: 0 },     // Try one cell right
                            { x: 0, y: 1 },     // Try one cell down
                            { x: -1, y: 0 },    // Try one cell left
                            { x: 0, y: -1 },    // Try one cell up
                            { x: 1, y: 1 },     // Try diagonal
                            { x: -1, y: 1 },    // Try diagonal
                            { x: 1, y: -1 },    // Try diagonal
                            { x: -1, y: -1 }    // Try diagonal
                        ];
                        
                        let validPosition = false;
                        let newX = corner.x * CELL_SIZE;
                        let newY = corner.y * CELL_SIZE;
                        
                        for (let offset of offsets) {
                            const testX = newX + offset.x * CELL_SIZE;
                            const testY = newY + offset.y * CELL_SIZE;
                            
                            if (!this.maze.checkCollision(testX, testY, CELL_SIZE - 2, CELL_SIZE - 2)) {
                                newX = testX;
                                newY = testY;
                                validPosition = true;
                                break;
                            }
                        }
                        
                        // If no valid position found in corner, use findEmptyPosition
                        if (!validPosition) {
                            const pos = this.findEmptyPosition();
                            newX = pos.x;
                            newY = pos.y;
                        }
                        
                        // Reset ghost to valid position
                        ghost.x = newX;
                        ghost.y = newY;
                        
                        // Set ghost to frozen state for 3 seconds
                        ghost.frozen = true;
                        if (ghost.frozenTimer) {
                            clearTimeout(ghost.frozenTimer);
                        }
                        ghost.frozenTimer = setTimeout(() => {
                            ghost.frozen = false;
                        }, 3000);
                    }
                }
            } else {
                // Normal ghost collision check (game over)
                for (const ghost of this.ghosts) {
                    if (checkCollision(this.player, ghost)) {
                        this.gameOver();
                        return;
                    }
                }
            }
        }

        // Check key collection
        const collectedKeyColor = this.maze.collectKey(this.player);
        if (collectedKeyColor) {
            // Visual feedback for key collection ONLY when key collected
            this.showKeyCollectedMessage(collectedKeyColor);
            this.score += 50; // Bonus points for collecting a key
            this.updateScore();
        }

        // Check level completion
        if (this.maze.isComplete()) {
            if (this.level < 3) {
                this.level++;
                this.initGame();
                this.state = GAME_STATES.READY;
            } else {
                // Show finish screen for level 3 completion
                this.state = GAME_STATES.GAME_OVER;
                this.showFinishScreen();
            }
        }
    }

    showFinishScreen() {
        // Draw semi-transparent black overlay
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Set up text properties
        this.ctx.textAlign = 'center';
        
        // Draw congratulations text
        this.ctx.fillStyle = '#4CAF50';  // Green color
        this.ctx.font = '24px "Press Start 2P"';
        this.ctx.fillText('Congratulations!', this.canvas.width / 2, this.canvas.height / 2 - 80);
        
        // Draw main message with smaller font (14px instead of 16px)
        this.ctx.fillStyle = '#90CAF9';  // Light blue color
        this.ctx.font = '14px "Press Start 2P"';
        this.ctx.fillText('You seem to know the platform.', this.canvas.width / 2, this.canvas.height / 2 - 30);
        this.ctx.fillText('But the dark places of Keboola', this.canvas.width / 2, this.canvas.height / 2);
        this.ctx.fillText('awaits...', this.canvas.width / 2, this.canvas.height / 2 + 30);
        this.ctx.fillText('Let me know', this.canvas.width / 2, this.canvas.height / 2 + 60);
        this.ctx.fillText('if you want more levels!', this.canvas.width / 2, this.canvas.height / 2 + 85);
        
        // Draw signature
        this.ctx.fillStyle = '#FF3399';  // Pink color (matching Gooddata)
        this.ctx.font = '20px "Press Start 2P"';
        this.ctx.fillText('Tom', this.canvas.width / 2, this.canvas.height / 2 + 120);
        
        // Draw restart instruction
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = '16px "Press Start 2P"';
        this.ctx.fillText('Press R to restart', this.canvas.width / 2, this.canvas.height / 2 + 180);
    }
}

// Start the game when the page loads
window.addEventListener('load', () => {
    const canvas = document.getElementById('gameCanvas');
    const game = new Game(canvas);
}); 