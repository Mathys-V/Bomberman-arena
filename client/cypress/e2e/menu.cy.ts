describe('Parcours Joueur - Menu Principal & Lobby', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  describe('Écran Menu Principal', () => {
    it('affiche le titre Bomberman Arena', () => {
      cy.get('[data-cy="title"]').should('contain', 'Bomberman Arena');
    });

    it('affiche le champ pseudo et le bouton rejoindre', () => {
      cy.get('[data-cy="pseudo-input"]').should('be.visible');
      cy.get('[data-cy="join-btn"]').should('be.visible');
    });

    it('affiche une erreur si le pseudo est vide', () => {
      cy.get('[data-cy="join-btn"]').click();
      cy.get('[data-cy="error-msg"]')
        .should('be.visible')
        .and('contain', 'au moins 2 caractères');
    });

    it('affiche une erreur si le pseudo fait 1 caractère', () => {
      cy.get('[data-cy="pseudo-input"]').type('A');
      cy.get('[data-cy="join-btn"]').click();
      cy.get('[data-cy="error-msg"]').should('be.visible');
    });

    it('passe au lobby avec un pseudo valide', () => {
      cy.get('[data-cy="pseudo-input"]').type('Bob');
      cy.get('[data-cy="join-btn"]').click();
      cy.get('[data-cy="menu-screen"]').should('have.class', 'hidden');
      cy.get('[data-cy="lobby-screen"]').should('not.have.class', 'hidden');
      cy.get('[data-cy="player-name"]').should('contain', 'Bob');
    });

    it('passe au lobby avec la touche Entrée', () => {
      cy.get('[data-cy="pseudo-input"]').type('Bob{enter}');
      cy.get('[data-cy="menu-screen"]').should('have.class', 'hidden');
      cy.get('[data-cy="lobby-title"]').should('be.visible');
      cy.get('[data-cy="player-name"]').should('contain', 'Bob');
    });
  });

  describe('Écran Lobby & Interactions', () => {
    beforeEach(() => {
      cy.get('[data-cy="pseudo-input"]').type('Bob');
      cy.get('[data-cy="join-btn"]').click();
    });

    it('affiche les informations du joueur et le statut initial', () => {
      cy.get('[data-cy="lobby-title"]').should('be.visible');
      cy.get('[data-cy="player-name"]').should('contain', 'Bob');
      cy.get('[data-cy="ready-status"]').should('contain', 'Non prêt');
      cy.get('[data-cy="ready-btn"]').should('be.visible');
      cy.get('[data-cy="start-game-btn"]').should('be.visible');
    });

    it('met à jour l’écran quand le joueur clique sur le bouton Prêt', () => {
      cy.get('[data-cy="ready-btn"]').click();
      cy.get('[data-cy="ready-status"]').should('contain', 'Prêt !');
      cy.get('[data-cy="ready-btn"]').should('have.class', 'ready-active');

      // Clic à nouveau pour repasser en non prêt
      cy.get('[data-cy="ready-btn"]').click();
      cy.get('[data-cy="ready-status"]').should('contain', 'Non prêt');
      cy.get('[data-cy="ready-btn"]').should('not.have.class', 'ready-active');
    });
  });
});
