class Ghost {
    constructor(x, y, color, speed = 1) {
        this.x = x;
        this.y = y;
        this.width = CELL_SIZE - 2;
        this.height = CELL_SIZE - 2;
        this.color = color;
        this.direction = DIRECTIONS.LEFT;
        this.speed = speed;
        this.nextDirectionChange = 0;
        this.frozen = false;
        this.frozenTimer = null;
    }

    update(maze, deltaTime) {
        // If frozen, don't move
        if (this.frozen) {
            return;
        }

        // Check if current direction leads to a wall
        const nextX = this.x + this.direction.x * this.speed;
        const nextY = this.y + this.direction.y * this.speed;
        const willHitWall = maze.checkCollision(nextX, nextY, this.width, this.height);

        // Change direction if hitting a wall
        if (willHitWall) {
            const possibleDirections = [];
            for (const dir of Object.values(DIRECTIONS)) {
                const testX = this.x + dir.x * this.speed;
                const testY = this.y + dir.y * this.speed;
                if (!maze.checkCollision(testX, testY, this.width, this.height)) {
                    possibleDirections.push(dir);
                }
            }
            
            if (possibleDirections.length > 0) {
                // Choose random direction from valid options
                this.direction = possibleDirections[Math.floor(Math.random() * possibleDirections.length)];
            }
        }

        // Move in current direction
        if (!willHitWall) {
            this.x += this.direction.x * this.speed;
            this.y += this.direction.y * this.speed;
        }

        // Handle screen wrapping
        if (this.x < -this.width) this.x = GRID_WIDTH * CELL_SIZE;
        else if (this.x > GRID_WIDTH * CELL_SIZE) this.x = -this.width;
        if (this.y < -this.height) this.y = GRID_HEIGHT * CELL_SIZE;
        else if (this.y > GRID_HEIGHT * CELL_SIZE) this.y = -this.height;
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x + this.width / 2, this.y + this.height / 2);

        // Draw ghost body
        ctx.beginPath();
        ctx.arc(0, -this.height/4, this.width/2, Math.PI, 0, false);
        ctx.lineTo(this.width/2, this.height/3);
        
        // Draw wavy bottom
        const waves = 3;
        const waveHeight = this.height/6;
        for (let i = 0; i <= waves; i++) {
            const x = this.width/2 - (i * this.width/waves);
            ctx.lineTo(x, this.height/3 + ((i % 2) * waveHeight));
        }
        
        ctx.lineTo(-this.width/2, this.height/3);
        ctx.closePath();

        // Fill with ghost color - make frozen ghosts more transparent and add blue tint
        if (this.frozen) {
            ctx.fillStyle = '#80C8FF80'; // Light blue with 50% transparency
            ctx.shadowColor = '#29B5E8';
            ctx.shadowBlur = 10;
        } else {
            ctx.fillStyle = this.color;
            ctx.shadowBlur = 0;
        }
        ctx.fill();

        // Draw eyes
        const eyeX = this.width/4;
        const eyeY = -this.height/4;
        const eyeRadius = this.width/6;
        
        // Eye whites
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(-eyeX, eyeY, eyeRadius, 0, Math.PI * 2);
        ctx.arc(eyeX, eyeY, eyeRadius, 0, Math.PI * 2);
        ctx.fill();
        
        // Pupils
        const pupilOffset = {
            x: Math.cos(Math.atan2(this.direction.y, this.direction.x)) * eyeRadius/2,
            y: Math.sin(Math.atan2(this.direction.y, this.direction.x)) * eyeRadius/2
        };
        
        ctx.fillStyle = 'blue';
        ctx.beginPath();
        ctx.arc(-eyeX + pupilOffset.x, eyeY + pupilOffset.y, eyeRadius/2, 0, Math.PI * 2);
        ctx.arc(eyeX + pupilOffset.x, eyeY + pupilOffset.y, eyeRadius/2, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }

    reset(x, y) {
        this.x = x;
        this.y = y;
        this.direction = DIRECTIONS.LEFT;
        this.nextDirectionChange = 0;
        
        // Clear frozen state
        this.frozen = false;
        if (this.frozenTimer) {
            clearTimeout(this.frozenTimer);
            this.frozenTimer = null;
        }
    }
} 