import { Bomb } from './Bomb';

describe('Bomb Entity', () => {
    beforeAll(() => {
        jest.useFakeTimers();
    });

    afterAll(() => {
        jest.useRealTimers();
    });

    it('devrait initialiser la bombe avec les bonnes coordonnées', () => {
        const bomb = new Bomb(5, 5, 'player1');
        expect(bomb.x).toBe(5);
        expect(bomb.y).toBe(5);
        expect(bomb.ownerId).toBe('player1');
        expect(bomb.isExploded).toBe(false);
    });

    it('devrait exploser et appeler le callback après le délai imparti', () => {
        const bomb = new Bomb(2, 3, 'player2');
        const onExplodeMock = jest.fn();

        bomb.startTimer(3000, onExplodeMock);
        
        // Avant l'expiration du temps
        expect(bomb.isExploded).toBe(false);
        expect(onExplodeMock).not.toHaveBeenCalled();

        // On avance le temps virtuel de Jest de 3 secondes
        jest.advanceTimersByTime(3000);

        // Après l'expiration du temps
        expect(bomb.isExploded).toBe(true);
        expect(onExplodeMock).toHaveBeenCalledTimes(1);
    });

    it('devrait calculer correctement la zone d\'explosion en croix', () => {
        // Une bombe en x=5, y=5 avec un rayon de 2
        const bomb = new Bomb(5, 5, 'player1', 2);
        const tiles = bomb.getExplosionTiles();

        // Une croix de rayon 2 + le centre = 9 cases touchées
        expect(tiles.length).toBe(9);
        
        // Vérification de la présence de quelques cases clés
        expect(tiles).toContainEqual({ x: 5, y: 5 }); // Centre
        expect(tiles).toContainEqual({ x: 7, y: 5 }); // Extrême droite
        expect(tiles).toContainEqual({ x: 3, y: 5 }); // Extrême gauche
        expect(tiles).toContainEqual({ x: 5, y: 7 }); // Extrême bas
        expect(tiles).toContainEqual({ x: 5, y: 3 }); // Extrême haut
    });
});