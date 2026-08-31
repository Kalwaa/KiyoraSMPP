const SERVER_NAME = "KiyoraSMP";

export default {
  async fetch(request, env) {

    const cors = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
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
      // VERIFICATION DE LA CLE
      // =========================

      if (!env.MINESTRATOR_API_KEY) {
        return json({
          success: false,
          error: "MINESTRATOR_API_KEY manquante dans Cloudflare."
        }, cors, 500);
      }

      // =========================
      // PROFIL MINESTRATOR
      // =========================

      const profileResponse = await fetch(
        "https://mine.sttr.io/user/profile",
        {
          method: "GET",
          headers: {
            "Authorization":
              `Bearer ${env.MINESTRATOR_API_KEY}`,
            "Accept": "application/json"
          }
        }
      );

      const profileData =
        await profileResponse.json();

      if (!profileResponse.ok) {
        return json({
          success: false,
          error: "Impossible de récupérer le profil MineStrator.",
          httpStatus: profileResponse.status,
          details: profileData
        }, cors, profileResponse.status);
      }

      const user =
        profileData?.api?.data?.user ||
        profileData?.api?.user ||
        profileData?.data?.user ||
        profileData?.user;

      const userId = user?.id;

      if (!userId) {
        return json({
          success: false,
          error: "ID utilisateur MineStrator introuvable.",
          profile: profileData
        }, cors, 500);
      }

      // =========================
      // LISTE DES SERVEURS
      // =========================

      const serversResponse = await fetch(
        `https://mine.sttr.io/user/${userId}/servers`,
        {
          method: "GET",
          headers: {
            "Authorization":
              `Bearer ${env.MINESTRATOR_API_KEY}`,
            "Accept": "application/json"
          }
        }
      );

      const serversData =
        await serversResponse.json();

      if (!serversResponse.ok) {
        return json({
          success: false,
          error: "Impossible de récupérer les serveurs MineStrator.",
          httpStatus: serversResponse.status,
          details: serversData
        }, cors, serversResponse.status);
      }

      const servers =
        serversData?.api?.data?.servers ||
        serversData?.api?.servers ||
        serversData?.data?.servers ||
        serversData?.servers ||
        [];

      // =========================
      // RECHERCHE KIYORASMP
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
          error: `Serveur "${SERVER_NAME}" introuvable.`,
          servers: servers.map(s => ({
            id: s.id,
            name: s.name
          }))
        }, cors, 404);
      }

      const serverId = server.id;

      const url = new URL(request.url);

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
            method: "GET",
            headers: {
              "Authorization":
                `Bearer ${env.MINESTRATOR_API_KEY}`,
              "Accept": "application/json"
            }
          }
        );

        const liveData =
          await liveResponse.json();

        if (!liveResponse.ok) {
          return json({
            success: false,
            error: "Impossible de récupérer le statut du serveur.",
            httpStatus: liveResponse.status,
            details: liveData
          }, cors, liveResponse.status);
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
          live?.players?.current ??
          live?.players?.online ??
          live?.players ??
          0;

        const maxPlayers =
          live?.stats?.players?.limit ??
          live?.players?.limit ??
          live?.players?.max ??
          0;

        return json({
          success: true,
          serverId: serverId,
          serverName: server.name,
          online:
            state === "online" ||
            state === "running",
          state: state,
          players: Number(players) || 0,
          maxPlayers: Number(maxPlayers) || 0
        }, cors);
      }

      // ==================================================
      // POWER
      // SEUL START EST AUTORISE
      // ==================================================

      if (
        url.pathname === "/power" &&
        request.method === "POST"
      ) {

        let body;

        try {
          body = await request.json();
        } catch {
          return json({
            success: false,
            error: "JSON invalide."
          }, cors, 400);
        }

        // ================================================
        // SECURITE :
        // ON REFUSE TOUT SAUF START
        // ================================================

        if (body?.action !== "start") {
          return json({
            success: false,
            error:
              "Action interdite. Ce Worker permet uniquement de démarrer le serveur."
          }, cors, 403);
        }

        // ================================================
        // VERIFICATION DU STATUT AVANT START
        // ================================================

        const liveResponse = await fetch(
          `https://mine.sttr.io/server/${serverId}/live`,
          {
            method: "GET",
            headers: {
              "Authorization":
                `Bearer ${env.MINESTRATOR_API_KEY}`,
              "Accept": "application/json"
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

          // Déjà allumé
          if (
            state === "online" ||
            state === "running"
          ) {
            return json({
              success: true,
              alreadyOnline: true,
              serverId: serverId,
              action: "start",
              message: "Le serveur est déjà en ligne."
            }, cors);
          }
        }

        // ================================================
        // DEMARRAGE MINESTRATOR
        // ================================================

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
          return json({
            success: false,
            error:
              "MineStrator a refusé le démarrage.",
            httpStatus:
              powerResponse.status,
            serverId:
              serverId,
            details:
              powerData
          }, cors, powerResponse.status);
        }

        return json({
          success: true,
          serverId: serverId,
          action: "start",
          message:
            "Démarrage du serveur demandé.",
          details:
            powerData
        }, cors);
      }

      // ==================================================
      // SERVEURS
      // GET /servers
      // ==================================================

      if (
        url.pathname === "/servers" &&
        request.method === "GET"
      ) {

        return json({
          success: true,
          servers: servers.map(s => ({
            id: s.id,
            name: s.name
          }))
        }, cors);
      }

      // ==================================================
      // TOUT LE RESTE
      // ==================================================

      return json({
        success: false,
        error: "Route inconnue."
      }, cors, 404);

    } catch (error) {

      return json({
        success: false,
        error:
          error?.message ||
          "Erreur inconnue du Worker."
      }, cors, 500);
    }
  }
};


// ======================================================
// JSON RESPONSE
// ======================================================

function json(data, cors, status = 200) {

  return new Response(
    JSON.stringify(data, null, 2),
    {
      status: status,
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
