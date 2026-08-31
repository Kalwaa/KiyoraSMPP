const API = "https://kiyorasmpp.kiyorasmp.workers.dev";

const SERVER_IP = "kiyorasmp.minecraft.how";

let serverOnline = false;
let busy = false;


/* =========================
   ELEMENTS
========================= */

const statusElement =
    document.getElementById("status");

const playersElement =
    document.getElementById("players");

const powerButton =
    document.getElementById("powerButton");

const powerIcon =
    document.getElementById("powerIcon");

const powerText =
    document.getElementById("powerText");

const restartButton =
    document.querySelector(".restart-button");

const messageElement =
    document.getElementById("message");


/* =========================
   STATUS
========================= */

async function getStatus() {

    try {

        const response =
            await fetch(API + "/status", {
                cache: "no-store"
            });

        const data =
            await response.json();

        if (!response.ok || !data.success) {
            throw new Error(
                data.error ||
                "Erreur du Worker"
            );
        }


        serverOnline =
            Boolean(data.online);


        updateInterface(
            serverOnline,
            data.players ?? 0,
            data.maxPlayers ?? 0
        );


    } catch (error) {

        console.error(error);

        statusElement.className =
            "status offline";

        statusElement.innerHTML =
            `<span class="status-dot"></span>
             Indisponible`;

        playersElement.textContent =
            "-- / --";

    }

}


/* =========================
   INTERFACE
========================= */

function updateInterface(
    online,
    players,
    maxPlayers
) {

    if (online) {

        statusElement.className =
            "status online";

        statusElement.innerHTML =
            `<span class="status-dot"></span>
             Serveur en ligne`;

        playersElement.textContent =
            `${players} / ${maxPlayers}`;

        powerButton.classList.remove(
            "start"
        );

        powerButton.classList.add(
            "stop"
        );

        powerIcon.textContent =
            "■";

        powerText.textContent =
            "FERMER LE SERVEUR";

    } else {

        statusElement.className =
            "status offline";

        statusElement.innerHTML =
            `<span class="status-dot"></span>
             Serveur hors ligne`;

        playersElement.textContent =
            "0 / " + (maxPlayers || "--");

        powerButton.classList.remove(
            "stop"
        );

        powerButton.classList.add(
            "start"
        );

        powerIcon.textContent =
            "▶";

        powerText.textContent =
            "DÉMARRER LE SERVEUR";
    }

}


/* =========================
   START / STOP
========================= */

async function toggleServer() {

    if (busy) {
        return;
    }

    if (serverOnline) {

        await powerAction("stop");

    } else {

        await powerAction("start");

    }

}


/* =========================
   RESTART
========================= */

async function restartServer() {

    if (busy) {
        return;
    }

    await powerAction("restart");

}


/* =========================
   POWER ACTION
========================= */

async function powerAction(action) {

    busy = true;

    setButtonsDisabled(true);

    if (action === "start") {

        showMessage(
            "⏳ Démarrage du serveur..."
        );

    } else if (action === "stop") {

        showMessage(
            "⏳ Fermeture du serveur..."
        );

    } else {

        showMessage(
            "⏳ Redémarrage du serveur..."
        );

    }


    try {

        const response =
            await fetch(API + "/power", {

                method: "POST",

                headers: {
                    "Content-Type":
                        "application/json"
                },

                body: JSON.stringify({
                    action: action
                })

            });


        const data =
            await response.json();


        if (!response.ok ||
            !data.success) {

            throw new Error(
                data.error ||
                "L'action a échoué"
            );

        }


        if (action === "start") {

            showMessage(
                "✅ Démarrage demandé !"
            );

        } else if (action === "stop") {

            showMessage(
                "✅ Fermeture demandée !"
            );

        } else {

            showMessage(
                "✅ Redémarrage demandé !"
            );

        }


        /*
         * MineStrator peut prendre
         * quelques secondes à changer
         * le statut.
         */

        setTimeout(
            getStatus,
            3000
        );

        setTimeout(
            getStatus,
            8000
        );

        setTimeout(
            getStatus,
            15000
        );


    } catch (error) {

        console.error(error);

        showMessage(
            "❌ " + error.message
        );

    } finally {

        setTimeout(() => {

            busy = false;

            setButtonsDisabled(false);

        }, 2000);

    }

}


/* =========================
   DISABLE BUTTONS
========================= */

function setButtonsDisabled(
    disabled
) {

    powerButton.disabled =
        disabled;

    restartButton.disabled =
        disabled;

}


/* =========================
   MESSAGE
========================= */

function showMessage(text) {

    messageElement.textContent =
        text;

}


/* =========================
   COPY IP
========================= */

async function copyIP() {

    try {

        await navigator.clipboard.writeText(
            SERVER_IP
        );

        const toast =
            document.getElementById("toast");

        toast.classList.add("show");

        setTimeout(() => {

            toast.classList.remove(
                "show"
            );

        }, 1800);

    } catch {

        showMessage(
            "IP : " + SERVER_IP
        );

    }

}


/* =========================
   INITIALISATION
========================= */

getStatus();


/*
 * Vérifie automatiquement
 * le serveur toutes les 15 secondes.
 */

setInterval(
    getStatus,
    15000
);
