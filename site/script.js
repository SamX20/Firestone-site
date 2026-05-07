const copy = {
  ar: {
    navServices: "الخدمات",
    navWork: "الأعمال",
    navProcess: "الطريقة",
    navContact: "تواصل",
    heroEyebrow: "تصميم وتنفيذ ديكورات داخلية وخارجية",
    heroTitle: "Firestone",
    heroCopy: "جدران تلفزيون، فاير بليس، بديل رخام، كلادنغ، شلالات خارجية، وديكورات مخصصة بنَفَس فاخر وتفاصيل دقيقة.",
    ctaWhatsapp: "احجز استشارة واتساب",
    ctaWork: "شاهد الأعمال",
    areaAmman: "عمان",
    areaMadaba: "مأدبا",
    areaNaour: "ناعور",
    areaMarj: "مرج الحمام",
    introKicker: "Firestone Jo",
    introTitle: "ديكورات تجمع الدفء، الرخام، والإضاءة.",
    introCopy: "ننَفذ تفاصيل الديكور من الفكرة إلى التركيب، بمواد عملية وتشطيبات ترفع قيمة المكان وتخليه حاضر بصريًا من أول نظرة.",
    servicesKicker: "الخدمات",
    servicesTitle: "تنفيذ داخلي وخارجي بمستوى عرض راق.",
    service1Title: "فاير بليس وديكورات شاشة",
    service1Copy: "تصميم واجهات تلفزيون وفاير بليس للمجالس، الصالونات، وغرف المعيشة.",
    service2Title: "كلادنغ وبديل رخام",
    service2Copy: "ألواح وكسوات بملمس حجري أو رخامي مع تفاصيل إضاءة وتشطيب نظيف.",
    service3Title: "غرف نوم وديكورات داخلية",
    service3Copy: "خلفيات سرير، حوائط مميزة، فوم، ومقاسات حسب مساحة البيت.",
    service4Title: "شلالات وجلسات خارجية",
    service4Copy: "رخام، حجر، شلالات خارجية، ومناطق شواء مصممة للاستخدام اليومي.",
    workKicker: "مختارات من العمل",
    workTitle: "صور حقيقية من مشاريع منفذة.",
    featured1: "فاير بليس رخامي بإضاءة مخفية",
    featured2: "جلسة خارجية ومطبخ شواء",
    featured3: "ديكور شاشة خشبي دافئ",
    processKicker: "الطريقة",
    processTitle: "من المعاينة إلى التسليم بخطوات واضحة.",
    step1: "معاينة المساحة وفهم الذوق والميزانية.",
    step2: "اقتراح خامات، ألوان، وإضاءة تناسب المكان.",
    step3: "تنفيذ وقياسات وتركيب بتشطيب نظيف.",
    contactKicker: "ابدأ مشروعك",
    contactTitle: "أرسل صورة للمساحة وخذ اقتراح تصميم مناسب.",
    contactWhatsapp: "تواصل واتساب",
    contactAreas: "نخدم عمان، مأدبا، ناعور، ومرج الحمام."
  },
  en: {
    navServices: "Services",
    navWork: "Work",
    navProcess: "Process",
    navContact: "Contact",
    heroEyebrow: "Interior and exterior design execution",
    heroTitle: "Firestone",
    heroCopy: "TV walls, fireplaces, marble alternatives, cladding, outdoor waterfalls, and custom decor finished with a luxury eye for detail.",
    ctaWhatsapp: "Book on WhatsApp",
    ctaWork: "View Work",
    areaAmman: "Amman",
    areaMadaba: "Madaba",
    areaNaour: "Naour",
    areaMarj: "Marj Al Hamam",
    introKicker: "Firestone Jo",
    introTitle: "Spaces shaped by warmth, marble, and refined lighting.",
    introCopy: "We take decor from concept to installation with practical materials, refined finishing, and details that make the space feel considered at first glance.",
    servicesKicker: "Services",
    servicesTitle: "Interior and exterior execution with a premium showroom feel.",
    service1Title: "Fireplaces and TV walls",
    service1Copy: "Feature walls for living rooms, salons, majlis spaces, and modern homes.",
    service2Title: "Cladding and marble alternatives",
    service2Copy: "Stone and marble-look panels with lighting details and clean finishing.",
    service3Title: "Bedrooms and interior decor",
    service3Copy: "Headboard walls, feature surfaces, foam decor, and dimensions tailored to the home.",
    service4Title: "Waterfalls and outdoor areas",
    service4Copy: "Marble, stone, outdoor water features, and barbecue spaces designed for daily use.",
    workKicker: "Selected Work",
    workTitle: "Real photos from completed projects.",
    featured1: "Marble fireplace with hidden lighting",
    featured2: "Outdoor seating and barbecue area",
    featured3: "Warm wood TV wall design",
    processKicker: "Process",
    processTitle: "A clear path from site visit to delivery.",
    step1: "Measure the space and understand taste and budget.",
    step2: "Suggest materials, colors, and lighting that fit the room.",
    step3: "Execute, install, and finish with clean details.",
    contactKicker: "Start Your Project",
    contactTitle: "Send a photo of the space and get a tailored design direction.",
    contactWhatsapp: "Contact on WhatsApp",
    contactAreas: "Serving Amman, Madaba, Naour, and Marj Al Hamam."
  }
};

const toggle = document.querySelector("[data-lang-toggle]");
const translatable = document.querySelectorAll("[data-i18n]");
let language = localStorage.getItem("firestone-language") || "ar";

function setLanguage(nextLanguage) {
  language = nextLanguage;
  document.documentElement.lang = language;
  document.documentElement.dir = language === "ar" ? "rtl" : "ltr";
  document.body.setAttribute("dir", document.documentElement.dir);
  translatable.forEach((node) => {
    const key = node.dataset.i18n;
    if (copy[language][key]) {
      node.textContent = copy[language][key];
    }
  });
  toggle.textContent = language === "ar" ? "EN" : "AR";
  localStorage.setItem("firestone-language", language);
}

toggle.addEventListener("click", () => {
  setLanguage(language === "ar" ? "en" : "ar");
});

setLanguage(language);

const heroSlides = Array.from(document.querySelectorAll(".hero-slide"));
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

if (heroSlides.length > 1 && !reduceMotion) {
  let activeSlide = 0;

  window.setInterval(() => {
    heroSlides[activeSlide].classList.remove("is-active");
    activeSlide = (activeSlide + 1) % heroSlides.length;
    heroSlides[activeSlide].classList.add("is-active");
  }, 6500);
}
