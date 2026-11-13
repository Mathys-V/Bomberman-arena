import { Player } from './Player';
import { Grid } from './Grid';

describe('Player', () => {
  // Création d'une fausse grille pour isoler le test du joueur
  const mockGrid = {
    isObstacle: (x: number, y: number) => {
      // Obstacle en (1, 0) et (0, -1)
      return (x === 1 && y === 0) || (x === 0 && y === -1);
    }
  } as unknown as Grid;

  it('devrait instancier le joueur aux coordonnées de départ', () => {
    const player = new Player(0, 0);
    expect(player.x).toBe(0);
    expect(player.y).toBe(0);
  });

  it('devrait se déplacer à droite si la case est libre', () => {
    const player = new Player(0, 1);
    player.move('RIGHT', mockGrid);
    expect(player.x).toBe(1);
    expect(player.y).toBe(1);
  });

  it('devrait se déplacer en haut si la case est libre', () => {
    const player = new Player(0, 2);
    player.move('UP', mockGrid);
    expect(player.x).toBe(0);
    expect(player.y).toBe(1);
  });

  it('devrait se déplacer en bas si la case est libre', () => {
    const player = new Player(0, 2);
    player.move('DOWN', mockGrid);
    expect(player.x).toBe(0);
    expect(player.y).toBe(3);
  });

  it('devrait se déplacer à gauche si la case est libre', () => {
    const player = new Player(2, 2);
    player.move('LEFT', mockGrid);
    expect(player.x).toBe(1);
    expect(player.y).toBe(2);
  });

  it('ne devrait pas traverser les murs', () => {
    const player = new Player(0, 0);
    player.move('RIGHT', mockGrid);
    expect(player.x).toBe(0);
    expect(player.y).toBe(0);

    player.move('UP', mockGrid);
    expect(player.x).toBe(0);
    expect(player.y).toBe(0);
  });
});
