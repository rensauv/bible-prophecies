import os
import csv
import xml.etree.ElementTree as ET

# TON dossier réel
ROOT_DIR = "bible"   # <- important
OUTPUT_FILE = "bible_index.csv"

# Namespace OSIS
NS = {
    "osis": "http://www.bibletechnologies.net/2003/OSIS/namespace"
}


def get_text(parent, tag):
    el = parent.find(f"osis:{tag}", NS)
    if el is not None and el.text:
        return el.text.strip()
    return ""


rows = []

for root, dirs, files in os.walk(ROOT_DIR):

    for file in files:
        if not file.lower().endswith(".xml"):
            continue

        path = os.path.join(root, file)

        try:
            tree = ET.parse(path)
            root_xml = tree.getroot()

            # Cherche <work> dans <header>
            work = root_xml.find(".//osis:header/osis:work", NS)

            if work is None:
                print("⚠️ Pas de <work> :", path)
                continue

            data = {
                "fichier": path,
                "langue": get_text(work, "language"),
                "titre": get_text(work, "title"),
                "identifiant": get_text(work, "identifier"),
                "date": get_text(work, "date"),
                "source": get_text(work, "source"),
                "droits": get_text(work, "rights"),
                "description": get_text(work, "description"),
            }

            rows.append(data)

            print("✅ OK :", path)

        except Exception as e:
            print("❌ Erreur :", path)
            print(e)


# Sauvegarde CSV
with open(OUTPUT_FILE, "w", newline="", encoding="utf-8") as f:

    writer = csv.DictWriter(
        f,
        fieldnames=[
            "fichier",
            "langue",
            "titre",
            "identifiant",
            "date",
            "source",
            "droits",
            "description",
        ],
        delimiter=";"   # mieux pour Excel FR
    )

    writer.writeheader()
    writer.writerows(rows)


print("\n===================")
print("Terminé.")
print("Fichiers trouvés :", len(rows))
print("CSV créé :", OUTPUT_FILE)
print("===================")
