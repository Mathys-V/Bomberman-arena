import { initCanva } from './canvas/gameCanvas.js';

const { invoke } = window.__TAURI__.core;

let greetInputEl;
let greetMsgEl;

async function greet() {
    greetMsgEl.textContent = await invoke("greet", { name: greetInputEl.value });
}


window.addEventListener("DOMContentLoaded", async () => {
    greetInputEl = document.querySelector("#greet-input");
    greetMsgEl = document.querySelector("#greet-msg");
    const greetForm = document.querySelector("#greet-form");
    
    if (greetForm) {
        greetForm.addEventListener("submit", (e) => {
            e.preventDefault();
            greet();
        });
    }

    try {
        console.log("Démarrage du client Bomberman...");
        const app = await initCanva();
        console.log("Moteur PixiJS initialisé et attaché au DOM avec succès !", app);
    } catch (error) {
        console.error("Erreur lors de l'initialisation de PixiJS :", error);
    }
});