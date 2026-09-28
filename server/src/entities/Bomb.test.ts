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
});