import { Player } from './Player';

describe('Classe Player', () => {
    it('devrait instancier un joueur avec un ID et des coordonnées', () => {
        const player = new Player('p1', 5, 5);
        expect(player.id).toBe('p1');
        expect(player.x).toBe(5);
        expect(player.y).toBe(5);
    });
});