const API = "https://kiyorasmpp.kiyorasmp.workers.dev";

async function getStatus() {
    try {
        const response = await fetch(API + "/status");
        const data = await response.json();

        if (!data.success) {
            throw new Error(data.error);
        }

        if (data.online) {
            document.getElementById("status").textContent = "🟢 En ligne";
        } else {
            document.getElementById("status").textContent = "🔴 Hors ligne";
        }

        document.getElementById("players").textContent =
            `👥 ${data.players} / ${data.maxPlayers}`;

    } catch (error) {
        document.getElementById("status").textContent =
            "⚠️ Impossible de vérifier le serveur";

        document.getElementById("players").textContent =
            "👥 -- / --";
    }
}

async function power(action) {

    const message = document.getElementById("message");

    message.textContent = "⏳ Action en cours...";

    try {

        const response = await fetch(API + "/power", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                action: action
            })
        });

        const data = await response.json();

        if (!data.success) {
            throw new Error(data.error);
        }

        message.textContent = "✅ Action envoyée !";

        setTimeout(getStatus, 3000);

    } catch (error) {

        message.textContent =
            "❌ " + error.message;
    }
}

getStatus();

setInterval(getStatus, 15000);
