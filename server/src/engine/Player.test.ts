import { Player } from './Player';
import { Grid } from './Grid';

describe('Player', () => {
  // Création d'une fausse grille pour isoler le test du joueur
  const mockGrid = {
    isObstacle: (x: number, y: number) => {
      // On simule un mur arbitraire en x: 1, y: 0
      return x === 1 && y === 0;
    }
  } as unknown as Grid;

  it('devrait instancier le joueur aux coordonnées de départ', () => {
    const player = new Player(0, 0);
    expect(player.x).toBe(0);
    expect(player.y).toBe(0);
  });

  it('devrait se déplacer si la case est libre', () => {
    const player = new Player(0, 1);
    player.move('RIGHT', mockGrid);
    expect(player.x).toBe(1);
    expect(player.y).toBe(1);
  });

  it('ne devrait pas traverser les murs', () => {
    const player = new Player(0, 0);
    player.move('RIGHT', mockGrid);
    expect(player.x).toBe(0);
    expect(player.y).toBe(0);
  });
});