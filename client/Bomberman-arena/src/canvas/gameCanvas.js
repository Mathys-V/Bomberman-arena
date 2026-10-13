import { Application } from "pixi.js";

export async function initCanva() {
  const app = new Application();

  const container = document.getElementById("game-container");
  if (!container) {
    console.error("Le conteneur #game-container est introuvable dans le DOM.");
    return;
  }

  // Initialisation standard de PixiJS v8
  await app.init({
    width: 800,
    height: 600,
    antialias: true,
    backgroundAlpha: 0,
  });

  // Nettoyage et injection du canvas
  container.innerHTML = "";
  app.canvas.style.backgroundColor = "#d0f3ff";
  container.appendChild(app.canvas);

  console.log("Moteur PixiJS initialisé avec succès !");
  return app;
}
