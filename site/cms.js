(function () {
  const config = window.FIRESTONE_CONFIG;
  const client =
    config && window.supabase
      ? window.supabase.createClient(config.url, config.key, {
          auth: {
            storageKey: "firestone-admin-session",
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: false,
          },
        })
      : null;
  function imageUrl(value) {
    if (typeof value !== "string") return "";
    if (/^\/?assets\/[a-zA-Z0-9._-]+$/.test(value))
      return "/" + value.replace(/^\//, "");
    try {
      const url = new URL(value);
      if (
        config &&
        url.origin === config.url &&
        url.pathname.startsWith("/storage/v1/object/public/firestone-media/") &&
        !url.username &&
        !url.password
      )
        return url.href;
    } catch {}
    return "";
  }
  async function getContent() {
    if (!client) throw new Error("Content service unavailable");
    const responses = await Promise.all([
      client
        .from("firestone_projects")
        .select("*")
        .eq("published", true)
        .order("position")
        .order("id"),
      client
        .from("firestone_slides")
        .select("*")
        .eq("published", true)
        .order("position")
        .order("id"),
      client.from("firestone_images").select("*"),
    ]);
    responses.forEach((response) => {
      if (response.error) throw response.error;
    });
    return {
      projects: responses[0].data,
      slides: responses[1].data,
      images: responses[2].data,
    };
  }
  window.FirestoneCMS = { client, imageUrl, getContent };
})();
