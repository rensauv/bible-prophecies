document.addEventListener("DOMContentLoaded", () => {

    // =========================
    // 1️⃣ Langues disponibles
    // =========================
    const languages = {
        af:"Afrikaans", ar:"Arabic", bg:"Bulgarian", ch:"Chinese", cs:"Czech",
        da:"Danish", de:"German", en:"English", es:"Español", eu:"Basque",
        fi:"Finnish", fr:"Français", gd:"Scottish Gaelic", he:"Hebrew",
        hr:"Croatian", ht:"Haitian Creole", hu:"Hungarian", it:"Italian",
        ko:"Korean", la:"Latin", lv:"Latvian", mi:"Maori", no:"Norwegian",
        pl:"Polish", pt:"Portuguese", ro:"Romanian", ru:"Russian", sq:"Albanian",
        sv:"Swedish", sw:"Swahili", th:"Thai", tl:"Tagalog", tr:"Turkish",
        vi:"Vietnamese", zh:"Chinese"
    };

    // =========================
    // 2️⃣ DOM
    // =========================
    const currentBtn = document.getElementById("currentLangBtn");
    const menu = document.getElementById("langMenu");

    // =========================
    // 3️⃣ Langue actuelle
    // =========================
    let currentLang = localStorage.getItem("siteLang") ||
                      navigator.language.slice(0,2).toLowerCase();
    if(!languages[currentLang]) currentLang = "fr";

    // =========================
    // 4️⃣ Page actuelle
    // =========================
    const page = location.pathname.split("/").pop().replace(".html","");

    // =========================
    // 5️⃣ Configuration du menu langue si bouton existe
    // =========================
    if(currentBtn && menu){
        currentBtn.textContent = languages[currentLang]+" ▾";

        // Générer menu
        for(const [code,name] of Object.entries(languages)){
            const li = document.createElement("li");
            li.textContent = name;
            li.dataset.lang = code;
            menu.appendChild(li);

            li.addEventListener("click", ()=>{
                localStorage.setItem("siteLang", code);
                menu.style.display="none";
                location.reload();
            });
        }

        // Ouvrir / fermer menu
        currentBtn.onclick = ()=>{
            menu.style.display = menu.style.display==="block" ? "none" : "block";
        };

        // Fermer menu si clic extérieur
        document.addEventListener("click", e=>{
            if(!currentBtn.contains(e.target) &&
               !menu.contains(e.target)){
                menu.style.display="none";
            }
        });
    }

    // =========================
    // 6️⃣ Charger traductions
    // =========================
    loadTranslations(page,currentLang);
});


// ==================================
// 🔹 CHARGEMENT JSON
// ==================================
async function loadTranslations(page, lang) {

    // Page spécifique
    const pageURL = `/lang/${page}/${lang}.json`;
    let pageData = {};

    try {
        const res = await fetch(pageURL);
        if(res.ok) pageData = await res.json();
    } catch(e){
        console.warn("Erreur page :", e);
    }


    // Nav global
    let navData = {};

    try {
        const resNav = await fetch(`/lang/nav/${lang}.json`);
        if(resNav.ok) navData = await resNav.json();
    } catch(e){
        console.warn("Erreur nav :", e);
    }


    // Fusion
    const translations = {
        ...pageData,
        nav: navData
    };


    // ✅ AJOUT SANS RIEN CASSER
    window.currentLang = lang;

    if(!window.langData){
        window.langData = {};
    }

    window.langData[lang] = translations;


    // Appliquer
    applyTranslations(translations);
}


// ==================================
// 🔹 APPLICATION TEXTE
// ==================================
function applyTranslations(translations) {

    // 🔹 Sauvegarde globale
    window.currentTranslations = translations;


    // Ton code existant (ne supprime rien)
    document.querySelectorAll("[data-i18n]").forEach(el => {

        const key = el.getAttribute("data-i18n");
        const value = key.split(".").reduce(
            (obj, k) => obj && obj[k],
            translations
        );

        if(value){
            el.textContent = value;
        }

    });
}

