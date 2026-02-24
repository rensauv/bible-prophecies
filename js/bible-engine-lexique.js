let bibleData = [];
let currentLang = localStorage.getItem("siteLang") || navigator.language.slice(0, 2) || "fr"; // Détecter la langue ou utiliser la langue par défaut (fr)

// ================= CHARGEMENT DE L'INDEX DES BIBLES =================
fetch("bible-engine/bible_index.txt")
    .then(res => res.text())
    .then(text => {
        parseBibleIndex(text); // Analyse l'index des Bibles

        // Chercher le fichier de Bible correspondant à la langue
        let bibleIndex = bibleList.findIndex(b => b.lang === currentLang);
        if (bibleIndex === -1) bibleIndex = 0; // fallback si pas trouvé (utiliser la première Bible)

        // Sélectionner le bon fichier de la Bible
        const currentBibleFile = "bible-engine/" + bibleList[bibleIndex].file; // Ajouter "bible-engine/"
        const currentLexiqueFile = `lexique/${currentLang}.html`; // Fichier lexique dynamique en fonction de la langue

        // Charger la Bible et le lexique
        loadBible(currentBibleFile, currentLexiqueFile);
    });

// ================= CHARGER UNE BIBLE =================
function loadBible(bibleFile, lexiqueFile) {
    fetch(bibleFile)
        .then(res => res.text())
        .then(text => {
            const parser = new DOMParser();
            const xml = parser.parseFromString(text, "text/xml");
            parseBible(xml); // Analyse les données de la Bible
            return fetch(lexiqueFile); // Charger le lexique
        })
        .then(res => res.text())
        .then(html => {
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, "text/html");

            const mots = doc.querySelectorAll("mot");
            const container = document.getElementById("lexique-container");

            mots.forEach(mot => {
                const terme = mot.querySelector("t")?.textContent.trim();
                const def = mot.querySelector("d")?.textContent.trim();
                const versets = mot.querySelectorAll("v");

                const details = document.createElement("details");
                details.className = "lexique-item";

                details.innerHTML = `
                    <summary><span class="term">${terme}</span></summary>
                    <div class="definition">
                        <p>${def}</p>
                    </div>
                    <div class="references">
                        <ul>
                            ${[...versets].map(v => {
                                const texte = v.textContent
                                    .replace(/\[/g, "<bible>")
                                    .replace(/\]/g, "</bible>");
                                return `<li>${texte}</li>`;
                            }).join("")}
                        </ul>
                    </div>
                `;

                container.appendChild(details);
            });

            // Fermer les autres <details>
            const allDetails = document.querySelectorAll("details.lexique-item");
            allDetails.forEach(detail => {
                detail.addEventListener("toggle", () => {
                    if (detail.open) {
                        allDetails.forEach(other => {
                            if (other !== detail && other.open) {
                                other.open = false;
                            }
                        });
                    }
                });
            });

            // Traiter les <bible>
            processBibleTags();
        });
}


// ================= PARSER bible_index.txt =================
let bibleList = [];

function parseBibleIndex(text) {
    const lines = text.split("\n");
    lines.forEach(line => {
        if (!line.trim()) return;
        const parts = line.split(";");
        if (parts.length < 3) return;

        const file = parts[0].trim();
        const lang = parts[1].trim();
        const title = parts[2].trim();

        bibleList.push({ file, lang, title });
    });
}

// ================= PARSE BIBLE =================
function parseBible(xml) {
    const books = xml.querySelectorAll("div[type='book']");
    books.forEach(book => {
        const bookId = book.getAttribute("osisID");
        const chapters = [];

        book.querySelectorAll("chapter").forEach(chapter => {
            const verses = [];
            chapter.querySelectorAll("verse").forEach(verse => {
                verses.push(verse.textContent.trim());
            });
            chapters.push(verses);
        });

        bibleData.push({
            id: bookId,
            chapters: chapters
        });
    });
}

// ================= TRAITEMENT <bible> =================
function processBibleTags() {
    const bibleTags = document.querySelectorAll("bible");
    bibleTags.forEach(tag => {
        const originalRef = tag.textContent.trim();
        const match = originalRef.match(
            /^([A-Z0-9]+)\s+(\d+)(?::(\d+)(?:-(\d+))?)?$/i
        );

        if (!match) {
            tag.replaceWith(document.createTextNode(originalRef));
            return;
        }

        const [, bookAbbrev, chapterStr, verseStartStr, verseEndStr] = match;
        const book = bibleData.find(
            b => b.id.toUpperCase() === bookAbbrev.toUpperCase()
        );

        if (!book) {
            tag.replaceWith(document.createTextNode(originalRef));
            return;
        }

        const chapterNum = parseInt(chapterStr, 10) - 1;
        const verses = book.chapters[chapterNum];

        if (!verses) {
            tag.replaceWith(document.createTextNode(originalRef));
            return;
        }

        let start = verseStartStr ? parseInt(verseStartStr, 10) - 1 : 0;
        let end = verseEndStr ? parseInt(verseEndStr, 10) - 1 : start;

        // ===== Conteneur =====
        const container = document.createElement("p");
        container.className = "bible-verse";

        // ===== Bouton référence =====
        const refBtn = document.createElement("button");
        refBtn.className = "bible-ref";
        refBtn.type = "button";

        const displayRef =
            `${book.id} ${chapterStr}` +
            (verseStartStr ? `:${verseStartStr}` : "") +
            (verseEndStr ? `-${verseEndStr}` : "");

        refBtn.textContent = displayRef;

        // ===== Click ouverture lecteur =====
        refBtn.addEventListener("click", () => {
            const verse = verseStartStr ? verseStartStr : "all";
            const url =
                "bible-engine/bibleReader.html" +
                `?book=${encodeURIComponent(book.id)}` +
                `&chapter=${chapterStr}` +
                `&verse=${verse}`;

            window.open(url, "_blank");
        });

        container.appendChild(refBtn);
        container.appendChild(document.createTextNode(" "));

        // ===== Texte =====
        for (let i = start; i <= end; i++) {
            if (!verses[i]) continue;

            if (i !== start) {
                const verseNum = document.createElement("span");
                verseNum.className = "verse-number";
                verseNum.textContent = (i + 1) + " ";
                container.appendChild(verseNum);
            }

            const verseText = document.createElement("span");
            verseText.className = "verse-text";
            verseText.textContent = verses[i] + " ";
            container.appendChild(verseText);
        }

        tag.replaceWith(container);
    });
}
