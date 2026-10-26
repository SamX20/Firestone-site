// Applies the contact details managed in /admin to every phone, WhatsApp and social link on the page.
(function () {
  const config = window.FIRESTONE_CONFIG;
  const contact = (window.FirestoneContact = {
    phone: "+962798202604",
    whatsapp: "962798202604",
  });
  function formatPhone(phone) {
    const jordan = /^\+962(7\d)(\d{3})(\d{4})$/.exec(phone);
    return jordan ? `+962 ${jordan[1]} ${jordan[2]} ${jordan[3]}` : phone;
  }
  function handle(url) {
    try {
      const name = new URL(url).pathname.split("/").filter(Boolean)[0];
      return name ? "@" + name.replace(/^@/, "") : "";
    } catch {
      return "";
    }
  }
  function setLinks(selector, href) {
    document.querySelectorAll(selector).forEach((link) => {
      if (href) link.href = href;
      link.hidden = !href;
    });
  }
  function apply(row) {
    Object.assign(contact, row);
    document.querySelectorAll('a[href^="tel:"]').forEach((link) => {
      link.href = "tel:" + row.phone;
    });
    document.querySelectorAll('a[href^="https://wa.me/"]').forEach((link) => {
      const url = new URL(link.href);
      url.pathname = "/" + row.whatsapp;
      link.href = url.href;
    });
    document
      .querySelectorAll('[data-contact="phone-label"]')
      .forEach((el) => (el.textContent = formatPhone(row.phone)));
    setLinks('a[href*="instagram.com"]', row.instagram);
    setLinks('a[href*="facebook.com"]', row.facebook);
    setLinks('[data-contact="tiktok"]', row.tiktok);
    setLinks('[data-contact="email"]', row.email && "mailto:" + row.email);
    const instagram = handle(row.instagram);
    if (instagram)
      document
        .querySelectorAll('[data-contact="instagram-label"]')
        .forEach((el) => (el.textContent = instagram));
    document
      .querySelectorAll('[data-contact="email-label"]')
      .forEach((el) => (el.textContent = row.email));
  }
  if (!config) return;
  fetch(config.url + "/rest/v1/firestone_contact?select=*&limit=1", {
    headers: { apikey: config.key, Authorization: "Bearer " + config.key },
  })
    .then((response) => (response.ok ? response.json() : []))
    .then((rows) => {
      if (rows[0]?.phone && rows[0]?.whatsapp) apply(rows[0]);
    })
    .catch(() => {});
})();
