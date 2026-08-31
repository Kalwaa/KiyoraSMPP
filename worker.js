const SERVER_NAME = "KiyoraSMP";

export default {
  async fetch(request, env) {

    const cors = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Cache-Control": "no-store"
    };

    // =========================
    // CORS
    // =========================

    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: cors
      });
    }

    try {

      // =========================
      // CLE API
      // =========================

      if (!env.MINESTRATOR_API_KEY) {
        return json({
          success: false,
          error: "Configuration serveur manquante."
        }, cors, 500);
      }

      // =========================
      // PROFIL MINESTRATOR
      // =========================

      const profileResponse = await fetch(
        "https://mine.sttr.io/user/profile",
        {
          headers: {
            "Authorization":
              `Bearer ${env.MINESTRATOR_API_KEY}`,
            "Accept":
              "application/json"
          }
        }
      );

      const profileData =
        await profileResponse.json();

      if (!profileResponse.ok) {
        return json({
          success: false,
          error: "Impossible de contacter MineStrator."
        }, cors, 502);
      }

      // =========================
      // RECUPERATION ID UTILISATEUR
      // =========================

      const user =
        profileData?.api?.data?.user ||
        profileData?.api?.user ||
        profileData?.data?.user ||
        profileData?.user;

      const userId =
        user?.id ||
        user?.datas?.id;

      if (!userId) {
        return json({
          success: false,
          error: "Configuration du serveur introuvable."
        }, cors, 500);
      }

      // =========================
      // SERVEURS DU COMPTE
      // =========================

      const serversResponse = await fetch(
        `https://mine.sttr.io/user/${userId}/servers`,
        {
          headers: {
            "Authorization":
              `Bearer ${env.MINESTRATOR_API_KEY}`,
            "Accept":
              "application/json"
          }
        }
      );

      const serversData =
        await serversResponse.json();

      if (!serversResponse.ok) {
        return json({
          success: false,
          error: "Impossible de récupérer le serveur."
        }, cors, 502);
      }

      const servers =
        serversData?.api?.data?.servers ||
        serversData?.api?.servers ||
        serversData?.data?.servers ||
        serversData?.servers ||
        [];

      // =========================
      // KIYORASMP
      // =========================

      const server = servers.find(
        s =>
          String(s.name || "")
            .trim()
            .toLowerCase() ===
          SERVER_NAME.toLowerCase()
      );

      if (!server) {
        return json({
          success: false,
          error: "Serveur KiyoraSMP introuvable."
        }, cors, 404);
      }

      const serverId = server.id;

      const url =
        new URL(request.url);

      // ==================================================
      // STATUS
      // GET /
      // GET /status
      // ==================================================

      if (
        request.method === "GET" &&
        (
          url.pathname === "/" ||
          url.pathname === "/status"
        )
      ) {

        const liveResponse = await fetch(
          `https://mine.sttr.io/server/${serverId}/live`,
          {
            headers: {
              "Authorization":
                `Bearer ${env.MINESTRATOR_API_KEY}`,
              "Accept":
                "application/json"
            }
          }
        );

        const liveData =
          await liveResponse.json();

        if (!liveResponse.ok) {
          return json({
            success: false,
            error: "Impossible de récupérer le statut."
          }, cors, 502);
        }

        const live =
          liveData?.api?.data ||
          liveData?.api ||
          liveData?.data ||
          liveData;

        const state =
          String(
            live?.state ||
            live?.status ||
            ""
          ).toLowerCase();

        const players =
          live?.stats?.players?.current ??
          0;

        const maxPlayers =
          live?.stats?.players?.limit ??
          0;

        // =========================
        // SEULEMENT INFOS SERVEUR
        // =========================

        return json({
          success: true,
          server: "KiyoraSMP",
          online:
            state === "online" ||
            state === "running",
          players:
            Number(players) || 0,
          maxPlayers:
            Number(maxPlayers) || 0
        }, cors);
      }

      // ==================================================
      // POWER
      // SEULEMENT START
      // ==================================================

      if (
        url.pathname === "/power" &&
        request.method === "POST"
      ) {

        let body;

        try {
          body =
            await request.json();
        } catch {
          return json({
            success: false,
            error: "Requête invalide."
          }, cors, 400);
        }

        // =========================
        // INTERDIT SAUF START
        // =========================

        if (body?.action !== "start") {
          return json({
            success: false,
            error:
              "Action interdite."
          }, cors, 403);
        }

        // =========================
        // VERIFICATION STATUT
        // =========================

        const liveResponse = await fetch(
          `https://mine.sttr.io/server/${serverId}/live`,
          {
            headers: {
              "Authorization":
                `Bearer ${env.MINESTRATOR_API_KEY}`,
              "Accept":
                "application/json"
            }
          }
        );

        const liveData =
          await liveResponse.json();

        if (liveResponse.ok) {

          const live =
            liveData?.api?.data ||
            liveData?.api ||
            liveData?.data ||
            liveData;

          const state =
            String(
              live?.state ||
              live?.status ||
              ""
            ).toLowerCase();

          if (
            state === "online" ||
            state === "running"
          ) {

            return json({
              success: true,
              server: "KiyoraSMP",
              online: true,
              message:
                "Le serveur est déjà ouvert."
            }, cors);
          }
        }

        // =========================
        // DEMARRAGE
        // =========================

        const powerResponse = await fetch(
          `https://mine.sttr.io/server/${serverId}/poweraction`,
          {
            method: "PUT",

            headers: {
              "Authorization":
                `Bearer ${env.MINESTRATOR_API_KEY}`,
              "Content-Type":
                "application/json",
              "Accept":
                "application/json"
            },

            body: JSON.stringify({
              poweraction: "start"
            })
          }
        );

        const powerData =
          await powerResponse.json();

        if (!powerResponse.ok) {

          // NE RENVOIE PAS LA REPONSE
          // BRUTE DE MINESTRATOR

          return json({
            success: false,
            error:
              "Impossible de démarrer KiyoraSMP."
          }, cors, powerResponse.status);
        }

        // =========================
        // REPONSE PUBLIQUE
        // =========================

        return json({
          success: true,
          server: "KiyoraSMP",
          action: "start",
          message:
            "Démarrage de KiyoraSMP demandé."
        }, cors);
      }

      // ==================================================
      // TOUT LE RESTE EST BLOQUE
      // ==================================================

      return json({
        success: false,
        error: "Route inconnue."
      }, cors, 404);

    } catch (error) {

      // =========================
      // AUCUNE DONNEE INTERNE
      // =========================

      return json({
        success: false,
        error:
          "Erreur interne du serveur."
      }, cors, 500);
    }
  }
};


// ======================================================
// REPONSE JSON
// ======================================================

function json(
  data,
  cors,
  status = 200
) {

  return new Response(
    JSON.stringify(data),
    {
      status,
      headers: {
        ...cors,
        "Content-Type":
          "application/json; charset=utf-8",
        "Cache-Control":
          "no-store"
      }
    }
  );
}
