// ================= DONNÉES =================

let bibleData = [];
let bibleList = [];
let bibleLoaded = false;

// ================= LANGUE =================

const currentLang =
  localStorage.getItem("siteLang") ||
  (navigator.language ? navigator.language.slice(0, 2) : "fr") ||
  "fr";

// ================= CHARGEMENT INDEX =================

fetch("bible-engine/bible_index.txt")
  .then(res => res.text())
  .then(text => {
    parseBibleIndex(text);

    let index = bibleList.findIndex(b => b.lang === currentLang);
    if (index === -1) index = 0;

    const file = "bible-engine/" + bibleList[index].file;
    loadBible(file);
  })
  .catch(err => console.error("Bible index error:", err));


// ================= CHARGER BIBLE =================

function loadBible(file) {

  fetch(file)
    .then(res => res.text())
    .then(text => {

      const parser = new DOMParser();
      const xml = parser.parseFromString(text, "text/xml");

      parseBible(xml);

      bibleLoaded = true;

      // Premier passage
      processBibleTags();

      // Active l'observateur auto
      startBibleObserver();
    })
    .catch(err => console.error("Bible load error:", err));
}


// ================= PARSER INDEX =================

function parseBibleIndex(text) {

  bibleList = [];

  text.split("\n").forEach(line => {

    if (!line.trim()) return;

    const parts = line.split(";").map(p => p.trim());

    if (parts.length >= 2) {
      bibleList.push({
        file: parts[0],
        lang: parts[1],
        title: parts[2] || ""
      });
    }
  });
}


// ================= PARSER XML =================

function parseBible(xml) {

  bibleData = [];

  xml.querySelectorAll("div[type='book']").forEach(book => {

    const id = book.getAttribute("osisID");
    const chapters = [];

    book.querySelectorAll("chapter").forEach(chapter => {

      const verses = [];

      chapter.querySelectorAll("verse").forEach(verse => {
        verses.push(verse.textContent.trim());
      });

      chapters.push(verses);
    });

    bibleData.push({ id, chapters });
  });
}


// ================= TRAITER <bible> =================

function processBibleTags() {

  if (!bibleLoaded) return;

  document.querySelectorAll("bible").forEach(tag => {

    // Évite double traitement
    if (tag.dataset.done) return;
    tag.dataset.done = "1";

    const ref = tag.textContent.trim();

    const match = ref.match(
      /^([A-Z0-9]+)\s+(\d+)(?::(\d+)(?:-(\d+))?)?$/i
    );

    if (!match) {
      tag.replaceWith(ref);
      return;
    }

    const [, bookId, chapStr, vStartStr, vEndStr] = match;

    const book = bibleData.find(
      b => b.id.toUpperCase() === bookId.toUpperCase()
    );

    if (!book) {
      tag.replaceWith(ref);
      return;
    }

    const chapter = book.chapters[parseInt(chapStr) - 1];

    if (!chapter) {
      tag.replaceWith(ref);
      return;
    }

    const start = vStartStr ? parseInt(vStartStr) - 1 : 0;
    const end = vEndStr ? parseInt(vEndStr) - 1 : start;

    // Container
    const container = document.createElement("p");
    container.className = "bible-verse";

    // Bouton référence
    const btn = document.createElement("button");
    btn.className = "bible-ref";
    btn.textContent = ref;

    btn.onclick = () => {

      const verse = vStartStr || "all";

      const url =
        "bible-engine/bibleReader.html" +
        `?book=${bookId}&chapter=${chapStr}&verse=${verse}`;

      window.open(url, "_blank");
    };

    container.appendChild(btn);
    container.appendChild(document.createTextNode(" "));

    // Texte
    for (let i = start; i <= end; i++) {

      if (!chapter[i]) continue;

      container.appendChild(
        document.createTextNode(chapter[i] + " ")
      );
    }

    tag.replaceWith(container);
  });
}


// ================= OBSERVATEUR AUTO =================

function startBibleObserver() {

  const observer = new MutationObserver(() => {
    processBibleTags();
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
}
