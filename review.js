(() => {
  const $ = (selector) => document.querySelector(selector);
  const form = $("#review-form");
  window.FirestoneCMS?.client
    ?.from("firestone_images")
    .select("image_url")
    .eq("slot", "review-cover")
    .maybeSingle()
    .then(({ data }) => {
      const url = window.FirestoneCMS.imageUrl(data?.image_url);
      if (url) $(".review-cover").src = url;
    });
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    $("#review-error").textContent = "";
    const name = $("#review-name").value.trim();
    const body = $("#review-body").value.trim();
    if (!name) {
      $("#review-error").textContent = "اكتب اسمك لو سمحت.";
      $("#review-name").focus();
      return;
    }
    if (body.length < 5) {
      $("#review-error").textContent = "اكتب رأيك بجملة أو جملتين.";
      $("#review-body").focus();
      return;
    }
    // Bots fill the hidden field; pretend success and send nothing.
    if ($("#review-website").value) {
      form.hidden = true;
      $("#review-thanks").hidden = false;
      return;
    }
    const client = window.FirestoneCMS?.client;
    $("#review-submit").disabled = true;
    try {
      if (!client) throw new Error("Content service unavailable");
      const { error } = await client.from("firestone_testimonials").insert({
        name,
        area: $("#review-area").value,
        project: $("#review-project").value,
        body,
        show_name: $("#review-show-name").checked,
      });
      if (error) throw error;
      form.hidden = true;
      $("#review-thanks").hidden = false;
      $("#review-thanks").scrollIntoView({ block: "center" });
    } catch {
      $("#review-error").textContent =
        "ما قدرنا نرسل رأيك هلّق. جرّب كمان شوي، أو ابعته على واتساب 0798202604.";
    } finally {
      $("#review-submit").disabled = false;
    }
  });
})();
