/* ==========================================================
   Haine-Saint-Bière — scripts
   Aucun gestionnaire « onclick » dans le HTML : tout est branché ici.
   ========================================================== */
"use strict";

/* ----------------------------------------------------------
   Positions GPS des partenaires (recherche par distance)
   Clé = adresse telle qu'écrite dans PARTENAIRES (juste en dessous).
   Pour la remplir en une fois : ouvre la page avec « ?coordonnees »
   à la fin de l'adresse (ex. index.html?coordonnees), attends la fin du
   calcul, puis remplace la ligne ci-dessous par le texte proposé.
   Tant qu'elle est vide, le site calcule les positions lui-même
   (plus lent, une seule fois par visiteur).
   ---------------------------------------------------------- */
var COORDONNEES = {};

/* ----------------------------------------------------------
   Liste des partenaires (utilisée par la recherche par distance)
   Pour en ajouter un : copie un bloc { ... }, change le nom, l'image,
   l'adresse (avec code postal et commune) et le lien (ou null s'il n'y en a pas),
   puis relance l'outil « index.html?coordonnees » (voir ci-dessus).
   ---------------------------------------------------------- */
var PARTENAIRES = [
    {
        nom: "Chez Raymond - Nathalie et Giovanni",
        image: "image/raymond.jpeg",
        adresses: [
            "Rue des Combattants 50, 7100 La Louvière"
        ],
        lien: "https://www.facebook.com/p/Chez-Raymond-Nathalie-Giovanni-100063481123877/?locale=fr_FR"
    },
    {
        nom: "Le chalet des étangs",
        image: "image/chalet.jpeg",
        adresses: [
            "Rue des Étangs 9, 7100 La Louvière"
        ],
        lien: "https://www.facebook.com/profile.php?id=100063470713775#"
    },
    {
        nom: "Ferme Legat, grange gourmande",
        image: "image/fermel.jpeg",
        adresses: [
            "Rue de Binche 33, 7120 Estinnes"
        ],
        lien: "https://fermelegat.be/"
    },
    {
        nom: "Au sourire de la crémière - Ferme de la Ravisée",
        image: "image/creme.png",
        adresses: [
            "Chaussée de Nivelles 2, 7181 Seneffe"
        ],
        lien: "https://www.facebook.com/p/Au-sourire-de-la-Cr%C3%A9mi%C3%A8re-Ferme-de-la-Ravis%C3%A9e-100069854415944/?locale=fr_FR"
    },
    {
        nom: "La Voisine – Épicerie fine de produits belges",
        image: "image/voisin.png",
        adresses: [
            "Avenue Reine Astrid 368, 7180 Seneffe"
        ],
        lien: "https://www.facebook.com/LaVoisineSeneffe/?locale=fr_FR"
    },
    {
        nom: "Ferme Rabaey",
        image: "image/fermer.png",
        adresses: [
            "Rue du Bois des Râves 123, 7100 La Louvière"
        ],
        lien: null
    },
    {
        nom: "Pascal Hannotier, cellier Jocunditas",
        image: "image/cellier.png",
        adresses: [
            "Rue des Déportés 35, 7070 Le Rœulx"
        ],
        lien: "https://www.facebook.com/pascal.hannotier/?locale=fr_FR"
    },
    {
        nom: "Aux délices d'Ingrid",
        image: "image/ingrid.jpg",
        adresses: [
            "Rue Neuve 19, 7160 Piéton"
        ],
        lien: "https://www.instagram.com/aux_delices_d_ingrid/"
    },
    {
        nom: "Boucherie Deprez",
        image: "image/deprez.jpg",
        adresses: [
            "Rue de Baume 180, 7100 La Louvière"
        ],
        lien: "https://boucheriedeprez-commande.be/#/commande-en-ligne/bons-plans/nos-produits"
    },
    {
        nom: "Gorez boulangerie-pâtisserie",
        image: "image/gorez.jpg",
        adresses: [
            "Rue Oscar Quertinmont 56, 7100 La Louvière",
            "Rue Louis de Brouckère 91, 7100 La Louvière",
            "Avenue Wanderpepen 27, 7130 Binche",
            "Place de Carnières 23, 7141 Carnières"
        ],
        lien: "https://www.facebook.com/p/Gorez-Boulanger-P%C3%A2tissier-61574219774778/"
    },
    {
        nom: "Les fromages de Christel",
        image: "image/cricri.jpg",
        adresses: [
            "Chaussée du Rœulx 270, 7062 Naast"
        ],
        lien: null
    }
];

/* ----------------------------------------------------------
   Formulaire de contact : envoi par e-mail via FormSubmit (gratuit).
   Première fois : envoie un message test, puis clique sur le lien
   d'activation reçu par e-mail (regarde aussi dans les courriers
   indésirables). Ensuite, chaque message arrive dans ta boîte mail.
   ---------------------------------------------------------- */
var ADRESSE_CONTACT = "hainesaintbiere@gmail.com";
var URL_FORMULAIRE = "https://formsubmit.co/ajax/" + ADRESSE_CONTACT;

var CLE_AGE = "hsb-age-ok";        // âge validé, mémorisé le temps de la visite
var CLE_COORD = "hsb-coord-v1";    // positions calculées, gardées dans le navigateur
var DELAI_GEOCODAGE = 1100;        // ms entre deux demandes (le service impose 1 par seconde)
var declencheur = null;            // élément qui a ouvert un popup (pour rendre le focus)

/* ---------- Utilitaires ---------- */

function lireAge() {
    try {
        return sessionStorage.getItem(CLE_AGE) === "1";
    } catch (e) {
        return false; // stockage bloqué : on redemande simplement l'âge
    }
}

function ecrireAge() {
    try {
        sessionStorage.setItem(CLE_AGE, "1");
    } catch (e) {
        /* sans importance */
    }
}

function agePopupVisible() {
    return document.getElementById("age-popup").style.display !== "none";
}

function popupsOuverts() {
    return Array.prototype.some.call(
        document.querySelectorAll(".popup1"),
        function (p) { return p.style.display === "flex"; }
    );
}

// Bloque le défilement de la page tant qu'un popup est affiché
function majBlocage() {
    document.body.classList.toggle("bloque", agePopupVisible() || popupsOuverts());
}

function actionClavier(element, action) {
    // Entrée ou Espace déclenchent l'action (éléments non <button> cliquables)
    element.addEventListener("keydown", function (event) {
        if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            action();
        }
    });
}

function pause(ms) {
    return new Promise(function (resolve) { setTimeout(resolve, ms); });
}

/* ---------- Popups de détail (bières, mentions légales) ---------- */

function ouvrirPopup(id, source) {
    var popup = document.getElementById(id);
    declencheur = source || document.activeElement;
    popup.style.display = "flex";
    majBlocage();

    var fermer = popup.querySelector(".close");
    if (fermer) {
        fermer.focus();
    }
}

function fermerPopup(popup) {
    popup.style.display = "none";
    majBlocage();

    if (declencheur && typeof declencheur.focus === "function") {
        declencheur.focus();
    }
    declencheur = null;
}

function fermerTousLesPopups() {
    Array.prototype.forEach.call(document.querySelectorAll(".popup1"), function (p) {
        if (p.style.display === "flex") {
            fermerPopup(p);
        }
    });
}

function ouvrirBiere(carte) {
    // textContent : le texte est affiché tel quel (jamais interprété comme du HTML)
    document.getElementById("titre").textContent = carte.dataset.nom;
    document.getElementById("alcool").textContent = carte.dataset.alcool;
    document.getElementById("origine").textContent = carte.dataset.origine;
    document.getElementById("description").textContent = carte.dataset.description;
   document.getElementById("format").textContent = carte.dataset.format;

    ouvrirPopup("popup1", carte);
}

/* ---------- Vérification d'âge ---------- */

function entrer() {
    ecrireAge();
    document.getElementById("age-popup").style.display = "none";
    majBlocage();
}

function quitter() {
    var message = document.createElement("h1");
    message.className = "acces-refuse";
    message.textContent = "Accès refusé";
    document.body.replaceChildren(message);
    document.body.classList.remove("bloque");
}

/* ==========================================================
   Recherche des partenaires près de chez soi
   ========================================================== */

var cacheCoord = chargerCacheCoord();
var echecs = {};          // adresses introuvables (pour ne pas réessayer en boucle)
var dernierGeocodage = 0;
var occupe = false;
var carte = null;         // carte Leaflet (créée à la première recherche)
var couche = null;        // calque qui contient les repères de la recherche en cours

function chargerCacheCoord() {
    try {
        return JSON.parse(localStorage.getItem(CLE_COORD)) || {};
    } catch (e) {
        return {};
    }
}

function memoriserCoord(adresse, position) {
    cacheCoord[adresse] = position;
    try {
        localStorage.setItem(CLE_COORD, JSON.stringify(cacheCoord));
    } catch (e) {
        /* sans importance : le calcul sera refait à la prochaine visite */
    }
}

function coordonneesConnues(adresse) {
    return COORDONNEES[adresse] || cacheCoord[adresse] || null;
}

function erreur(code) {
    var e = new Error(code);
    e.code = code;
    return e;
}

// Convertit une adresse en position (service OpenStreetMap Nominatim, Belgique).
// Les demandes sont espacées d'1,1 s, comme l'exige le service.
function geocoder(requete) {
    var attente = Math.max(0, dernierGeocodage + DELAI_GEOCODAGE - Date.now());
    dernierGeocodage = Date.now() + attente;

    return pause(attente).then(function () {
        var url = "https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1" +
                  "&countrycodes=be&accept-language=fr&q=" + encodeURIComponent(requete);
        return fetch(url, { headers: { "Accept": "application/json" } });
    }).then(function (reponse) {
        if (!reponse.ok) {
            throw erreur("RESEAU");
        }
        return reponse.json();
    }).then(function (resultats) {
        if (!resultats.length) {
            return null;
        }
        return { lat: parseFloat(resultats[0].lat), lng: parseFloat(resultats[0].lon) };
    }).catch(function (e) {
        throw e.code ? e : erreur("RESEAU");
    });
}

// Distance à vol d'oiseau en km (formule de haversine)
function distanceKm(a, b) {
    var rad = Math.PI / 180;
    var dLat = (b.lat - a.lat) * rad;
    var dLng = (b.lng - a.lng) * rad;
    var h = Math.pow(Math.sin(dLat / 2), 2) +
            Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.pow(Math.sin(dLng / 2), 2);
    return 2 * 6371 * Math.asin(Math.sqrt(h));
}

function formaterKm(km) {
    return km.toLocaleString("fr-BE", { maximumFractionDigits: 1 }) + " km";
}

function lirePartenaires() {
    return PARTENAIRES;
}

function toutesLesAdresses(partenaires) {
    var liste = [];
    partenaires.forEach(function (p) { liste = liste.concat(p.adresses); });
    return liste;
}

// Calcule (une par une) les positions qui manquent
function preparerPositions(adresses, progression) {
    var manquantes = adresses.filter(function (a) {
        return !coordonneesConnues(a) && !echecs[a];
    });
    var faites = 0;

    return manquantes.reduce(function (chaine, adresse) {
        return chaine.then(function () {
            return geocoder(adresse).then(function (position) {
                if (position) {
                    memoriserCoord(adresse, [position.lat, position.lng]);
                } else {
                    echecs[adresse] = true;
                }
            }).catch(function () {
                echecs[adresse] = true;
            }).then(function () {
                faites++;
                progression(faites, manquantes.length);
            });
        });
    }, Promise.resolve());
}

/* ----- Affichage ----- */

function afficherMessage(texte, enErreur) {
    var zone = document.getElementById("resultat-proximite");
    zone.textContent = texte;
    zone.classList.toggle("erreur", !!enErreur);
}

function basculerBoutons(desactive) {
    Array.prototype.forEach.call(
        document.querySelectorAll("#form-proximite button, #form-proximite input, #form-proximite select"),
        function (el) { el.disabled = desactive; }
    );
}

function pluriel(n, singulier, plurielTexte) {
    return n + " " + (n > 1 ? plurielTexte : singulier);
}

// Affiche sous la carte une fiche par partenaire situé dans la zone (le plus proche d'abord)
function remplirListe(lieux) {
    var conteneur = document.getElementById("liste-proximite");
    conteneur.replaceChildren();

    // Regroupe les adresses par partenaire (Gorez en a quatre, par exemple)
    var groupes = [];
    var parNom = {};
    lieux.forEach(function (lieu) {
        if (!parNom[lieu.nom]) {
            parNom[lieu.nom] = { partenaire: lieu.partenaire, lieux: [] };
            groupes.push(parNom[lieu.nom]);
        }
        parNom[lieu.nom].lieux.push(lieu);
    });
    // Les lieux arrivent déjà triés par distance : les groupes le sont donc aussi

    groupes.forEach(function (groupe) {
        conteneur.appendChild(creerFichePartenaire(groupe.partenaire, groupe.lieux));
    });
}

function creerFichePartenaire(partenaire, lieux) {
    var fiche = document.createElement("div");
    fiche.className = "card";

    if (partenaire.image) {
        var img = document.createElement("img");
        img.src = partenaire.image;
        img.alt = partenaire.nom;
        img.loading = "lazy";

        if (partenaire.lien) {
            var lien = document.createElement("a");
            lien.href = partenaire.lien;
            lien.target = "_blank";
            lien.rel = "noopener noreferrer";
            lien.appendChild(img);
            fiche.appendChild(lien);
        } else {
            fiche.appendChild(img);
        }
    }

    var titre = document.createElement("h3");
    titre.textContent = partenaire.nom;
    fiche.appendChild(titre);

    var adresses = document.createElement("p");
    adresses.className = "adresse";
    lieux.forEach(function (lieu, i) {
        if (i > 0) {
            adresses.appendChild(document.createElement("br"));
            adresses.appendChild(document.createElement("br"));
        }
        adresses.appendChild(document.createTextNode(lieu.adresse));
        adresses.appendChild(document.createElement("br"));
        var distance = document.createElement("strong");
        distance.textContent = formaterKm(lieu.km) + " (à vol d'oiseau)";
        adresses.appendChild(distance);
    });
    fiche.appendChild(adresses);

    return fiche;
}

function contenuPopup(lieu) {
    var bloc = document.createElement("div");
    var nom = document.createElement("strong");
    nom.textContent = lieu.nom;
    bloc.appendChild(nom);
    bloc.appendChild(document.createElement("br"));
    bloc.appendChild(document.createTextNode(lieu.adresse));
    bloc.appendChild(document.createElement("br"));
    bloc.appendChild(document.createTextNode(formaterKm(lieu.km) + " (à vol d'oiseau)"));

    if (lieu.lien) {
        bloc.appendChild(document.createElement("br"));
        var a = document.createElement("a");
        a.href = lieu.lien;
        a.target = "_blank";
        a.rel = "noopener noreferrer";
        a.textContent = "Voir leur page";
        bloc.appendChild(a);
    }
    return bloc;
}

function repere(emoji) {
    return L.divIcon({
        className: "pin",
        html: emoji,
        iconSize: [32, 32],
        iconAnchor: [16, 30],
        popupAnchor: [0, -26]
    });
}

function afficherCarte(origine, rayonKm, lieux) {
    var conteneur = document.getElementById("carte-partenaires");
    conteneur.hidden = false;

    if (!carte) {
        carte = L.map(conteneur);
        L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
            maxZoom: 19,
            attribution: '© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a>'
        }).addTo(carte);
        couche = L.layerGroup().addTo(carte);
    }

    couche.clearLayers();

    // Cadrage : le carré qui entoure le cercle de recherche (calculé sans dépendre de la carte)
    var cadre = L.latLng(origine.lat, origine.lng).toBounds(rayonKm * 2000);
    carte.invalidateSize();
    carte.fitBounds(cadre, { padding: [20, 20] });

    L.circle([origine.lat, origine.lng], {
        radius: rayonKm * 1000,
        color: "#b8860b",
        fillColor: "#d4a017",
        fillOpacity: 0.1,
        weight: 2
    }).addTo(couche);

    L.marker([origine.lat, origine.lng], {
        icon: repere("📍"),
        title: "Votre position",
        zIndexOffset: 1000
    }).addTo(couche);

    lieux.forEach(function (lieu) {
        L.marker([lieu.lat, lieu.lng], { icon: repere("🍺"), title: lieu.nom })
            .bindPopup(contenuPopup(lieu))
            .addTo(couche);
    });
}

function afficherResultats(contexte, rayonKm) {
    var lieux = [];
    contexte.partenaires.forEach(function (p) {
        p.adresses.forEach(function (adresse) {
            var c = coordonneesConnues(adresse);
            if (!c) {
                return;
            }
            lieux.push({
                partenaire: p, nom: p.nom, adresse: adresse, lien: p.lien, lat: c[0], lng: c[1],
                km: distanceKm(contexte.origine, { lat: c[0], lng: c[1] })
            });
        });
    });
    lieux.sort(function (a, b) { return a.km - b.km; });

    var dansZone = lieux.filter(function (l) { return l.km <= rayonKm; });
    var noms = {};
    dansZone.forEach(function (l) { noms[l.nom] = true; });
    var nbPartenaires = Object.keys(noms).length;

    var autour = contexte.origine.libelle;
    if (nbPartenaires > 0) {
        afficherMessage(pluriel(nbPartenaires, "partenaire", "partenaires") +
            " dans un rayon de " + rayonKm + " km autour de " + autour + ".");
    } else if (lieux.length) {
        afficherMessage("Aucun partenaire dans un rayon de " + rayonKm + " km. Le plus proche, " +
            lieux[0].nom + ", est à " + formaterKm(lieux[0].km) + ".");
    } else {
        afficherMessage("Les positions des partenaires n'ont pas pu être calculées. Réessayez plus tard.", true);
    }

    remplirListe(dansZone);

    if (typeof L === "undefined") {
        afficherMessage(document.getElementById("resultat-proximite").textContent +
            " (La carte n'a pas pu être chargée : vérifiez votre connexion.)");
        return;
    }
    afficherCarte(contexte.origine, rayonKm, dansZone);
    montrerResultats();
}

// Fait défiler la page jusqu'au résultat (utile surtout sur téléphone)
function montrerResultats() {
    var reduit = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    document.getElementById("resultat-proximite").scrollIntoView({
        behavior: reduit ? "auto" : "smooth",
        block: "start"
    });
}

/* ----- Déroulement d'une recherche ----- */

function origineParAdresse() {
    var saisie = document.getElementById("adresse").value.trim();
    if (!saisie) {
        throw erreur("VIDE");
    }
    return geocoder(saisie).then(function (position) {
        if (!position) {
            throw erreur("INTROUVABLE");
        }
        return { lat: position.lat, lng: position.lng, libelle: "« " + saisie + " »" };
    });
}

var MESSAGES_ERREUR = {
    VIDE: "Saisissez d'abord une adresse.",
    INTROUVABLE: "Adresse introuvable. Essayez avec le code postal et la commune (ex. : Rue Neuve 1, 7100 La Louvière). Seules les adresses en Belgique sont reconnues.",
    RESEAU: "Le service de recherche d'adresses ne répond pas. Réessayez dans un instant."
};

function lancerRecherche(obtenirOrigine) {
    if (occupe) {
        return;
    }
    occupe = true;
    basculerBoutons(true);
    afficherMessage("Recherche en cours…");

    var rayonKm = parseInt(document.getElementById("rayon").value, 10);

    Promise.resolve().then(obtenirOrigine).then(function (origine) {
        var partenaires = lirePartenaires();
        return preparerPositions(toutesLesAdresses(partenaires), function (faites, total) {
            afficherMessage("Calcul de la position des partenaires (" + faites + "/" + total +
                ")… cela n'arrive qu'à la première recherche.");
        }).then(function () {
            afficherResultats({ origine: origine, partenaires: partenaires }, rayonKm);
        });
    }).catch(function (e) {
        if (!MESSAGES_ERREUR[e.code]) {
            console.error(e); // erreur inattendue : visible dans la console du navigateur
        }
        afficherMessage(MESSAGES_ERREUR[e.code] || MESSAGES_ERREUR.RESEAU, true);
    }).then(function () {
        occupe = false;
        basculerBoutons(false);
    });
}

/* ----- Formulaire de contact ----- */

function afficherResultatContact(texte, type) {
    var zone = document.getElementById("resultat-contact");
    zone.textContent = texte;
    zone.classList.toggle("ok", type === "ok");
    zone.classList.toggle("erreur", type === "erreur");
}

function envoyerContact(event) {
    event.preventDefault();

    var formulaire = event.target;
    var bouton = document.getElementById("btn-envoyer");
    var nom = formulaire.elements["nom"].value.trim();
    var email = formulaire.elements["email"].value.trim();
    var sujet = formulaire.elements["sujet"].value;
    var message = formulaire.elements["message"].value.trim();

    // Champ piège rempli = robot : on fait semblant que tout va bien, sans rien envoyer
    if (formulaire.elements["_honey"].value) {
        afficherResultatContact("Merci ! Votre message est bien parti.", "ok");
        return;
    }

    if (!nom) {
        afficherResultatContact("Indiquez votre nom.", "erreur");
        return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        afficherResultatContact("Indiquez une adresse e-mail valide pour que nous puissions vous répondre.", "erreur");
        return;
    }
    if (message.length < 5) {
        afficherResultatContact("Écrivez votre message.", "erreur");
        return;
    }

    bouton.disabled = true;
    afficherResultatContact("Envoi en cours…", null);

    fetch(URL_FORMULAIRE, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify({
            name: nom,
            email: email,
            sujet: sujet,
            message: message,
            _subject: "Site Haine-Saint-Bière : " + sujet,
            _replyto: email,
            _template: "table",
            _captcha: "false"
        })
    }).then(function (reponse) {
        return reponse.json().then(function (donnees) {
            if (!reponse.ok || !(donnees.success === true || donnees.success === "true")) {
                throw erreur("ENVOI");
            }
        });
    }).then(function () {
        formulaire.reset();
        afficherResultatContact("Merci ! Votre message est bien parti. Nous vous répondons rapidement.", "ok");
    }).catch(function () {
        afficherResultatContact("L'envoi a échoué. Écrivez-nous directement à " + ADRESSE_CONTACT +
            " ou appelez le 0493/59.78.67.", "erreur");
    }).then(function () {
        bouton.disabled = false;
    });
}

/* ----- Outil à usage unique : calculer les coordonnées une bonne fois ----- */

function outilCoordonnees() {
    var panneau = document.createElement("div");
    panneau.className = "outil-coordonnees";

    var titre = document.createElement("h2");
    titre.textContent = "Calcul des positions des partenaires";
    var etat = document.createElement("p");
    etat.textContent = "Calcul en cours… (environ 1 seconde par adresse)";
    var consigne = document.createElement("p");
    consigne.textContent = "Quand le texte apparaît : copie tout le contenu de la case, puis remplace " +
        "la ligne « var COORDONNEES = {}; » au début de script.js par ce texte.";
    var zone = document.createElement("textarea");
    zone.readOnly = true;
    zone.rows = 18;

    panneau.appendChild(titre);
    panneau.appendChild(etat);
    panneau.appendChild(consigne);
    panneau.appendChild(zone);
    document.body.appendChild(panneau);

    var adresses = toutesLesAdresses(lirePartenaires());
    preparerPositions(adresses, function (faites, total) {
        etat.textContent = "Calcul en cours… " + faites + "/" + total;
    }).then(function () {
        var table = {};
        var introuvables = [];
        adresses.forEach(function (a) {
            var c = coordonneesConnues(a);
            if (c) {
                table[a] = c;
            } else {
                introuvables.push(a);
            }
        });
        zone.value = "var COORDONNEES = " + JSON.stringify(table, null, 4) + ";";
        etat.textContent = introuvables.length
            ? "Terminé. Adresses introuvables (à corriger dans index.html) : " + introuvables.join(" ; ")
            : "Terminé : toutes les adresses ont été trouvées.";
    });
}

/* ---------- Mise en route ---------- */

document.addEventListener("DOMContentLoaded", function () {

    // Sécurité : vérifie que index.html et script.js sont de la même version
    var attendus = ["age-popup", "btn-oui", "btn-non", "btn-decouvrir", "biere", "popup1",
                    "popup-mentions", "lien-mentions", "form-proximite", "adresse", "rayon",
                    "resultat-proximite", "carte-partenaires", "liste-proximite", "form-contact"];
    var manquants = attendus.filter(function (id) { return !document.getElementById(id); });
    if (manquants.length) {
        console.error("index.html n'est pas à jour : éléments introuvables (" + manquants.join(", ") +
                      "). Remplace index.html, style.css et script.js par les trois derniers fichiers.");
        return;
    }

    // Âge : déjà validé pendant cette visite ? on n'affiche pas le popup
    if (lireAge()) {
        document.getElementById("age-popup").style.display = "none";
    } else {
        document.getElementById("btn-oui").focus();
    }
    majBlocage();

    document.getElementById("btn-oui").addEventListener("click", entrer);
    document.getElementById("btn-non").addEventListener("click", quitter);

    // Bouton « Découvrir »
    document.getElementById("btn-decouvrir").addEventListener("click", function () {
        var reduit = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        document.getElementById("biere").scrollIntoView({
            behavior: reduit ? "auto" : "smooth"
        });
    });

    // Cartes de bières (souris et clavier)
    Array.prototype.forEach.call(document.querySelectorAll(".card[data-nom]"), function (carteHtml) {
        carteHtml.addEventListener("click", function () { ouvrirBiere(carteHtml); });
        actionClavier(carteHtml, function () { ouvrirBiere(carteHtml); });
    });

    // Lien « Mentions légales »
    var lienMentions = document.getElementById("lien-mentions");
    lienMentions.addEventListener("click", function () {
        ouvrirPopup("popup-mentions", lienMentions);
    });

    // Croix de fermeture + clic sur le fond sombre
    Array.prototype.forEach.call(document.querySelectorAll(".popup1"), function (popup) {
        var croix = popup.querySelector(".close");
        croix.addEventListener("click", function () { fermerPopup(popup); });
        actionClavier(croix, function () { fermerPopup(popup); });

        popup.addEventListener("click", function (event) {
            if (event.target === popup) {
                fermerPopup(popup);
            }
        });
    });

    // Touche Échap
    document.addEventListener("keydown", function (event) {
        if (event.key === "Escape") {
            fermerTousLesPopups();
        }
    });

    // Recherche de partenaires
    document.getElementById("form-proximite").addEventListener("submit", function (event) {
        event.preventDefault();
        lancerRecherche(origineParAdresse);
    });

    // Formulaire de contact
    document.getElementById("form-contact").addEventListener("submit", envoyerContact);

    // Outil de calcul des coordonnées (index.html?coordonnees)
    if (/[?&]coordonnees\b/.test(window.location.search)) {
        outilCoordonnees();
    }
});
