const SERVER_NAME = "KiyoraSMP";

export default {
  async fetch(request, env) {

    const cors = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: cors });
    }

    try {

      // Récupère automatiquement l'ID utilisateur
      const profileResponse = await fetch(
        "https://mine.sttr.io/user/profile",
        {
          headers: {
            "Authorization": `Bearer ${env.MINESTRATOR_API_KEY}`
          }
        }
      );

      const profileData = await profileResponse.json();

      if (!profileResponse.ok) {
        return json({
          success: false,
          error: "Impossible de récupérer ton profil MineStrator",
          details: profileData
        }, cors, 401);
      }

      const user =
        profileData?.api?.data?.user ||
        profileData?.api?.user;

      const userId = user?.id;

      if (!userId) {
        return json({
          success: false,
          error: "ID utilisateur MineStrator introuvable",
          profile: profileData
        }, cors, 500);
      }

      // Récupère tous les serveurs
      const serversResponse = await fetch(
        `https://mine.sttr.io/user/${userId}/servers`,
        {
          headers: {
            "Authorization": `Bearer ${env.MINESTRATOR_API_KEY}`
          }
        }
      );

      const serversData = await serversResponse.json();

      if (!serversResponse.ok) {
        return json({
          success: false,
          error: "Impossible de récupérer les serveurs",
          details: serversData
        }, cors, 500);
      }

      const servers =
        serversData?.api?.data?.servers ||
        serversData?.api?.servers ||
        [];

      // Cherche KiyoraSMP
      const server = servers.find(
        s => String(s.name).toLowerCase() === SERVER_NAME.toLowerCase()
      );

      if (!server) {
        return json({
          success: false,
          error: `Serveur "${SERVER_NAME}" introuvable`,
          servers: servers.map(s => ({
            id: s.id,
            name: s.name
          }))
        }, cors, 404);
      }

      const serverId = server.id;

      const url = new URL(request.url);

      // STATUS
      if (url.pathname === "/status") {

        const liveResponse = await fetch(
          `https://mine.sttr.io/server/${serverId}/live`,
          {
            headers: {
              "Authorization":
                `Bearer ${env.MINESTRATOR_API_KEY}`
            }
          }
        );

        const liveData = await liveResponse.json();

        if (!liveResponse.ok) {
          throw new Error("Impossible de récupérer le statut");
        }

        const live =
          liveData?.api?.data;

        return json({
          success: true,
          serverId: serverId,
          online: live?.state === "online",
          players: live?.stats?.players?.current ?? 0,
          maxPlayers: live?.stats?.players?.limit ?? 0
        }, cors);
      }

      // POWER
      if (
        url.pathname === "/power" &&
        request.method === "POST"
      ) {

        const body = await request.json();

        const allowed = [
          "start",
          "restart",
          "stop"
        ];

        if (!allowed.includes(body.action)) {
          return json({
            success: false,
            error: "Action invalide"
          }, cors, 400);
        }

        const response = await fetch(
          `https://mine.sttr.io/server/${serverId}/poweraction`,
          {
            method: "PUT",
            headers: {
              "Authorization":
                `Bearer ${env.MINESTRATOR_API_KEY}`,
              "Content-Type":
                "application/json"
            },
            body: JSON.stringify({
              poweraction: body.action
            })
          }
        );

        const data = await response.json();

        if (!response.ok) {
          return json({
            success: false,
            error: "MineStrator a refusé l'action",
            details: data
          }, cors, response.status);
        }

        return json({
          success: true,
          serverId: serverId,
          action: body.action
        }, cors);
      }

      // DEBUG : affiche les serveurs trouvés
      if (url.pathname === "/servers") {
        return json({
          success: true,
          servers: servers.map(s => ({
            id: s.id,
            name: s.name
          }))
        }, cors);
      }

      return json({
        success: false,
        error: "Route inconnue"
      }, cors, 404);

    } catch (error) {

      return json({
        success: false,
        error: error.message
      }, cors, 500);
    }
  }
};


function json(data, cors, status = 200) {

  return new Response(
    JSON.stringify(data, null, 2),
    {
      status,
      headers: {
        ...cors,
        "Content-Type": "application/json"
      }
    }
  );
}
