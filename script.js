const API = "https://kiyorasmpp.httpskiyorasmppkiyorasmpworkersdev.workers.dev";
const SERVER_IP = "kiyorasmp.minecraft.how";

let serverOnline = false;
let busy = false;

const statusElement = document.getElementById("status");
const playersElement = document.getElementById("players");
const powerButton = document.getElementById("powerButton");
const powerIcon = document.getElementById("powerIcon");
const powerText = document.getElementById("powerText");
const restartButton = document.querySelector(".restart-button");
const messageElement = document.getElementById("message");

async function getStatus() {
    try {
        const response = await fetch(`${API}/status`, {
            method: "GET",
            mode: "cors",
            cache: "no-store"
        });

        if (!response.ok) {
            throw new Error(`Worker HTTP ${response.status}`);
        }

        const data = await response.json();

        if (!data.success) {
            throw new Error(data.error || "Erreur du Worker");
        }

        serverOnline = Boolean(data.online);

        updateInterface(
            serverOnline,
            data.players ?? 0,
            data.maxPlayers ?? 20
        );

        showMessage("");

    } catch (error) {
        console.error("Erreur statut :", error);

        statusElement.className = "status offline";
        statusElement.innerHTML =
            `<span class="status-dot"></span> Indisponible`;

        playersElement.textContent = "-- / --";

        showMessage("❌ Impossible de contacter le serveur");
    }
}

function updateInterface(online, players, maxPlayers) {

    if (online) {

        statusElement.className = "status online";

        statusElement.innerHTML =
            `<span class="status-dot"></span> Serveur en ligne`;

        playersElement.textContent =
            `${players} / ${maxPlayers}`;

        powerButton.classList.remove("start");
        powerButton.classList.add("stop");

        powerIcon.textContent = "■";
        powerText.textContent = "FERMER LE SERVEUR";

    } else {

        statusElement.className = "status offline";

        statusElement.innerHTML =
            `<span class="status-dot"></span> Serveur hors ligne`;

        playersElement.textContent =
            `0 / ${maxPlayers}`;

        powerButton.classList.remove("stop");
        powerButton.classList.add("start");

        powerIcon.textContent = "▶";
        powerText.textContent = "DÉMARRER LE SERVEUR";
    }
}

async function toggleServer() {

    if (busy) return;

    if (serverOnline) {
        await powerAction("stop");
    } else {
        await powerAction("start");
    }
}

async function restartServer() {

    if (busy) return;

    await powerAction("restart");
}

async function powerAction(action) {

    busy = true;
    setButtonsDisabled(true);

    if (action === "start") {
        showMessage("⏳ Démarrage du serveur...");
    } else if (action === "stop") {
        showMessage("⏳ Fermeture du serveur...");
    } else {
        showMessage("⏳ Redémarrage du serveur...");
    }

    try {

        const response = await fetch(`${API}/power`, {
            method: "POST",
            mode: "cors",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                action
            })
        });

        if (!response.ok) {
            throw new Error(`Worker HTTP ${response.status}`);
        }

        const data = await response.json();

        if (!data.success) {
            throw new Error(data.error || "Action refusée");
        }

        if (action === "start") {
            showMessage("✅ Démarrage demandé !");
        } else if (action === "stop") {
            showMessage("✅ Fermeture demandée !");
        } else {
            showMessage("✅ Redémarrage demandé !");
        }

        setTimeout(getStatus, 3000);
        setTimeout(getStatus, 8000);
        setTimeout(getStatus, 15000);

    } catch (error) {

        console.error("Erreur power :", error);

        showMessage("❌ " + error.message);

    } finally {

        setTimeout(() => {
            busy = false;
            setButtonsDisabled(false);
        }, 2000);
    }
}

function setButtonsDisabled(disabled) {

    if (powerButton) {
        powerButton.disabled = disabled;
    }

    if (restartButton) {
        restartButton.disabled = disabled;
    }
}

function showMessage(text) {

    if (messageElement) {
        messageElement.textContent = text;
    }
}

async function copyIP() {

    try {

        await navigator.clipboard.writeText(SERVER_IP);

        const toast = document.getElementById("toast");

        if (toast) {
            toast.classList.add("show");

            setTimeout(() => {
                toast.classList.remove("show");
            }, 1800);
        }

    } catch {

        showMessage("IP : " + SERVER_IP);
    }
}

getStatus();

setInterval(getStatus, 15000);
