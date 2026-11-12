import { Grid } from '../engine/Grid';
export class Bomb {
    public x: number;
    public y: number;
    public ownerId: string;
    public radius: number;
    public isExploded: boolean;

    constructor(x: number, y: number, ownerId: string, radius: number = 2) {
        this.x = x;
        this.y = y;
        this.ownerId = ownerId;
        this.radius = radius;
        this.isExploded = false;
    }

    // Déclenche le compte à rebours asynchrone
    public startTimer(delayInMs: number, onExplode: () => void): void {
        setTimeout(() => {
            this.isExploded = true;
            onExplode();
        }, delayInMs);
    }
    // Retourne un tableau des coordonnées (x,y) touchées par l'explosion en croix
    // Retourne les coordonnées (x,y) touchées, en s'arrêtant sur les obstacles
    public getExplosionTiles(grid: Grid): { x: number, y: number }[] {
        const tiles: { x: number, y: number }[] = [];
        const layout = grid.getLayout();
        const { width, height } = grid;

        // On inclut toujours le centre
        tiles.push({ x: this.x, y: this.y });

        // Les 4 directions : Droite, Gauche, Bas, Haut
        const directions = [
            { dx: 1, dy: 0 },
            { dx: -1, dy: 0 },
            { dx: 0, dy: 1 },
            { dx: 0, dy: -1 }
        ];

        for (const dir of directions) {
            for (let i = 1; i <= this.radius; i++) {
                const checkX = this.x + (dir.dx * i);
                const checkY = this.y + (dir.dy * i);

                // 1. Vérification des limites de la carte
                if (checkX < 0 || checkX >= width || checkY < 0 || checkY >= height) {
                    break; // On arrête cette direction si on sort de la map
                }

                const tileType = layout[checkY][checkX];

                // 2. Gestion des collisions
                if (tileType === 1) {
                    // Mur incassable : l'explosion s'arrête avant cette case
                    break;
                } else if (tileType === 2) {
                    // Caisse : on l'ajoute pour la détruire, mais on arrête la propagation
                    tiles.push({ x: checkX, y: checkY });
                    break;
                } else {
                    // Case vide (0) : on l'ajoute et l'explosion continue
                    tiles.push({ x: checkX, y: checkY });
                }
            }
        }

        return tiles;
    }
}