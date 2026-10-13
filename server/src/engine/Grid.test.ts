import { Grid } from './Grid';

describe('Game Engine - Grid', () => {
  it('doit initialiser une grille avec la bonne largeur et hauteur', () => {
    const grid = new Grid(15, 13);
    expect(grid.width).toBe(15);
    expect(grid.height).toBe(13);
  });
});

describe('Grid Generation', () => {
  it('devrait générer une grille 2D correspondant à la largeur et hauteur', () => {
    const grid = new Grid(15, 13);
    const layout = grid.getLayout();
    expect(layout.length).toBe(13);
    expect(layout[0].length).toBe(15);
  });
});

describe('Wall Generation', () => {
  it('devrait placer des murs fixes (1) aux coordonnées impaires', () => {
    const grid = new Grid(15, 13);
    const layout = grid.getLayout();
    
    expect(layout[1][1]).toBe(1);
    expect(layout[1][3]).toBe(1);
    expect(layout[3][1]).toBe(1);
  });

  it('devrait placer des murs destructibles (2) aléatoirement en gardant les spawns libres (0)', () => {
    const grid = new Grid(15, 13);
    const layout = grid.getLayout();
    
    // Les 3 cases du coin supérieur gauche (spawn du joueur 1) doivent être vides
    expect(layout[0][0]).toBe(0);
    expect(layout[0][1]).toBe(0);
    expect(layout[1][0]).toBe(0);
    
    // Vérifie qu'il y a au moins une caisse (2) générée sur le reste de la carte
    const hasBox = layout.some(row => row.includes(2));
    expect(hasBox).toBe(true);
  });
});