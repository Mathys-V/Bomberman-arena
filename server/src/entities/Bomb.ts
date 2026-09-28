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
}