(() => {
  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => [...document.querySelectorAll(selector)];
  const { client, imageUrl } = window.FirestoneCMS;
  const tables = {
    projects: "firestone_projects",
    slides: "firestone_slides",
    images: "firestone_images",
    testimonials: "firestone_testimonials",
    contact: "firestone_contact",
  };
  const titles = {
    projects: "المشاريع",
    slides: "صور الهيرو",
    images: "صور الأقسام والشعار",
    testimonials: "آراء الزبائن",
    contact: "معلومات التواصل",
  };
  const slots = {
    logo: "شعار الموقع",
    banner: "الصورة العريضة",
    "service-0": "فاير بليس وديكورات شاشة",
    "service-1": "كلادنغ وبديل رخام",
    "service-2": "الديكورات الداخلية",
    "service-3": "الجلسات الخارجية",
    "review-cover": "خلفية صفحة التقييم",
  };
  let tab = "projects",
    rows = [],
    current = null,
    photos = [],
    mobile = "",
    dirty = false,
    busy = false,
    pendingDelete = null,
    loadVersion = 0;
  const icons = () =>
    window.lucide?.createIcons({ attrs: { "aria-hidden": "true" } });
  function node(tag, text, className) {
    const el = document.createElement(tag);
    if (text !== undefined) el.textContent = text;
    if (className) el.className = className;
    return el;
  }
  function icon(name) {
    const el = node("i");
    el.dataset.lucide = name;
    return el;
  }
  function action(name, label, handler, extra = "") {
    const button = node("button", undefined, "icon-btn " + extra);
    button.type = "button";
    button.title = label;
    button.setAttribute("aria-label", label);
    button.append(icon(name));
    button.addEventListener("click", handler);
    return button;
  }
  function toast(message) {
    $("#toast").textContent = message;
    $("#toast").hidden = false;
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => ($("#toast").hidden = true), 4500);
  }
  function errorMessage(error) {
    if (error?.code === "42501" || error?.status === 403)
      return "لا تملك صلاحية هذا الإجراء. سجّل الدخول بحساب الإدارة.";
    if (error?.message === "CONFLICT")
      return "تغيّر هذا المحتوى في جلسة أخرى. أغلق النافذة وحدّث القائمة قبل المحاولة مجدداً.";
    return "تعذّر إكمال العملية. تحقق من الاتصال وحاول مجدداً.";
  }
  function setBusy(value) {
    busy = value;
    $("#editor").classList.toggle("is-busy", value);
    $$(
      "#editor button, #editor input, #editor select, #editor textarea",
    ).forEach((el) => (el.disabled = value));
    $("#save-state").textContent = value ? "جاري الحفظ..." : "";
  }
  function showLogin() {
    ++loadVersion;
    dirty = false;
    pendingDelete = null;
    $("#admin-shell").hidden = true;
    $("#auth-screen").hidden = false;
    rows = [];
    $("#content-list").replaceChildren();
    $$("dialog[open]").forEach((d) => d.close());
    document.body.classList.remove("dialog-open");
  }
  async function authorized() {
    const { data, error } = await client.auth.getUser();
    if (error || !data.user) return false;
    const result = await client
      .from("firestone_admins")
      .select("user_id")
      .eq("user_id", data.user.id)
      .maybeSingle();
    if (result.error) throw result.error;
    if (!result.data) return false;
    $("#account-email").textContent = data.user.email;
    return true;
  }
  async function enter() {
    if (!(await authorized())) {
      showLogin();
      return false;
    }
    $("#auth-screen").hidden = true;
    $("#admin-shell").hidden = false;
    await load();
    return true;
  }
  async function load() {
    const version = ++loadVersion;
    $("#page-error").textContent = "";
    $("#loading").hidden = false;
    $("#content-list").replaceChildren();
    $("#empty-state").hidden = true;
    try {
      let query = client.from(tables[tab]).select("*");
      query =
        tab === "images"
          ? query.order("slot")
          : tab === "testimonials"
            ? query.order("created_at", { ascending: false })
            : tab === "contact"
              ? query.limit(1)
              : query.order("position").order("id");
      const result = await query;
      if (result.error) throw result.error;
      if (version !== loadVersion) return;
      rows = result.data;
      render();
    } catch (error) {
      if (version === loadVersion)
        $("#page-error").textContent = errorMessage(error);
    } finally {
      if (version === loadVersion) $("#loading").hidden = true;
    }
  }
  function preview(url) {
    const img = node("img");
    img.src = imageUrl(url);
    img.alt = "";
    img.loading = "lazy";
    return img;
  }
  function render() {
    const search = $("#search").value.trim().toLowerCase(),
      status = $("#status-filter").value;
    const filtered = rows.filter(
      (row) =>
        [
          row.title_ar,
          row.title_en,
          row.alt_ar,
          row.alt_en,
          slots[row.slot],
          row.name,
          row.area,
          row.body,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(search) &&
        (tab === "images" ||
          status === "all" ||
          row.published === (status === "published")),
    );
    $("#empty-state").hidden = filtered.length > 0;
    $("#content-list").replaceChildren();
    if (tab === "projects") $("#projects-count").textContent = rows.length;
    if (tab === "contact") {
      $("#empty-state").hidden = true;
      renderContact(rows[0]);
      return;
    }
    if (tab === "images") {
      const list = node("div", undefined, "slot-list");
      filtered.forEach((row) => {
        const item = node("article", undefined, "slot-item");
        const info = node("div");
        info.append(node("h3", slots[row.slot]));
        if (row.slot === "review-cover")
          info.append(
            node(
              "p",
              "الصورة اللي بتظهر خلف نموذج التقييم بصفحة firestonejo.com/review. الأفضل صورة عريضة.",
              "item-subtitle",
            ),
          );
        if (row.slot === "banner")
          info.append(
            node(
              "p",
              row.mobile_url
                ? "صورة للكمبيوتر وصورة للموبايل"
                : "صورة واحدة للكمبيوتر والموبايل",
              "item-subtitle",
            ),
          );
        const edit = node("button", "تغيير الصورة", "btn secondary");
        edit.addEventListener("click", () => openEditor(row));
        info.append(edit);
        item.append(preview(row.image_url), info);
        list.append(item);
      });
      $("#content-list").append(list);
      icons();
      return;
    }
    if (tab === "testimonials") {
      renderTestimonials(filtered);
      return;
    }
    const table = node("table", undefined, "list-table");
    const head = node("thead");
    const tr = node("tr");
    ["المحتوى", "الحالة", "الترتيب", "الإجراءات"].forEach((label) => {
      const th = node("th", label);
      th.scope = "col";
      tr.append(th);
    });
    head.append(tr);
    table.append(head);
    const body = node("tbody");
    filtered.forEach((row) => {
      const tr = node("tr");
      const identity = node("div", undefined, "item-identity");
      const info = node("div");
      info.append(
        node("p", row.title_ar || row.alt_ar || "صورة هيرو", "item-title"),
        node(
          "p",
          tab === "projects"
            ? row.category === "interior"
              ? "ديكورات داخلية"
              : "مساحات خارجية"
            : row.mobile_url
              ? "صورة كمبيوتر وموبايل"
              : "صورة مشتركة",
          "item-subtitle",
        ),
      );
      identity.append(
        preview(tab === "projects" ? row.images?.[0]?.url : row.image_url),
        info,
      );
      const main = node("td");
      main.append(identity);
      const state = node("td");
      state.append(
        node(
          "span",
          row.published ? "منشور" : "مسودة",
          "badge " + (row.published ? "" : "draft"),
        ),
      );
      const order = node("td", String(row.position));
      const actions = node("td");
      const wrap = node("div", undefined, "row-actions");
      wrap.append(
        action("pencil", "تعديل", () => openEditor(row)),
        action("trash-2", "حذف", () => confirmDelete(row), "delete"),
      );
      actions.append(wrap);
      tr.append(main, state, order, actions);
      body.append(tr);
    });
    table.append(body);
    $("#content-list").append(table);
    icons();
  }
  const contactFields = [
    ["phone", "رقم الهاتف (للاتصال)", "+962798202604", "tel"],
    ["whatsapp", "رقم الواتساب", "962798202604", "tel"],
    ["instagram", "رابط إنستجرام", "https://www.instagram.com/_firestonejo/", "url"],
    ["facebook", "رابط فيسبوك", "https://facebook.com/...", "url"],
    ["tiktok", "رابط تيك توك (اختياري)", "https://www.tiktok.com/@...", "url"],
    ["email", "البريد الإلكتروني (اختياري)", "info@firestonejo.com", "email"],
  ];
  function renderContact(row) {
    if (!row) return;
    const form = node("form", undefined, "contact-form");
    form.noValidate = true;
    contactFields.forEach(([key, label, placeholder, type]) => {
      const id = "contact-" + key;
      const field = node("label", label);
      field.htmlFor = id;
      const input = node("input");
      input.id = id;
      input.type = type;
      input.dir = "ltr";
      input.placeholder = placeholder;
      input.value = row[key] || "";
      form.append(field, input);
    });
    form.append(
      node(
        "p",
        "رقم الهاتف والواتساب بالصيغة الدولية مثل 962798202604. اترك الحقل الاختياري فارغاً لإخفائه من الموقع.",
        "item-subtitle",
      ),
    );
    const error = node("p", undefined, "error");
    error.setAttribute("role", "alert");
    const submit = node("button", undefined, "btn primary");
    submit.type = "submit";
    submit.append(icon("save"), "حفظ التغييرات");
    form.append(error, submit);
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const value = (key) => form.querySelector("#contact-" + key).value.trim();
      const digits = (key) => value(key).replace(/[^\d]/g, "").replace(/^00/, "");
      const payload = {
        phone: "+" + digits("phone"),
        whatsapp: digits("whatsapp"),
        instagram: value("instagram"),
        facebook: value("facebook"),
        tiktok: value("tiktok"),
        email: value("email"),
      };
      const checks = [
        [/^\+\d{8,15}$/.test(payload.phone), "رقم الهاتف غير صحيح."],
        [/^\d{8,15}$/.test(payload.whatsapp), "رقم الواتساب غير صحيح."],
        [!payload.instagram || /^https:\/\/(www\.)?instagram\.com\//.test(payload.instagram), "رابط إنستجرام يجب أن يبدأ بـ https://www.instagram.com/"],
        [!payload.facebook || /^https:\/\/(www\.|m\.)?facebook\.com\//.test(payload.facebook), "رابط فيسبوك يجب أن يبدأ بـ https://facebook.com/"],
        [!payload.tiktok || /^https:\/\/(www\.)?tiktok\.com\//.test(payload.tiktok), "رابط تيك توك يجب أن يبدأ بـ https://www.tiktok.com/"],
        [!payload.email || /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(payload.email), "البريد الإلكتروني غير صحيح."],
      ];
      const failed = checks.find(([ok]) => !ok);
      error.textContent = failed ? failed[1] : "";
      if (failed) return;
      submit.disabled = true;
      try {
        const result = await client
          .from(tables.contact)
          .update(payload)
          .eq("id", true)
          .eq("updated_at", row.updated_at)
          .select();
        if (result.error) throw result.error;
        if (result.data.length !== 1) throw new Error("CONFLICT");
        toast("تم حفظ معلومات التواصل. ستظهر على الموقع فوراً.");
        await load();
      } catch (err) {
        error.textContent = errorMessage(err);
      } finally {
        submit.disabled = false;
      }
    });
    $("#content-list").append(form);
    icons();
  }
  function renderTestimonials(filtered) {
    const link = location.origin + "/review";
    const share = node("div", undefined, "share-link");
    share.append(
      node("p", "أرسل هذا الرابط للزبون ليكتب رأيه:"),
      node("code", link),
    );
    const copyButton = node("button", "نسخ الرابط", "btn secondary");
    copyButton.type = "button";
    copyButton.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(link);
        toast("تم نسخ الرابط.");
      } catch {
        toast(link);
      }
    });
    share.append(copyButton);
    const list = node("div", undefined, "testimonial-list");
    filtered.forEach((row) => {
      const item = node("article", undefined, "testimonial-item");
      const meta = [
        row.show_name ? row.name : row.name + " (بدون نشر الاسم)",
        row.area,
        row.project,
        new Date(row.created_at).toLocaleDateString("ar-JO"),
      ].filter(Boolean);
      const info = node("div");
      info.append(
        node("p", row.body, "testimonial-body"),
        node("p", meta.join(" · "), "item-subtitle"),
      );
      const side = node("div", undefined, "row-actions");
      side.append(
        node(
          "span",
          row.published ? "منشور" : "بانتظار المراجعة",
          "badge " + (row.published ? "" : "draft"),
        ),
        action(
          row.published ? "eye-off" : "eye",
          row.published ? "إخفاء من الموقع" : "نشر على الموقع",
          () => togglePublished(row),
        ),
        action("trash-2", "حذف", () => confirmDelete(row), "delete"),
      );
      item.append(info, side);
      list.append(item);
    });
    $("#content-list").append(share, list);
    icons();
  }
  async function togglePublished(row) {
    try {
      const result = await client
        .from(tables.testimonials)
        .update({ published: !row.published })
        .eq("id", row.id)
        .eq("updated_at", row.updated_at)
        .select("id");
      if (result.error) throw result.error;
      if (result.data.length !== 1) throw new Error("CONFLICT");
      toast(row.published ? "تم إخفاء الرأي." : "تم نشر الرأي على الموقع.");
      await load();
    } catch (error) {
      $("#page-error").textContent = errorMessage(error);
    }
  }
  function showDialog(dialog) {
    dialog.showModal();
    document.body.classList.add("dialog-open");
  }
  function closeEditor() {
    if (busy) return;
    if (
      dirty &&
      !window.confirm("لديك تغييرات غير محفوظة. هل تريد إغلاق النافذة؟")
    )
      return;
    $("#editor").close();
    dirty = false;
  }
  function openEditor(row = null) {
    current = row ? structuredClone(row) : null;
    dirty = false;
    $("#editor-form").reset();
    $("#editor-error").textContent = "";
    $("#upload-progress").textContent = "";
    $("#save-state").textContent = "";
    $("#project-fields").hidden = tab !== "projects";
    $("#slide-fields").hidden = tab !== "slides";
    $("#publishing-fields").hidden = tab === "images";
    $("#mobile-photo-field").hidden = !(
      tab === "slides" ||
      (tab === "images" && row?.slot === "banner")
    );
    $$("#project-fields input").forEach(
      (input) => (input.required = tab === "projects"),
    );
    $("#position").required = tab !== "images";
    $("#upload").multiple = tab === "projects";
    $("#editor-title").textContent =
      tab === "images"
        ? slots[row.slot]
        : (row ? "تعديل " : "إضافة ") +
          (tab === "projects" ? "مشروع" : "صورة هيرو");
    $("#photos-title").textContent =
      tab === "projects"
        ? "صور المشروع"
        : tab === "slides" || row?.slot === "banner"
          ? "صورة الكمبيوتر (عريضة)"
          : "الصورة الرئيسية";
    $("#title-ar").value = row?.title_ar || "";
    $("#title-en").value = row?.title_en || "";
    $("#description-ar").value = row?.description_ar || "";
    $("#description-en").value = row?.description_en || "";
    $("#category").value = row?.category || "interior";
    $("#alt-ar").value = row?.alt_ar || "";
    $("#alt-en").value = row?.alt_en || "";
    $("#position").value =
      row?.position ??
      rows.reduce((max, r) => Math.max(max, r.position || 0), 0) + 10;
    $("#published").checked = row?.published || false;
    photos =
      tab === "projects"
        ? structuredClone(row?.images || [])
        : row?.image_url
          ? [{ url: row.image_url }]
          : [];
    mobile = row?.mobile_url || "";
    renderPhotos();
    showDialog($("#editor"));
  }
  function renderPhotos() {
    $("#editor-images").replaceChildren();
    photos.forEach((photo, index) => {
      const item = node(
        "div",
        undefined,
        "photo-item " + (index === 0 ? "cover" : ""),
      );
      item.append(preview(photo.url));
      const controls = node("div", undefined, "photo-actions");
      controls.append(
        node(
          "span",
          index === 0
            ? tab === "projects"
              ? "الغلاف"
              : "الصورة"
            : String(index + 1),
        ),
      );
      if (index > 0)
        controls.append(
          action("arrow-right", "تقديم الصورة", () => {
            [photos[index - 1], photos[index]] = [
              photos[index],
              photos[index - 1],
            ];
            dirty = true;
            renderPhotos();
          }),
        );
      if (index < photos.length - 1)
        controls.append(
          action("arrow-left", "تأخير الصورة", () => {
            [photos[index + 1], photos[index]] = [
              photos[index],
              photos[index + 1],
            ];
            dirty = true;
            renderPhotos();
          }),
        );
      controls.append(
        action("trash-2", "إزالة من المشروع", () => {
          photos.splice(index, 1);
          dirty = true;
          renderPhotos();
        }),
      );
      item.append(controls);
      $("#editor-images").append(item);
    });
    $("#mobile-image").replaceChildren();
    if (mobile) {
      const item = node("div", undefined, "photo-item");
      const controls = node("div", undefined, "photo-actions");
      controls.append(
        action("trash-2", "إزالة صورة الموبايل", () => {
          mobile = "";
          dirty = true;
          renderPhotos();
        }),
      );
      item.append(preview(mobile), controls);
      $("#mobile-image").append(item);
    }
    icons();
  }
  async function uploadFiles(input, isMobile = false) {
    const files = [...input.files];
    if (!files.length) return;
    $("#editor-error").textContent = "";
    if (
      (tab === "projects" ? photos.length + files.length : files.length) >
      (tab === "projects" ? 20 : 1)
    ) {
      input.value = "";
      $("#editor-error").textContent =
        tab === "projects"
          ? "الحد الأقصى 20 صورة للمشروع."
          : "اختر صورة واحدة.";
      return;
    }
    if (
      files.some(
        (file) =>
          !["image/jpeg", "image/png", "image/webp"].includes(file.type) ||
          file.size > 12 * 1024 * 1024,
      )
    ) {
      input.value = "";
      $("#editor-error").textContent =
        "الصور المقبولة JPG وPNG وWebP، بحد أقصى 12 ميجابايت للصورة.";
      return;
    }
    setBusy(true);
    let done = 0;
    try {
      for (const file of files) {
        $("#upload-progress").textContent =
          `جاري رفع الصورة ${++done} من ${files.length}...`;
        const image = new Image();
        const objectUrl = URL.createObjectURL(file);
        try {
          image.src = objectUrl;
          await image.decode();
          if (image.naturalWidth > 16000 || image.naturalHeight > 16000)
            throw new Error("Dimensions");
        } finally {
          URL.revokeObjectURL(objectUrl);
        }
        const extension = {
          "image/jpeg": "jpg",
          "image/png": "png",
          "image/webp": "webp",
        }[file.type];
        const path = `uploads/${crypto.randomUUID()}.${extension}`;
        const result = await client.storage
          .from("firestone-media")
          .upload(path, file, {
            contentType: file.type,
            cacheControl: "31536000",
            upsert: false,
          });
        if (result.error) throw result.error;
        const url = client.storage.from("firestone-media").getPublicUrl(path)
          .data.publicUrl;
        if (isMobile) mobile = url;
        else if (tab === "projects") photos.push({ url });
        else photos = [{ url }];
        dirty = true;
        renderPhotos();
      }
      $("#upload-progress").textContent = "تم الرفع. احفظ التغييرات لتطبيقها.";
    } catch (error) {
      $("#editor-error").textContent = errorMessage(error);
      $("#upload-progress").textContent = "";
    } finally {
      setBusy(false);
      input.value = "";
    }
  }
  async function save(event) {
    event.preventDefault();
    if (busy) return;
    $("#editor-error").textContent = "";
    if (
      !photos.length ||
      photos.some((photo) => !imageUrl(photo.url)) ||
      (mobile && !imageUrl(mobile))
    ) {
      $("#editor-error").textContent = "أضف صورة صالحة قبل الحفظ.";
      return;
    }
    let payload;
    if (tab === "projects") {
      payload = {
        title_ar: $("#title-ar").value.trim(),
        title_en: $("#title-en").value.trim(),
        description_ar: $("#description-ar").value.trim(),
        description_en: $("#description-en").value.trim(),
        category: $("#category").value,
        images: photos,
      };
      if (!payload.title_ar || !payload.title_en) {
        $("#editor-error").textContent = "أدخل اسم المشروع باللغتين.";
        return;
      }
    } else if (tab === "slides")
      payload = {
        image_url: photos[0].url,
        mobile_url: mobile,
        alt_ar: $("#alt-ar").value.trim(),
        alt_en: $("#alt-en").value.trim(),
      };
    else {
      payload = { image_url: photos[0].url };
      if (current?.slot === "banner") payload.mobile_url = mobile;
    }
    if (tab !== "images") {
      payload.published = $("#published").checked;
      payload.position = Number($("#position").value);
    }
    setBusy(true);
    try {
      let query = current
        ? client
            .from(tables[tab])
            .update(payload)
            .eq(
              tab === "images" ? "slot" : "id",
              tab === "images" ? current.slot : current.id,
            )
            .eq("updated_at", current.updated_at)
        : client.from(tables[tab]).insert(payload);
      const result = await query.select();
      if (result.error) throw result.error;
      if (result.data.length !== 1) throw new Error("CONFLICT");
      dirty = false;
      $("#editor").close();
      toast(
        payload.published === false ? "تم حفظ المسودة." : "تم حفظ التغييرات.",
      );
      await load();
    } catch (error) {
      $("#editor-error").textContent = errorMessage(error);
    } finally {
      setBusy(false);
    }
  }
  function confirmDelete(row) {
    pendingDelete = { row, table: tables[tab] };
    $("#delete-error").textContent = "";
    $("#confirm-message").textContent =
      `حذف «${row.title_ar || row.alt_ar || row.name || "صورة الهيرو"}»؟ سيُزال من الموقع ولا يمكن التراجع عن الحذف.`;
    showDialog($("#confirm-dialog"));
  }
  $("#confirm-delete").addEventListener("click", async () => {
    if (!pendingDelete) return;
    $("#confirm-delete").disabled = true;
    $("#cancel-delete").disabled = true;
    try {
      const { row, table } = pendingDelete;
      const result = await client
        .from(table)
        .delete()
        .eq("id", row.id)
        .eq("updated_at", row.updated_at)
        .select("id");
      if (result.error) throw result.error;
      if (result.data.length !== 1) throw new Error("CONFLICT");
      $("#confirm-dialog").close();
      pendingDelete = null;
      toast("تم الحذف.");
      await load();
    } catch (error) {
      $("#delete-error").textContent = errorMessage(error);
    } finally {
      $("#confirm-delete").disabled = false;
      $("#cancel-delete").disabled = false;
    }
  });
  $("#cancel-delete").addEventListener("click", () =>
    $("#confirm-dialog").close(),
  );
  $$(".nav-item").forEach((button) =>
    button.addEventListener("click", () => {
      tab = button.dataset.tab;
      $$(".nav-item").forEach((el) =>
        el.classList.toggle("active", el === button),
      );
      $("#view-title").textContent = titles[tab];
      $("#add-item").hidden = ["images", "testimonials", "contact"].includes(tab);
      $("#status-filter").hidden = tab === "images" || tab === "contact";
      $(".toolbar").hidden = tab === "contact";
      $("#add-item span").textContent =
        tab === "projects" ? "إضافة مشروع" : "إضافة صورة";
      $("#search").placeholder =
        tab === "projects" ? "ابحث عن مشروع..." : "ابحث...";
      $("#search").value = "";
      $("#status-filter").value = "all";
      load();
    }),
  );
  $("#search").addEventListener("input", render);
  $("#status-filter").addEventListener("change", render);
  $("#refresh").addEventListener("click", load);
  $("#add-item").addEventListener("click", () => openEditor());
  $("#editor-form").addEventListener("submit", save);
  $("#editor-form").addEventListener("input", () => (dirty = true));
  $("#close-editor").addEventListener("click", closeEditor);
  $("#cancel-editor").addEventListener("click", closeEditor);
  $("#editor").addEventListener("cancel", (event) => {
    event.preventDefault();
    closeEditor();
  });
  $("#upload").addEventListener("change", (event) => uploadFiles(event.target));
  $("#mobile-upload").addEventListener("change", (event) =>
    uploadFiles(event.target, true),
  );
  $$("dialog").forEach((dialog) =>
    dialog.addEventListener("close", () => {
      if (!document.querySelector("dialog[open]"))
        document.body.classList.remove("dialog-open");
    }),
  );
  window.addEventListener("beforeunload", (event) => {
    if (dirty || busy) {
      event.preventDefault();
      event.returnValue = "";
    }
  });
  $("#password-toggle").addEventListener("click", () => {
    const hidden = $("#password").type === "password";
    $("#password").type = hidden ? "text" : "password";
    $("#password-toggle").title = hidden
      ? "إخفاء كلمة المرور"
      : "إظهار كلمة المرور";
    $("#password-toggle").setAttribute(
      "aria-label",
      $("#password-toggle").title,
    );
  });
  $("#login-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    $("#login-error").textContent = "";
    $("#login-button").disabled = true;
    try {
      const result = await client.auth.signInWithPassword({
        email: $("#email").value.trim(),
        password: $("#password").value,
      });
      if (result.error) throw result.error;
      if (!(await enter())) {
        await client.auth.signOut();
        throw new Error("Unauthorized");
      }
      $("#password").value = "";
    } catch (error) {
      $("#login-error").textContent =
        "تعذّر تسجيل الدخول. تحقق من البريد وكلمة المرور وصلاحية الحساب.";
    } finally {
      $("#login-button").disabled = false;
    }
  });
  $("#logout").addEventListener("click", async () => {
    try {
      const { error } = await client.auth.signOut();
      if (error) throw error;
      showLogin();
    } catch (error) {
      $("#page-error").textContent = errorMessage(error);
    }
  });
  $("#change-password").addEventListener("click", () => {
    $("#password-form").reset();
    $("#password-error").textContent = "";
    showDialog($("#password-dialog"));
  });
  $("#cancel-password").addEventListener("click", () =>
    $("#password-dialog").close(),
  );
  $("#password-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    if ($("#new-password").value !== $("#repeat-password").value) {
      $("#password-error").textContent = "كلمتا المرور غير متطابقتين.";
      return;
    }
    const button = $("#password-form button[type=submit]");
    button.disabled = true;
    try {
      const { error } = await client.auth.updateUser({
        password: $("#new-password").value,
      });
      if (error) throw error;
      $("#password-dialog").close();
      $("#password-form").reset();
      toast("تم تغيير كلمة المرور.");
    } catch (error) {
      $("#password-error").textContent = errorMessage(error);
    } finally {
      button.disabled = false;
    }
  });
  icons();
  if (!client) {
    $("#login-error").textContent = "خدمة الإدارة غير متاحة حالياً.";
    $("#login-button").disabled = true;
    return;
  }
  client.auth.onAuthStateChange((event) => {
    if (event === "SIGNED_OUT") showLogin();
  });
  enter().catch(() => {
    $("#login-error").textContent =
      "تعذّر الاتصال. أعد تحميل الصفحة للمحاولة مجدداً.";
  });
})();
