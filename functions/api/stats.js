export async function onRequest(context) {
  // context.env holds your secret environment variables
  const { CF_API_TOKEN, CF_ZONE_ID } = context.env;

  if (!CF_API_TOKEN || !CF_ZONE_ID) {
    return new Response(JSON.stringify({ error: "System Offline: Telemetry keys missing" }), { 
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }

  try {
    // Fetch the last 24 hours of analytics for your domain
    const response = await fetch(`https://api.cloudflare.com/client/v4/zones/${CF_ZONE_ID}/analytics/dashboard?since=-1440`, {
      headers: {
        "Authorization": `Bearer ${CF_API_TOKEN}`,
        "Content-Type": "application/json"
      }
    });

    const data = await response.json();

    // Extract only the safe, anonymous numbers to send to the frontend
    const stats = {
      requests: data.result.totals.requests.all,
      cached: data.result.totals.requests.cached,
      visitors: data.result.totals.uniques.all,
      bandwidth: data.result.totals.bandwidth.all // Returns bytes
    };

    return new Response(JSON.stringify(stats), {
      headers: { 
        "Content-Type": "application/json",
        "Cache-Control": "public, s-maxage=60, max-age=60"
      }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: "Telemetry link failed" }), { status: 500 });
  }
}