// Serves the link-preview image for /review. Admins can swap it from /admin
// (firestone_images slot "review-share"); falls back to the bundled image.
const SUPABASE_URL = "https://bqhwudsezoedjbrovkqm.supabase.co";
const SUPABASE_KEY = "sb_publishable_ArFpRxVInSMiNeWuCDbg6w_nJ9-of9C";
const FALLBACK = "/assets/og-review.jpg";
const MEDIA_PREFIX = SUPABASE_URL + "/storage/v1/object/public/firestone-media/";

module.exports = async (req, res) => {
  const origin = "https://" + (req.headers.host || "firestonejo.com");
  let source = FALLBACK;
  try {
    const lookup = await fetch(
      SUPABASE_URL +
        "/rest/v1/firestone_images?select=image_url&slot=eq.review-share",
      { headers: { apikey: SUPABASE_KEY, Authorization: "Bearer " + SUPABASE_KEY } },
    );
    const [row] = lookup.ok ? await lookup.json() : [];
    const value = row?.image_url || "";
    if (value.startsWith(MEDIA_PREFIX) || /^\/assets\/[\w.-]+$/.test(value))
      source = value;
  } catch {}
  try {
    const image = await fetch(source.startsWith("/") ? origin + source : source);
    const type = image.headers.get("content-type") || "";
    if (!image.ok || !type.startsWith("image/")) throw new Error("Bad image");
    res.setHeader("Content-Type", type);
    res.setHeader(
      "Cache-Control",
      "public, max-age=300, s-maxage=300, stale-while-revalidate=86400",
    );
    res.status(200).send(Buffer.from(await image.arrayBuffer()));
  } catch {
    res.setHeader("Cache-Control", "public, max-age=60");
    res.redirect(302, FALLBACK);
  }
};
