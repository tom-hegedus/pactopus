class Maze {
    constructor(level = 1) {
        console.log('Maze constructor called');
        this.level = level;
        this.pellets = [];
        this.walls = [];
        this.doors = [];  // Array to store doors: {x, y, width, height, color}
        this.keys = [];   // Array to store keys: {x, y, width, height, color}
        this.collectedKeys = new Set(); // Track collected keys by color
        this.generateMaze();
        console.log(`Maze generated with ${this.walls.length} walls and ${this.pellets.length} pellets`);
    }

    generateMaze() {
        // Clear existing arrays
        this.pellets = [];
        this.walls = [];
        this.doors = [];
        this.keys = [];
        this.collectedKeys.clear();

        // Generate maze layout based on level
        const layout = this.getMazeLayout();
        console.log('Maze layout generated:', layout.length, 'rows');

        // Parse layout and create game objects
        for (let y = 0; y < layout.length; y++) {
            for (let x = 0; x < layout[y].length; x++) {
                const pixel = gridToPixel(x, y);
                
                switch (layout[y][x]) {
                    case '#': // Wall
                        this.walls.push({
                            x: pixel.x,
                            y: pixel.y,
                            width: CELL_SIZE,
                            height: CELL_SIZE
                        });
                        break;
                    case '.': // Pellet
                        this.pellets.push({
                            x: pixel.x + CELL_SIZE / 2,
                            y: pixel.y + CELL_SIZE / 2,
                            width: 4,
                            height: 4
                        });
                        break;
                    case 'R': // Red door
                        this.doors.push({
                            x: pixel.x,
                            y: pixel.y,
                            width: CELL_SIZE,
                            height: CELL_SIZE,
                            color: '#FF0000'
                        });
                        break;
                    case 'G': // Green door
                        this.doors.push({
                            x: pixel.x,
                            y: pixel.y,
                            width: CELL_SIZE,
                            height: CELL_SIZE,
                            color: '#00FF00'
                        });
                        break;
                    case 'B': // Blue door
                        this.doors.push({
                            x: pixel.x,
                            y: pixel.y,
                            width: CELL_SIZE,
                            height: CELL_SIZE,
                            color: '#0000FF'
                        });
                        break;
                    case 'r': // Red key
                        this.keys.push({
                            x: pixel.x + CELL_SIZE / 2,
                            y: pixel.y + CELL_SIZE / 2,
                            width: CELL_SIZE / 2,
                            height: CELL_SIZE / 2,
                            color: '#FF0000'
                        });
                        break;
                    case 'g': // Green key
                        this.keys.push({
                            x: pixel.x + CELL_SIZE / 2,
                            y: pixel.y + CELL_SIZE / 2,
                            width: CELL_SIZE / 2,
                            height: CELL_SIZE / 2,
                            color: '#00FF00'
                        });
                        break;
                    case 'b': // Blue key
                        this.keys.push({
                            x: pixel.x + CELL_SIZE / 2,
                            y: pixel.y + CELL_SIZE / 2,
                            width: CELL_SIZE / 2,
                            height: CELL_SIZE / 2,
                            color: '#0000FF'
                        });
                        break;
                }
            }
        }
    }

    getMazeLayout() {
        const layouts = {
            1: [
                "############################",
                "#............##............#",
                "#.####.#####.##.#####.####.#",
                "#.####.#####.##.#####.####.#",
                "#.####.#####.##.#####.####.#",
                "#..........................#",
                "#.####.##.########.##.####.#",
                "#.####.##.########.##.####.#",
                "#......##....##....##......#",
                "######.##### ## #####.######",
                "     #.##### ## #####.#     ",
                "     #.##          ##.#     ",
                "     #.## ###--### ##.#     ",
                "######.## #      # ##.######",
                "      .   #      #   .      ",
                "######.## #      # ##.######",
                "     #.## ######## ##.#     ",
                "     #.##          ##.#     ",
                "     #.## ######## ##.#     ",
                "######.## ######## ##.######",
                "#............##............#",
                "#.####.#####.##.#####.####.#",
                "#.####.#####.##.#####.####.#",
                "#...##................##...#",
                "###.##.##.########.##.##.###",
                "#......##....##....##......#",
                "#.##########.##.##########.#",
                "#.##########.##.##########.#",
                "#..........................#",
                "############################"
            ],
            2: [
                "############################",
                "#............##............#",
                "#.####.#####.##.#####.####.#",
                "#.####.#####.##.#####B####.#",
                "#..........................#",
                "#.####.##.########.##.####.#",
                "#.####.##.########.##B####.#",
                "#......##....##....##......#",
                "######.##### ## #####.######",
                "     #.##### ## #####.#     ",
                "     #G##    --    ##.#     ",
                "######.## ###--### ##.######",
                "      .   #      #   .      ",
                "######.## #      # ##G######",
                "     #.## ######## ##.#     ",
                "     #.##    g     ##.#     ",
                "     #R## ######## ##.#     ",
                "######.## ######## ##.######",
                "#............##............#",
                "#.####.#####.##.#####.####.#",
                "#.####.#####.##.#####R####.#",
                "#b..##.......##.......##..r#",
                "###.##.##.########.##.##.###",
                "#......##....##....##......#",
                "#.##########.##.##########.#",
                "#.##########.##.##########.#",
                "#..........................#",
                "############################"
            ],
            3: [
                "############################",
                "#..........................#",
                "#.####.#####.##.#####.####.#",
                "#.####.#####.##.#####.####.#",
                "#..........................#",
                "#.####.##.########.##.####.#",
                "#.####.##.########.##.####.#",
                "#......##....##....##......#",
                "######.##### ## #####.######",
                "     #.##### ## #####.#     ",
                "     #.##          ##.#     ",
                "######.## ###--### ##.######",
                "      .   #      #   .      ",
                "######.## #      # ##.######",
                "     #.## ######## ##.#     ",
                "     #.##          ##.#     ",
                "     #.## ######## ##.#     ",
                "######.## ######## ##.######",
                "#..........................#",
                "#.####.#####.##.#####.####.#",
                "#.####.#####.##.#####.####.#",
                "#...##................##...#",
                "###.##.##.########.##.##.###",
                "#......##....##....##......#",
                "#.##########.##.##########.#",
                "#.##########.##.##########.#",
                "#..........................#",
                "############################"
            ]
        };
        return layouts[this.level] || layouts[1];
    }

    checkCollision(x, y, width, height) {
        const rect = { x, y, width, height };
        
        // Check walls
        if (this.walls.some(wall => checkCollision(rect, wall))) {
            return true;
        }
        
        // Check doors - only if key not collected
        return this.doors.some(door => {
            if (!this.collectedKeys.has(door.color)) {
                return checkCollision(rect, door);
            }
            return false;
        });
    }

    collectKey(player) {
        const playerRect = {
            x: player.x,
            y: player.y,
            width: player.width,
            height: player.height
        };

        for (let i = this.keys.length - 1; i >= 0; i--) {
            const key = this.keys[i];
            if (checkCollision(playerRect, key)) {
                this.collectedKeys.add(key.color);
                this.keys.splice(i, 1);
                return key.color; // Return the color of collected key
            }
        }
        return null;
    }

    draw(ctx, gooddataActive = false) {
        // Draw walls
        ctx.fillStyle = COLORS.MAZE;
        ctx.strokeStyle = '#004c99';
        ctx.lineWidth = 2;
        
        this.walls.forEach(wall => {
            drawRoundedRect(ctx, wall.x, wall.y, wall.width, wall.height, 4);
            ctx.fill();
            ctx.stroke();
        });

        // Draw doors
        this.doors.forEach(door => {
            if (!this.collectedKeys.has(door.color)) {
                ctx.fillStyle = door.color;
                ctx.strokeStyle = '#FFFFFF';
                ctx.lineWidth = 2;
                drawRoundedRect(ctx, door.x, door.y, door.width, door.height, 4);
                ctx.fill();
                ctx.stroke();
                
                // Draw key hole
                ctx.beginPath();
                ctx.arc(door.x + door.width/2, door.y + door.height/2, 6, 0, Math.PI * 2);
                ctx.stroke();
            }
        });

        // Draw pellets - pink during Gooddata effect in level 3
        ctx.fillStyle = (this.level === 3 && gooddataActive) ? '#FF3399' : COLORS.PELLET;
        this.pellets.forEach(pellet => {
            ctx.beginPath();
            ctx.arc(pellet.x, pellet.y, pellet.width / 2, 0, Math.PI * 2);
            ctx.fill();
        });

        // Draw keys with improved key design (drawn last to be on top)
        this.keys.forEach(key => {
            ctx.save();
            ctx.translate(key.x, key.y);
            ctx.rotate(Math.PI / 4); // Rotate 45 degrees

            // Add glow effect
            ctx.shadowColor = key.color;
            ctx.shadowBlur = 10;
            
            // Key settings - make keys larger
            const scale = 1.5; // Increase key size
            ctx.fillStyle = key.color;
            ctx.strokeStyle = '#FFFFFF';
            ctx.lineWidth = 3;

            // Draw key bow (handle)
            const bowRadius = (key.width / 3) * scale;
            ctx.beginPath();
            ctx.arc(0, 0, bowRadius, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            // Draw inner circle in bow
            ctx.beginPath();
            ctx.arc(0, 0, bowRadius / 2, 0, Math.PI * 2);
            ctx.stroke();

            // Draw key blade (shaft)
            const bladeLength = key.width * 0.8 * scale;
            ctx.beginPath();
            ctx.moveTo(bowRadius, 0);
            ctx.lineTo(bladeLength, 0);
            ctx.stroke();

            // Draw key teeth
            const teethStart = bowRadius + bladeLength * 0.4;
            const toothHeight = key.height / 3 * scale;
            const toothSpacing = bladeLength * 0.15;

            // First tooth
            ctx.beginPath();
            ctx.moveTo(teethStart, 0);
            ctx.lineTo(teethStart, toothHeight);
            ctx.stroke();

            // Second tooth
            ctx.beginPath();
            ctx.moveTo(teethStart + toothSpacing, 0);
            ctx.lineTo(teethStart + toothSpacing, toothHeight * 0.7);
            ctx.stroke();

            // Third tooth
            ctx.beginPath();
            ctx.moveTo(teethStart + toothSpacing * 2, 0);
            ctx.lineTo(teethStart + toothSpacing * 2, toothHeight);
            ctx.stroke();

            // Add pulsing animation effect
            const pulseScale = 1 + Math.sin(Date.now() / 500) * 0.1;
            ctx.scale(pulseScale, pulseScale);

            ctx.restore();
        });
    }

    isComplete() {
        return this.pellets.length === 0;
    }
} 