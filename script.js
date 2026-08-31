const API = "https://kiyorasmpp.httpskiyorasmppkiyorasmpworkersdev.workers.dev";

async function testWorker() {
    const message = document.getElementById("message");

    try {
        message.textContent = "⏳ Connexion au Worker...";

        const response = await fetch(API + "/status");

        const data = await response.json();

        console.log("WORKER :", data);

        if (data.success) {
            message.textContent =
                `🟢 Serveur en ligne — ${data.players}/${data.maxPlayers}`;
        } else {
            message.textContent =
                "❌ " + (data.error || "Erreur Worker");
        }

    } catch (error) {
        console.error("FETCH ERROR :", error);

        message.textContent =
            "❌ Failed to fetch : " + error.message;
    }
}

testWorker();
