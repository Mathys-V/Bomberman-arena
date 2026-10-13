export class Grid {
  readonly width: number;
  readonly height: number;
  private layout: number[][];

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
    
    this.layout = Array.from({ length: height }, (_, y) => 
      Array.from({ length: width }, (_, x) => {
        // 1. Murs fixes (1) aux index impairs
        if (x % 2 !== 0 && y % 2 !== 0) {
          return 1;
        }
        
        // 2. Définition des zones de sécurité (les 3 cases dans chaque coin)
        const isTopLeftSafe = (x <= 1 && y === 0) || (x === 0 && y <= 1);
        const isTopRightSafe = (x >= width - 2 && y === 0) || (x === width - 1 && y <= 1);
        const isBottomLeftSafe = (x <= 1 && y === height - 1) || (x === 0 && y >= height - 2);
        const isBottomRightSafe = (x >= width - 2 && y === height - 1) || (x === width - 1 && y >= height - 2);
        
        const isSafeZone = isTopLeftSafe || isTopRightSafe || isBottomLeftSafe || isBottomRightSafe;

        // 3. Si on est dans un spawn, la case reste obligatoirement vide (0)
        if (isSafeZone) {
          return 0;
        }

        // 4. Sur le reste de la carte, 60% de chance d'avoir une caisse (2), sinon du vide (0)
        return Math.random() < 0.6 ? 2 : 0;
      })
    );
  }

  getLayout(): number[][] {
    return this.layout;
  }
}