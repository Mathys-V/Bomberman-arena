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

        // Vérification
        // Centre (1) + Droite (2) + Gauche stoppée (1) + Bas stoppée (1) + Haut bloquée (0) = 5 cases
        expect(tiles).toHaveLength(5);
        expect(tiles).toContainEqual({ x: 2, y: 2 }); // Centre
        expect(tiles).toContainEqual({ x: 3, y: 2 }); // Droite 1 (vide)
        expect(tiles).toContainEqual({ x: 4, y: 2 }); // Droite 2 (vide)
        expect(tiles).toContainEqual({ x: 1, y: 2 }); // Gauche (caisse détruite)
        expect(tiles).toContainEqual({ x: 2, y: 3 }); // Bas (caisse détruite)
        // La case {x:2, y:1} (mur en haut) ne doit pas y être
    });
});