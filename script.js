const API = "https://kiyorasmpp.httpskiyorasmppkiyorasmpworkersdev.workers.dev";

const powerButton = document.getElementById("powerButton");
const message = document.getElementById("message");

async function startServer() {

    powerButton.disabled = true;
    powerButton.textContent = "⏳ DÉMARRAGE...";

    message.textContent = "Connexion à MineStrator...";

    try {

        const response = await fetch(API + "/power", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                action: "start"
            })
        });

        const data = await response.json();

        console.log(data);

        if (!response.ok || !data.success) {
            throw new Error(data.error || "Erreur");
        }

        powerButton.textContent = "✅ SERVEUR EN DÉMARRAGE";
        message.textContent = "Le serveur va démarrer !";

    } catch (error) {

        console.error(error);

        powerButton.disabled = false;
        powerButton.textContent = "▶️ ALLUMER LE SERVEUR";
        message.textContent = "❌ " + error.message;
    }
}
