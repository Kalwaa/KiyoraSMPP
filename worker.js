const SERVER_NAME = "KiyoraSMP";
const API = "https://mine.sttr.io";

export default {
  async fetch(request, env) {

    const cors = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    };

    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: cors
      });
    }

    try {

      if (!env.MINESTRATOR_API_KEY) {
        return json({
          success: false,
          error: "MINESTRATOR_API_KEY manquante dans Cloudflare."
        }, cors, 500);
      }

      const headers = {
        "Authorization": `Bearer ${env.MINESTRATOR_API_KEY}`
      };

      /* =========================
         PROFIL MINESTRATOR
      ========================= */

      const profileResponse = await fetch(
        `${API}/user/profile`,
        { headers }
      );

      const profileData = await profileResponse.json();

      if (!profileResponse.ok) {
        return json({
          success: false,
          error: "Impossible de récupérer le profil MineStrator.",
          details: profileData
        }, cors, profileResponse.status);
      }

      const user =
        profileData?.api?.data?.user ||
        profileData?.api?.user ||
        profileData?.user;

      const userId =
        user?.id ||
        user?.datas?.id;

      if (!userId) {
        return json({
          success: false,
          error: "ID utilisateur MineStrator introuvable.",
          details: profileData
        }, cors, 500);
      }

      /* =========================
         SERVEURS
      ========================= */

      const serversResponse = await fetch(
        `${API}/user/${userId}/servers`,
        { headers }
      );

      const serversData = await serversResponse.json();

      if (!serversResponse.ok) {
        return json({
          success: false,
          error: "Impossible de récupérer les serveurs MineStrator.",
          details: serversData
        }, cors, serversResponse.status);
      }

      const servers =
        serversData?.api?.data?.servers ||
        serversData?.api?.servers ||
        serversData?.servers ||
        [];

      const server = servers.find(s => {
        const name = String(s?.name || "")
          .trim()
          .toLowerCase();

        const dns = String(s?.dns || "")
          .trim()
          .toLowerCase();

        return (
          name === SERVER_NAME.toLowerCase() ||
          dns === "kiyorasmp.minecraft.how"
        );
      });

      if (!server) {
        return json({
          success: false,
          error: `Serveur "${SERVER_NAME}" introuvable.`,
          servers: servers.map(s => ({
            id: s?.id,
            name: s?.name,
            dns: s?.dns
          }))
        }, cors, 404);
      }

      const serverId = server.id;
      const url = new URL(request.url);

      /* =========================
         STATUS
      ========================= */

      if (
        request.method === "GET" &&
        (url.pathname === "/" ||
         url.pathname === "/status")
      ) {

        const liveResponse = await fetch(
          `${API}/server/${serverId}/live`,
          {
            method: "GET",
            headers
          }
        );

        const liveData = await liveResponse.json();

        if (!liveResponse.ok) {
          return json({
            success: false,
            error: "Impossible de récupérer le statut du serveur.",
            details: liveData
          }, cors, liveResponse.status);
        }

        const live =
          liveData?.api?.data ||
          liveData?.api ||
          liveData?.data ||
          {};

        return json({
          success: true,
          serverId,
          online: live?.state === "online",
          players:
            live?.stats?.players?.current ??
            live?.players?.current ??
            0,
          maxPlayers:
            live?.stats?.players?.limit ??
            live?.players?.limit ??
            20
        }, cors);
      }

      /* =========================
         POWER
      ========================= */

      if (
        url.pathname === "/power" &&
        request.method === "POST"
      ) {

        const body = await request.json();

        const allowed = [
          "start",
          "stop",
          "restart"
        ];

        if (!body || !allowed.includes(body.action)) {
          return json({
            success: false,
            error: "Action invalide."
          }, cors, 400);
        }

        const powerResponse = await fetch(
          `${API}/server/${serverId}/poweraction`,
          {
            method: "PUT",
            headers: {
              ...headers,
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              poweraction: body.action
            })
          }
        );

        const powerData =
          await powerResponse.json();

        if (!powerResponse.ok) {
          return json({
            success: false,
            error: "MineStrator a refusé l'action.",
            details: powerData
          }, cors, powerResponse.status);
        }

        return json({
          success: true,
          serverId,
          action: body.action
        }, cors);
      }

      /* =========================
         SERVERS DEBUG
      ========================= */

      if (
        url.pathname === "/servers" &&
        request.method === "GET"
      ) {

        return json({
          success: true,
          servers: servers.map(s => ({
            id: s?.id,
            name: s?.name,
            dns: s?.dns,
            ip: s?.ip
          }))
        }, cors);
      }

      return json({
        success: false,
        error: "Route inconnue."
      }, cors, 404);

    } catch (error) {

      return json({
        success: false,
        error: error?.message || "Erreur inconnue."
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
