import { Bomb } from './Bomb';
import { Grid } from '../engine/Grid';

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

    it('devrait calculer la zone en s\'arrêtant sur les murs et caisses', () => {
        const bomb = new Bomb(2, 2, 'player1', 3);
        
        // Création d'une fausse grille pour le test
        const mockGrid = {
            width: 5,
            height: 5,
            getLayout: () => [
                [0, 0, 0, 0, 0],
                [0, 0, 1, 0, 0], // Mur incassable en haut
                [0, 2, 0, 0, 0], // Caisse à gauche, vide à droite
                [0, 0, 2, 0, 0], // Caisse en bas
                [0, 0, 0, 0, 0]
            ]
        } as unknown as Grid;

        const tiles = bomb.getExplosionTiles(mockGrid);

        // Centre (1) + Droite (2) + Gauche stoppée (1) + Bas stoppée (1) + Haut bloquée (0) = 5 cases
        expect(tiles).toHaveLength(5);
        expect(tiles).toContainEqual({ x: 2, y: 2 }); // Centre
        expect(tiles).toContainEqual({ x: 3, y: 2 }); // Droite 1 (vide)
        expect(tiles).toContainEqual({ x: 4, y: 2 }); // Droite 2 (vide)
        expect(tiles).toContainEqual({ x: 1, y: 2 }); // Gauche (caisse détruite)
        expect(tiles).toContainEqual({ x: 2, y: 3 }); // Bas (caisse détruite)
    });

    it('devrait détruire uniquement les caisses touchées sur la grille lors de explode()', () => {
        const grid = new Grid(5, 5);
        const layout = grid.getLayout();

        // On force un scénario précis autour de (2,2)
        layout[2][2] = 0; // Centre
        layout[2][3] = 2; // Caisse à droite
        layout[1][2] = 1; // Mur incassable en haut

        const bomb = new Bomb(2, 2, 'player1', 1);
        const results = bomb.explode(grid);

        // La caisse à droite doit être devenue une case vide (0)
        expect(grid.getLayout()[2][3]).toBe(0);
        // Le mur en haut doit rester intact (1)
        expect(grid.getLayout()[1][2]).toBe(1);
        // Le résultat doit indiquer que la caisse en (3,2) a bien été détruite
        expect(results).toContainEqual({ x: 3, y: 2, destroyedCrate: true });
    });
});