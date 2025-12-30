// --- 1. DONNÉES GLOBALES ---
const mapData = {
    'inondation': [{loc:[48.85, 2.35], r:15000}, {loc:[44.83, -0.57], r:20000}, {loc:[43.83, 4.36], r:10000}], 
    'seisme': [{loc:[43.71, 7.26], r:30000}, {loc:[42.69, 2.89], r:25000}, {loc:[43.09, 0.05], r:25000}], 
    'mouvement': [{loc:[45.76, 4.83], r:10000}, {loc:[44.17, 6.94], r:15000}], 
    'radon': [{loc:[48.11, -1.67], r:60000}, {loc:[45.83, 1.26], r:50000}], 
    'nucleaire': [{loc:[47.72, 1.57], r:50000}, {loc:[49.63, 1.62], r:50000}, {loc:[44.34, 4.73], r:50000}], 
    'industriel': [{loc:[49.44, 1.09], r:15000}, {loc:[43.58, 1.43], r:10000}, {loc:[43.44, 5.20], r:15000}] 
};

const detailsContent = {
    'inondation': { title: "Inondations", color: "#3A6EA5", icon: "fa-water", desc: "Carte des risques d'inondation." },
    'industriel': { 
        title: "Risques Technologiques", color: "#414345", icon: "fa-industry", 
        desc: "Cartographie globale des risques technologiques.",
        timeline: [{year:"2001", t:"Explosion AZF", d:"Plus grave accident industriel."}, {year:"2019", t:"Incendie Lubrizol", d:"Incendie majeur."}],
        chartTitle: "Sites Seveso", chartType: 'bar', chartLabels: ['Seuil Haut', 'Seuil Bas'], chartData: [705, 607]
    },
    'mouvement': { title: "Mouvements de Terrain", color: "#8C6A43", icon: "fa-hill-rockslide", desc: "Glissements et éboulements." },
    'nucleaire': { title: "Nucléaire", color: "#059669", icon: "fa-radiation", desc: "Parc nucléaire français et accidents historiques." },
    'seisme': { title: "Risque Sismique", color: "#D97706", icon: "fa-house-crack", desc: "La France a une sismicité modérée." },
    'radon': { title: "Radon", color: "#7E22CE", icon: "fa-wind", desc: "Gaz radioactif naturel." }
};

var map;
var activeLayers = {};
var currentChart = null;

// --- 2. FONCTIONS DE NAVIGATION ---
function switchView(name) {
    document.querySelectorAll('.view-section').forEach(el => el.classList.remove('visible'));
    const view = document.getElementById('view-' + name);
    if (view) view.classList.add('visible');
    
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active-tab'));
    if(name === 'grid') document.querySelectorAll('.nav-btn')[0].classList.add('active-tab');
    if(name === 'map') document.querySelectorAll('.nav-btn')[1].classList.add('active-tab');
}

function openMap(mode, riskType) {
    switchView('map');
    if(!riskType) {
        // Mode Leaflet interne
        const groupNat = document.getElementById('group-naturel');
        const groupTech = document.getElementById('group-technique');
        const mapDiv = document.getElementById('map');
        
        document.getElementById('external-frame-container').style.display = 'none';
        mapDiv.style.display = 'block';
        if(document.querySelector('.sidebar-controls')) document.querySelector('.sidebar-controls').style.display = 'flex';
        
        resetMap();

        if (mode === 'naturel') {
            if(groupNat) groupNat.style.display = 'block';
            if(groupTech) groupTech.style.display = 'none';
            toggleLayer('inondation', '#3A6EA5'); 
        } else {
            if(groupNat) groupNat.style.display = 'none';
            if(groupTech) groupTech.style.display = 'block';
            toggleLayer('nucleaire', '#5A5A5A');
        }
        setTimeout(() => { if(map) map.invalidateSize(); }, 200);
    } else {
        // Mode Iframe externe
        const iframe = document.getElementById('main-map-frame');
        document.getElementById('external-frame-container').style.display = 'block';
        document.getElementById('map').style.display = 'none'; 
        if(document.querySelector('.sidebar-controls')) document.querySelector('.sidebar-controls').style.display = 'none';
        
        let url = (mode === 'naturel') ? "https://clem6703.github.io/Inondation/" : "DEP_TECH-main/index.html";
        iframe.src = url + "#" + riskType;
    }
}

// --- 3. OUVERTURE MODALE (NETTOYÉE) ---
// --- OUVERTURE MODALE ---
function openModal(key) {
    const d = detailsContent[key];
    if (!d) return;

    let html = `
        <div class="modal-header">
            <div class="modal-title-group">
                <div class="modal-icon" style="background:${d.color}"><i class="fa-solid ${d.icon}"></i></div>
                <h2 class="modal-title">${d.title}</h2>
            </div>
            <button class="close-btn" onclick="closeModal()"><i class="fa-solid fa-xmark"></i></button>
        </div>
        <div class="modal-body" style="padding: 20px;">`;

    // 1. CAS INONDATION (Carte seule)
    if (key === 'inondation') {
        html += `<iframe src="https://clem6703.github.io/Inondation/" style="width:100%; height:500px; border:none;"></iframe>`;
    } 
    // 2. CAS INDUSTRIEL (Carte + Stats)
    else if (key === 'industriel') {
        // ... (Ton code industriel ici si tu l'as gardé, sinon laisse vide ou mets le défaut)
        html += `<div style="padding:40px; text-align:center;">${d.desc}</div>`; 
    }
    // 3. CAS FRISES : MOUVEMENT *ET* NUCLEAIRE (C'est ici la correction !)
    else if (key === 'mouvement' || key === 'nucleaire') {
        html += `
            <div class="timeline-container">
                <div class="timeline">
                    <div class="timeline-line" id="line-${key}"></div>
                    <div class="timeline-progress" id="progress-${key}"></div>
                    <div id="events-list"></div>
                </div>
            </div>
            
            <div class="details-box" id="details-box" style="border-top-color: ${d.color}">
                <div class="details-text">
                    <h3 id="d-title" style="color:${d.color}">Chargement...</h3>
                    <p><strong>Année :</strong> <span id="d-year">-</span></p>
                    <p><strong id="d-headline"></strong></p>
                    <p id="d-desc"></p>
                    <p><em>Impact : <span id="d-impact"></span></em></p>
                </div>
                <div class="details-image" id="d-img-container"></div>
            </div>`;
    } 
    // 4. AUTRES (Défaut)
    else {
        html += `<div style="padding:40px; text-align:center;">${d.desc || "Information à venir."}</div>`;
    }

    html += `</div>`; // Fin body

    // Injection du HTML
    document.getElementById('modalContent').innerHTML = html;
    
    // Affichage
    const modal = document.getElementById('view-detail');
    modal.style.display = 'flex';
    setTimeout(() => modal.classList.add('visible'), 10);

    // IMPORTANT : Lancement du script de la frise pour Mouvement OU Nucléaire
    if (key === 'mouvement' || key === 'nucleaire') {
        // On attend un tout petit peu que le HTML soit affiché
        setTimeout(() => {
            initTimeline(key, d.color);
        }, 50);
    }
}

function closeModal() {
    const modal = document.getElementById('view-detail');
    modal.classList.remove('visible');
    setTimeout(() => modal.style.display = 'none', 300);
}

// --- 4. GENERATEURS HTML (Pour éviter le code rouge) ---

function generateIndustrielHTML(d) {
    // On construit le HTML ligne par ligne pour que VS Code ne s'embrouille pas
    let timelineHTML = d.timeline.map(t => 
        `<div class="timeline-item" style="margin-bottom:20px;">
            <strong style="color:${d.color}">${t.year}</strong><br>
            <strong>${t.t}</strong><br>
            <span style="color:#666; font-size:0.9rem;">${t.d}</span>
        </div>`
    ).join('');

    return `
        <div class="split-layout">
            <div class="left-map-area"><iframe src="DEP_TECH-main/index.html#industriel" style="width:100%; height:100%; border:none;"></iframe></div>
            <div class="right-info-area">
                <h3>Statistiques Seveso</h3>
                <div style="height:200px; margin-bottom:30px;"><canvas id="riskChart"></canvas></div>
                <h3>Historique</h3>
                <div style="margin-top:20px; border-left:3px solid ${d.color}; padding-left:20px;">
                    ${timelineHTML}
                </div>
            </div>
        </div>`;
}

function generateTimelineHTML(suffix) {
    return `
        <div style="padding: 20px;">
            <div class="timeline-container">
                <div class="timeline">
                    <div class="timeline-line" style="background-color: var(--color-line-${suffix});"></div>
                    <div class="timeline-progress" id="timeline-progress" style="background-color: var(--color-active-${suffix});"></div>
                    <div id="events-list"></div>
                </div>
            </div>
            <div class="details-box" style="border-top-color: var(--color-active-${suffix});">
                <div class="details-text">
                    <h3 id="detail-title" style="color: var(--color-primary-${suffix});">Chargement...</h3>
                    <p><strong>Année :</strong> <span id="detail-year"></span></p>
                    ${suffix === 'nu' ? '<p><strong>INES :</strong> <span id="detail-ines"></span></p>' : '<p><strong>Type :</strong> <span id="detail-type"></span></p>'}
                    <p><strong id="detail-headline" style="color: var(--color-primary-${suffix});"></strong></p>
                    <p id="detail-description" style="line-height:1.6; color:#555;"></p>
                    <p style="margin-top:15px; font-size:0.9rem; color:#888;"> Impact : <span id="detail-impact"></span></p>
                    <p style="font-size:0.9rem; color:#888;"> Zone : <span id="detail-zone"></span></p>
                </div>
                <div class="details-image" id="details-image-container"></div>
            </div>
        </div>`;
}

// --- 5. INITIALISATION DES FRISES ---

// --- REMPLACE JUSTE CETTE FONCTION ---
function initTimeline(type, color) {
    
    // 1. Données pour Mouvements de Terrain
    const dataMouv = [
        { year: 1953, t: "L’Harmalière", h: "Effondrement majeur en Isère.", d: "Le versant du Mont Saint-Eynard a connu un effondrement de plusieurs dizaines de milliers de m³.", i: "3 morts.", img: "https://upload.wikimedia.org/wikipedia/commons/f/f9/Eboulement_de_La_Rivi%C3%A8re_en_mars_2025.jpg" },
        { year: 1970, t: "La Clapière", h: "Glissement actif.", d: "Masse rocheuse instable de 50 millions de m³ déplacée à vitesse record.", i: "Menace la vallée.", img: "https://www.encyclopedie-environnement.org/app/uploads/2019/06/clapiere_fig6-2016.jpg" },
        { year: 1987, t: "Séchilienne", h: "Instabilité du Mont Sec.", d: "Risque d'éboulement majeur pouvant créer un barrage naturel.", i: "Surveillance 24/7.", img: "https://upload.wikimedia.org/wikipedia/commons/6/64/Ruines_de_S%C3%A9chilienne_le_14-07-06.jpg" },
        { year: 1992, t: "Mont Granier", h: "Réactivation historique.", d: "Chutes de roches massives sur ce site connu pour la catastrophe de 1248.", i: "Routes menacées.", img: "https://cdn-s-www.ledauphine.com/images/8D3FB866-6A0C-44BC-9390-357A240B07E7/MF_contenu/50-000-m3-de-roches-sont-tombes-au-mont-granier-hier-matin-1462609866.jpg" },
        { year: 2020, t: "Tempête Alex", h: "Crues et glissements.", d: "Pluies extrêmes provoquant des coulées de boue dévastatrices.", i: "Destruction majeure.", img: "https://www.irma-grenoble.com/photos/st-martin-vesubie/361w001EP_Alpes-Maritimes-inondation_02-10-2020/361w260EP.jpg" }
    ];

    // 2. Données pour Nucléaire (AJOUTÉ ICI)
    const dataNuc = [
        { year: 1969, t: "St-Laurent A1", h: "Fusion partielle (INES 4).", d: "Erreur de chargement entraînant la fusion de 50kg d'uranium.", i: "Contamination interne.", img: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/39/A1_A2_saint_laurent_FK.jpg/500px-A1_A2_saint_laurent_FK.jpg" },
        { year: 1980, t: "St-Laurent A2", h: "Accident INES 4.", d: "Fusion de combustible due à la corrosion.", i: "Arrêt définitif filière.", img: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f9/HD.15.076_%2811840243393%29.jpg/500px-HD.15.076_%2811840243393%29.jpg" },
        { year: 1999, t: "Le Blayais", h: "Inondation centrale.", d: "Tempête Martin : submersion partielle et perte de systèmes de sûreté.", i: "Arrêt d'urgence.", img: "https://media.sudouest.fr/9775433/1200x-1/so-57ecd02466a4bdbe429d2579-ph0.jpg" },
        { year: 2008, t: "Tricastin", h: "Fuite uranium.", d: "Déversement accidentel de 74kg d'uranium dans les rivières.", i: "Interdiction consommation eau.", img: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/65/Site_nucl%C3%A9aire_Tricastin.jpg/500px-Site_nucl%C3%A9aire_Tricastin.jpg" },
        { year: 2011, t: "Fukushima (Impact)", h: "Stress tests.", d: "Suite à la catastrophe japonaise, audit complet du parc français.", i: "Renforcement normes (ASN).", img: "https://www.connaissancedesenergies.org/sites/connaissancedesenergies.org/files/styles/image_370px_large/public/image_article/Fukushima-Daiichi-FP.jpg" }
    ];

    // Choix des données selon le type cliqué
    const data = (type === 'mouvement') ? dataMouv : dataNuc;
    
    // Récupération des éléments HTML
    const container = document.getElementById('events-list');
    const progressBar = document.getElementById('progress-' + type); // Attention ici
    const specificProgressBar = document.querySelector('.timeline-progress'); // Sélecteur générique au cas où

    // Configuration couleur ligne de fond
    const line = document.querySelector('.timeline-line');
    if(line) line.style.backgroundColor = '#ddd'; // Couleur neutre ou color + '44'

    // Génération des points (HTML)
    container.innerHTML = data.map((ev, i) => {
        let leftPos = (i / (data.length - 1)) * 100;
        let posClass = (i % 2 === 0) ? 'above' : 'below';
        
        return `
            <div class="event-marker" style="left:${leftPos}%" data-pos="${posClass}" onclick="updateTimeline(${i}, '${type}', '${color}')">
                <div class="event-dot" style="border-color:${color}"></div>
                <div class="event-date" style="color:${color}">${ev.year}</div>
            </div>
        `;
    }).join('');

    // Sauvegarde temporaire pour la fonction updateTimeline
    window.timelineData = data;
    
    // Activer le premier point par défaut
    updateTimeline(0, type, color);
}

function setupTimeline(data, suffix) {
    const container = document.getElementById('events-list');
    if(!container) return;

    const progress = document.getElementById('timeline-progress');
    const total = data.length - 1;

    container.innerHTML = data.map((ev, i) => {
        let pos = (i / total) * 100;
        let side = i % 2 === 0 ? 'above' : 'below'; 
        return `<div class="event-marker" style="left:${pos}%" data-pos="${side}" onclick="updateFocus(${i}, '${suffix}')">
                    <div class="event-dot" style="background-color: var(--color-dot-inactive-${suffix});"></div>
                    <div class="event-date">${ev.year}</div>
                </div>`;
    }).join('');

    window.updateFocus = function(index, sfx) {
        const ev = data[index];
        document.querySelectorAll('.event-marker').forEach(el => {
            el.classList.remove('active');
            el.querySelector('.event-dot').style.backgroundColor = `var(--color-dot-inactive-${sfx})`;
            el.querySelector('.event-date').style.color = "#888";
            el.querySelector('.event-date').style.fontWeight = "normal";
        });

        const activeMarker = document.querySelectorAll('.event-marker')[index];
        activeMarker.classList.add('active');
        activeMarker.querySelector('.event-dot').style.backgroundColor = `var(--color-active-${sfx})`;
        activeMarker.querySelector('.event-date').style.color = `var(--color-active-${sfx})`;
        activeMarker.querySelector('.event-date').style.fontWeight = "bold";

        if(progress) progress.style.width = ((index / total) * 100) + "%";

        document.getElementById('detail-title').innerText = ev.title;
        document.getElementById('detail-year').innerText = ev.year;
        
        if(document.getElementById('detail-type')) document.getElementById('detail-type').innerText = ev.type || '';
        if(document.getElementById('detail-ines')) document.getElementById('detail-ines').innerText = ev.ines || '';

        document.getElementById('detail-headline').innerText = ev.headline;
        document.getElementById('detail-description').innerText = ev.description;
        document.getElementById('detail-impact').innerText = ev.impact;
        document.getElementById('detail-zone').innerText = ev.zone;

        const imgContainer = document.getElementById('details-image-container');
        imgContainer.innerHTML = `<img src="${ev.imageUrl}" onerror="this.src='https://via.placeholder.com/400x300?text=Pas+d+image'" style="width:100%; height:100%; object-fit:cover;">`;
    };

    window.updateFocus(0, suffix);
}

// --- 6. LEAFLET ET UTILS ---
function toggleLayer(type, color) {
    if(!map) return;
    const btn = document.getElementById('btn-' + type);
    if(!btn) return;
    // Nettoyage rapide des boutons
    document.querySelectorAll('.risk-toggle').forEach(b => {
        b.classList.remove('active');
        b.querySelector('.chk-box').style.backgroundColor = 'transparent';
    });
    
    if (activeLayers[type]) {
        map.removeLayer(activeLayers[type]);
        delete activeLayers[type];
    } else {
        resetMap(); // On n'affiche qu'un calque à la fois pour simplifier
        var lg = L.layerGroup();
        (mapData[type]||[]).forEach(d => {
            L.circle(d.loc, {color: color, fillColor:color, fillOpacity:0.4, radius: d.r}).bindPopup(type).addTo(lg);
        });
        lg.addTo(map);
        activeLayers[type] = lg;
        btn.classList.add('active');
        btn.querySelector('.chk-box').style.backgroundColor = color;
    }
}

function resetMap() {
    if(!map) return;
    for (let key in activeLayers) {
        map.removeLayer(activeLayers[key]);
    }
    activeLayers = {};
    document.querySelectorAll('.risk-toggle').forEach(b => {
        b.classList.remove('active');
        b.querySelector('.chk-box').style.backgroundColor = 'transparent';
    });
}

function toggleInfoPanel(show) {
    const panel = document.getElementById('info-panel');
    const btn = document.getElementById('info-toggle');
    if(show) {
        panel.classList.remove('closed');
        if(btn) btn.classList.remove('visible');
    } else {
        panel.classList.add('closed');
        if(btn) btn.classList.add('visible');
    }
}

document.addEventListener('DOMContentLoaded', function() {
    if(document.getElementById('map')) {
        map = L.map('map').setView([46.603354, 1.888334], 6);
        L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png').addTo(map);
    }
});