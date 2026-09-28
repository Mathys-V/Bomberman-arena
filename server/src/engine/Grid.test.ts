import { Grid } from './Grid';

describe('Game Engine - Grid', () => {
    it('doit initialiser une grille avec la bonne largeur et hauteur', () => {
        // Arrange & Act
        const grid = new Grid(15, 13);

        // Assert
        expect(grid.width).toBe(15);
        expect(grid.height).toBe(13);
    });
});