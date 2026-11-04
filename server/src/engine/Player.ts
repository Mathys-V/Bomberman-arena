import { Grid } from './Grid';

export class Player {
  constructor(public x: number, public y: number) {}

  move(direction: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT', grid: Grid): void {
    let nextX = this.x;
    let nextY = this.y;

    switch (direction) {
      case 'UP': nextY -= 1; break;
      case 'DOWN': nextY += 1; break;
      case 'LEFT': nextX -= 1; break;
      case 'RIGHT': nextX += 1; break;
    }

    // Le joueur ne se déplace que si la case cible n'est pas un obstacle
    if (!grid.isObstacle(nextX, nextY)) {
      this.x = nextX;
      this.y = nextY;
    }
  }
}