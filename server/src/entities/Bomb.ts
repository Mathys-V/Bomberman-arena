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
    public getExplosionTiles(): { x: number, y: number }[] {
        const tiles: { x: number, y: number }[] = [];

        // On inclut toujours le centre (la case de la bombe)
        tiles.push({ x: this.x, y: this.y });

        // On calcule la croix en fonction du radius
        for (let i = 1; i <= this.radius; i++) {
            tiles.push({ x: this.x + i, y: this.y }); // Droite
            tiles.push({ x: this.x - i, y: this.y }); // Gauche
            tiles.push({ x: this.x, y: this.y + i }); // Bas
            tiles.push({ x: this.x, y: this.y - i }); // Haut
        }

        return tiles;
    }
}