import { startServer } from './server';
import { describe, it, expect } from '@jest/globals';

describe('Game Server', () => {
    it('doit instancier le serveur sans erreur', () => {
        const wss = startServer(8081);
        expect(wss).toBeDefined();
        wss.close(); // Nettoyage du port pour éviter qu'il reste ouvert
    });
});