class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = CELL_SIZE - 2;
        this.height = CELL_SIZE - 2;
        this.direction = DIRECTIONS.RIGHT;
        this.nextDirection = null;
        // Level 1 speed is 2.5, Level 2 is 1.2x faster
        this.baseSpeed = window.currentLevel === 1 ? 2.5 : 2.5 * 1.2;
        this.speed = this.baseSpeed;
        this.score = 0;
        this.tentacleAngle = 0;
        this.eyeAngle = 0;
        this.lastUpdate = performance.now();
    }

    update(maze) {
        const now = performance.now();
        const deltaTime = Math.min((now - this.lastUpdate) / 16.67, 1);
        this.lastUpdate = now;

        // Update tentacle animation
        this.tentacleAngle += 0.15;
        this.eyeAngle = Math.sin(this.tentacleAngle) * 0.2;

        const moveAmount = this.speed * deltaTime; // Use this.speed instead of this.baseSpeed

        // Try to change direction if there's a pending direction
        if (this.nextDirection) {
            // Calculate the center of the current cell
            const cellX = Math.round(this.x / CELL_SIZE) * CELL_SIZE;
            const cellY = Math.round(this.y / CELL_SIZE) * CELL_SIZE;
            
            // Check if we're close enough to the center of the cell to turn
            const distanceX = Math.abs(this.x - cellX);
            const distanceY = Math.abs(this.y - cellY);
            
            if (distanceX <= this.speed && distanceY <= this.speed) { // Use this.speed here too
                // We're at a cell center, check if we can turn
                const nextX = cellX + this.nextDirection.x * CELL_SIZE;
                const nextY = cellY + this.nextDirection.y * CELL_SIZE;
                
                if (!maze.checkCollision(nextX, nextY, this.width, this.height)) {
                    // Align to grid when turning
                    this.x = cellX;
                    this.y = cellY;
                    this.direction = this.nextDirection;
                    this.nextDirection = null;
                }
            }
        }

        // Move in current direction
        const newX = this.x + this.direction.x * moveAmount;
        const newY = this.y + this.direction.y * moveAmount;

        // Check for maze collision
        if (!maze.checkCollision(newX, newY, this.width, this.height)) {
            this.x = newX;
            this.y = newY;
        }

        // Handle screen wrapping
        if (this.x < -this.width) this.x = GRID_WIDTH * CELL_SIZE;
        if (this.x > GRID_WIDTH * CELL_SIZE) this.x = -this.width;
    }

    reset() {
        // Level 1 speed is 2.5, Level 2 is 1.2x faster
        this.baseSpeed = window.currentLevel === 1 ? 2.5 : 2.5 * 1.2;
        this.speed = this.baseSpeed;
        
        this.lastUpdate = performance.now();
        this.direction = DIRECTIONS.RIGHT;
        this.nextDirection = null;
        this.tentacleAngle = 0;
        this.eyeAngle = 0;
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
        
        // Always keep the octopus upright, only flip horizontally when moving left
        if (this.direction === DIRECTIONS.LEFT) {
            ctx.scale(-1, 1); // Flip horizontally for left movement
        }

        // Draw the octopus body (more round)
        ctx.fillStyle = COLORS.PLAYER;
        ctx.beginPath();
        ctx.arc(0, 0, this.width / 2, 0, Math.PI * 2);
        ctx.fill();

        // Draw eyes (white part)
        const eyeX = this.width / 5;
        const eyeY = -this.height / 6;
        const eyeSize = this.width / 6;

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(-eyeX, eyeY, eyeSize, 0, Math.PI * 2);
        ctx.arc(eyeX, eyeY, eyeSize, 0, Math.PI * 2);
        ctx.fill();

        // Draw pupils (black part)
        ctx.fillStyle = '#000000';
        const pupilOffset = Math.sin(this.eyeAngle) * (eyeSize / 3);
        ctx.beginPath();
        ctx.arc(-eyeX + pupilOffset, eyeY, eyeSize / 2, 0, Math.PI * 2);
        ctx.arc(eyeX + pupilOffset, eyeY, eyeSize / 2, 0, Math.PI * 2);
        ctx.fill();

        // Draw smile
        ctx.beginPath();
        ctx.arc(0, eyeY + eyeSize * 2, eyeSize * 1.5, 0, Math.PI);
        ctx.strokeStyle = '#004080';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Draw tentacles (shorter and thicker)
        const numTentacles = 6; // Reduced number of tentacles
        const tentacleLength = this.width * 0.4; // Shorter tentacles
        
        for (let i = 0; i < numTentacles; i++) {
            const baseAngle = (i * Math.PI * 2 / numTentacles) + Math.PI / 2; // Start from bottom
            const wiggleAngle = Math.sin(this.tentacleAngle + i) * 0.3;
            const tentacleAngle = baseAngle + wiggleAngle;

            ctx.beginPath();
            ctx.moveTo(0, this.height / 3); // Start from bottom of body
            
            // Control points for curve
            const cp1x = Math.cos(tentacleAngle) * (tentacleLength * 0.5);
            const cp1y = Math.sin(tentacleAngle) * (tentacleLength * 0.5) + this.height / 3;
            const cp2x = Math.cos(tentacleAngle) * (tentacleLength * 0.8);
            const cp2y = Math.sin(tentacleAngle) * (tentacleLength * 0.8) + this.height / 3;
            const endX = Math.cos(tentacleAngle) * tentacleLength;
            const endY = Math.sin(tentacleAngle) * tentacleLength + this.height / 3;

            ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, endX, endY);
            
            ctx.lineWidth = 4; // Thicker tentacles
            ctx.strokeStyle = COLORS.PLAYER;
            ctx.lineCap = 'round';
            ctx.stroke();
        }

        ctx.restore();
    }

    setDirection(newDirection) {
        this.nextDirection = newDirection;
    }
} 