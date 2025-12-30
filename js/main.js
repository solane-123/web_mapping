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
    'inondation': { 
        title: "Inondations", color: "#3A6EA5", icon: "fa-water", 
        desc: "Carte des risques d'inondation.",
    },
    'industriel': { 
        title: "Risques Technologiques", color: "#414345", icon: "fa-industry", 
        desc: "Cartographie globale des risques technologiques.",
        timeline: [{year:"2001", t:"Explosion AZF", d:"Plus grave accident industriel."}, {year:"2019", t:"Incendie Lubrizol", d:"Incendie majeur."}],
        chartTitle: "Sites Seveso", chartType: 'bar', chartLabels: ['Seuil Haut', 'Seuil Bas'], chartData: [705, 607]
    },
    'mouvement': { 
        title: "Mouvements de Terrain", color: "#8C6A43", icon: "fa-hill-rockslide", 
        desc: "Glissements et éboulements."
    },
    'nucleaire': { 
        title: "Nucléaire", color: "#059669", icon: "fa-radiation", 
        desc: "Parc nucléaire français et accidents historiques." 
    },
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
        const groupNat = document.getElementById('group-naturel');
        const groupTech = document.getElementById('group-technique');
        const mapTitle = document.getElementById('map-title');
        const infoHeader = document.getElementById('info-header');
        const infoContent = document.getElementById('info-content');
        const mapDiv = document.getElementById('map');
        
        document.getElementById('external-frame-container').style.display = 'none';
        mapDiv.style.display = 'block';
        resetMap();

        if (mode === 'naturel') {
            if(groupNat) groupNat.style.display = 'block';
            if(groupTech) groupTech.style.display = 'none';
            if(mapTitle) mapTitle.innerText = "Risques Naturels";
            mapDiv.style.borderTop = "5px solid #3A6EA5";
            if(infoHeader) infoHeader.style.backgroundColor = "#3A6EA5";
            if(infoContent) infoContent.innerHTML = "<p>Visualisation des aléas naturels.</p>";
            toggleLayer('inondation', '#3A6EA5'); 
        } else {
            if(groupNat) groupNat.style.display = 'none';
            if(groupTech) groupTech.style.display = 'block';
            if(mapTitle) mapTitle.innerText = "Risques Technologiques";
            mapDiv.style.borderTop = "5px solid #5A5A5A";
            if(infoHeader) infoHeader.style.backgroundColor = "#5A5A5A";
            if(infoContent) infoContent.innerHTML = "<p>Sites SEVESO et Centrales.</p>";
            toggleLayer('nucleaire', '#5A5A5A');
        }
        toggleInfoPanel(true);
        setTimeout(() => { if(map) map.invalidateSize(); }, 200);
    } 
    else {
        const iframe = document.getElementById('main-map-frame');
        document.getElementById('external-frame-container').style.display = 'block';
        document.getElementById('map').style.display = 'none'; 
        let url = (mode === 'naturel') ? "https://clem6703.github.io/Inondation/" : "DEP_TECH-main/index.html";
        iframe.src = url + "#" + riskType;
    }
}

// --- 3. OUVERTURE MODALE (POP-UP) ---
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
        <div class="modal-body">`;

    if (key === 'inondation') {
        html += `<iframe src="https://clem6703.github.io/Inondation/" style="width:100%; flex: 1; border:none; display:block;"></iframe>`;
    } 
    else if (key === 'industriel') {
        html += `
            <div class="split-layout">
                <div class="left-map-area"><iframe src="DEP_TECH-main/index.html#industriel" style="width:100%; height:100%; border:none;"></iframe></div>
                <div class="right-info-area">
                    <h3>Statistiques Seveso</h3>
                    <div style="height:200px; margin-bottom:30px;"><canvas id="riskChart"></canvas></div>
                    <h3>Historique</h3>
                    <div style="margin-top:20px; border-left:3px solid ${d.color}; padding-left:20px;">
                        ${d.timeline.map(t => `<div class="timeline-item" style="margin-bottom:20px;"><strong style="color:${d.color}">${t.year}</strong><br><strong>${t.t}</strong><br><span style="color:#666; font-size:0.9rem;">${t.d}</span></div>`).join('')}
                    </div>
                </div>
            </div>`;
    }
    // --- CAS MOUVEMENT (Frise Marron) ---
    else if (key === 'mouvement') {
        html += generateTimelineHTML('mv');
    }
    // --- CAS NOUVEAU : NUCLEAIRE (Frise Verte) ---
    else if (key === 'nucleaire') {
        html += generateTimelineHTML('nu');
    }
    // --- AUTRES ---
    else {
        let mapTarget = (key === 'seveso') ? 'technique' : 'naturel';
        html += `
            <div style="padding:50px; text-align:center;">
                <p style="font-size:1.1rem; color:#555;">${d.desc}</p>
                <button onclick="openMap('${mapTarget}', '${key}'); closeModal();" style="margin-top:20px; background:${d.color}; color:white; border:none; padding:12px 25px; border-radius:30px; cursor:pointer; font-weight:bold;">
                    Voir sur la carte globale
                </button>
            </div>`;
    }

    html += `</div>`; // Fin body
    document.getElementById('modalContent').innerHTML = html;
    
    const modal = document.getElementById('view-detail');
    modal.style.display = 'flex';
    requestAnimationFrame(() => modal.classList.add('visible'));

    // Scripts spécifiques
    if (d.chartData && key === 'industriel') {
        setTimeout(() => {
            const ctx = document.getElementById('riskChart');
            if(ctx) {
                if (currentChart) currentChart.destroy();
                currentChart = new Chart(ctx, { type: d.chartType || 'bar', data: { labels: d.chartLabels, datasets: [{ label: d.chartTitle, data: d.chartData, backgroundColor: d.color, borderRadius: 5 }] }, options: { responsive: true, maintainAspectRatio: false } });
            }
        }, 300);
    }
    if (key === 'mouvement') setTimeout(() => initMouvementTimeline(), 100);
    if (key === 'nucleaire') setTimeout(() => initNucleaireTimeline(), 100);
}

function closeModal() {
    const modal = document.getElementById('view-detail');
    modal.classList.remove('visible');
    setTimeout(() => modal.style.display = 'none', 300);
}

// --- GENERATEUR HTML DE FRISE (Factorisé) ---
function generateTimelineHTML(suffix) {
    // suffix = 'mv' (mouvement) ou 'nu' (nucleaire)
    // On injecte les variables CSS dynamiquement via le style inline pour la ligne de fond, etc.
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
                    <p style="margin-top:15px; font-size:0.9rem; color:#888;">
                        <i class="fa-solid fa-circle-exclamation"></i> Impact : <span id="detail-impact"></span>
                    </p>
                    <p style="font-size:0.9rem; color:#888;">
                        <i class="fa-solid fa-location-dot"></i> <span id="detail-zone"></span>
                    </p>
                </div>
                <div class="details-image" id="details-image-container"></div>
            </div>
        </div>`;
}

// --- 4. FRISE MOUVEMENT ---
function initMouvementTimeline() {
    const eventsData = [
        { year: 1953, title: "Éboulement de l’Harmalière", headline: "Effondrement rocheux majeur en Isère.", description: "Le versant du Mont Saint-Eynard a connu un effondrement de plusieurs dizaines de milliers de m³.", impact: "3 morts et destructions.", type: "Éboulement", zone: "Isère", imageUrl: "https://upload.wikimedia.org/wikipedia/commons/f/f9/Eboulement_de_La_Rivi%C3%A8re_en_mars_2025.jpg" },
        { year: 1963, title: "St-Étienne-de-Tinée", headline: "Tragédie en montagne.", description: "Le village a été frappé par un important éboulement rocheux sur la rive gauche de la Tinée.", impact: "Plusieurs victimes.", type: "Chute de blocs", zone: "Alpes-Maritimes", imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3d/Glissement_de_terrain_de_la_Clapi%C3%A8re%2C_Saint-%C3%89tienne-de-Tin%C3%A9e%2C_France.jpg/1200px-Glissement_de_terrain_de_la_Clapi%C3%A8re%2C_Saint-%C3%89tienne-de-Tin%C3%A9e%2C_France.jpg" },
        { year: 1970, title: "La Clapière", headline: "Un des plus actifs d'Europe.", description: "Masse rocheuse instable de 50 millions de m³ qui s'est déplacée à des vitesses records.", impact: "Menace la vallée.", type: "Glissement actif", zone: "Alpes-Maritimes", imageUrl: "https://www.encyclopedie-environnement.org/app/uploads/2019/06/clapiere_fig6-2016.jpg" },
        { year: 1987, title: "Séchilienne", headline: "Instabilité du Mont Sec.", description: "Menace la vallée de la Romanche. Risque d'éboulement majeur pouvant créer un barrage naturel.", impact: "Surveillance 24/7.", type: "Glissement latent", zone: "Isère", imageUrl: "https://upload.wikimedia.org/wikipedia/commons/6/64/Ruines_de_S%C3%A9chilienne_le_14-07-06.jpg" },
        { year: 1992, title: "Mont Granier", headline: "Réactivation historique.", description: "Chutes de roches massives sur ce site connu pour la catastrophe de 1248.", impact: "Routes menacées.", type: "Éboulement", zone: "Savoie", imageUrl: "https://cdn-s-www.ledauphine.com/images/8D3FB866-6A0C-44BC-9390-357A240B07E7/MF_contenu/50-000-m3-de-roches-sont-tombes-au-mont-granier-hier-matin-1462609866.jpg" },
        { year: 2003, title: "La Salle-en-Beaumont", headline: "Lié aux pluies d’automne.", description: "Mouvements rapides déclenchés par des précipitations exceptionnelles.", impact: "Habitations détruites.", type: "Glissement rapide", zone: "Isère", imageUrl: "https://france3-regions.franceinfo.fr/image/Qy6yiYXL3Dh3szdO6OU20bJSzaQ/0x0:500x281/800x450/filters:format(webp)/regions/2020/06/08/5ede81e65a154_beaumont_2.jpg" },
        { year: 2020, title: "Tempête Alex", headline: "Crues et glissements.", description: "Pluies extrêmes provoquant des coulées de boue dévastatrices dans les vallées.", impact: "Destruction majeure.", type: "Coulées de boue", zone: "Alpes-Maritimes", imageUrl: "https://www.irma-grenoble.com/photos/st-martin-vesubie/361w001EP_Alpes-Maritimes-inondation_02-10-2020/361w260EP.jpg" }
    ];
    setupTimeline(eventsData, 'mv');
}

// --- 5. FRISE NUCLEAIRE ---
function initNucleaireTimeline() {
    const eventsData = [
        { year: 1969, title: "St-Laurent-des-Eaux", headline: "Le plus grave incident nucléaire français.", description: "Fusion partielle d'une dizaine d'éléments combustibles lors du chargement.", impact: "Contamination interne du réacteur A1.", ines: "Niveau 4", zone: "Loir-et-Cher", imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/39/A1_A2_saint_laurent_FK.jpg/500px-A1_A2_saint_laurent_FK.jpg" },
        { year: 1980, title: "St-Laurent (2e)", headline: "Nouveau dysfonctionnement.", description: "Fusion de combustible due à une corrosion sur le réacteur A2.", impact: "Arrêt définitif de la filière UNGG accéléré.", ines: "Niveau 4", zone: "Loir-et-Cher", imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f9/HD.15.076_%2811840243393%29.jpg/500px-HD.15.076_%2811840243393%29.jpg" },
        { year: 1981, title: "Incendie La Hague", headline: "Incendie d’un silo.", description: "Feu dans un silo de stockage de déchets solides.", impact: "Contamination radioactive localisée.", ines: "Niveau 2", zone: "Manche", imageUrl: "https://static.actu.fr/uploads/2024/12/37bfa117705766bbfa11770573fbfav.jpg" },
        { year: 1984, title: "Bugey", headline: "Panne électrique.", description: "Perte totale des alimentations électriques du centre de commande.", impact: "Arrêt forcé et amélioration des sécurités.", ines: "Niveau 2", zone: "Ain", imageUrl: "https://cdn-s-www.ledauphine.com/images/87512A6F-477B-45CE-8C9F-82BBDABCBD43/NW_raw/title-1390987973.jpg" },
        { year: 1999, title: "Blayais", headline: "Inondation de la centrale.", description: "Submersion des digues lors de la tempête Martin, perte de systèmes de sécurité.", impact: "Arrêt d'urgence, plan inondation national revu.", ines: "Niveau 2", zone: "Gironde", imageUrl: "https://media.sudouest.fr/9775433/1200x-1/so-57ecd02466a4bdbe429d2579-ph0.jpg" },
        { year: 2008, title: "Tricastin", headline: "Fuite d’uranium.", description: "Déversement de 30m³ de solution uranifère dans le sol et les rivières.", impact: "Contamination chimique, impact médiatique fort.", ines: "Niveau 1", zone: "Drôme", imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/65/Site_nucl%C3%A9aire_Tricastin.jpg/500px-Site_nucl%C3%A9aire_Tricastin.jpg" },
        { year: 2022, title: "Penly", headline: "Incendie transformateur.", description: "Feu majeur sur un équipement hors zone nucléaire.", impact: "Arrêt automatique du réacteur.", ines: "Niveau 1", zone: "Seine-Maritime", imageUrl: "https://medias.tendanceouest.com/photos/1200/419205/?v=1716879203" }
    ];
    setupTimeline(eventsData, 'nu');
}

// --- FONCTION GENERIQUE D'AFFICHAGE DE LA FRISE ---
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

    // Fonction globale interne
    window.updateFocus = function(index, sfx) {
        const ev = data[index];
        // Reset styles
        document.querySelectorAll('.event-marker').forEach(el => {
            el.classList.remove('active');
            el.querySelector('.event-dot').style.backgroundColor = `var(--color-dot-inactive-${sfx})`;
            el.querySelector('.event-date').style.color = "#888";
            el.querySelector('.event-date').style.fontWeight = "normal";
        });

        // Active style
        const activeMarker = document.querySelectorAll('.event-marker')[index];
        activeMarker.classList.add('active');
        activeMarker.querySelector('.event-dot').style.backgroundColor = `var(--color-active-${sfx})`;
        activeMarker.querySelector('.event-date').style.color = `var(--color-active-${sfx})`;
        activeMarker.querySelector('.event-date').style.fontWeight = "bold";

        if(progress) progress.style.width = ((index / total) * 100) + "%";

        document.getElementById('detail-title').innerText = ev.title;
        document.getElementById('detail-year').innerText = ev.year;
        
        // Distinction Mouvement (Type) / Nucléaire (INES)
        if(document.getElementById('detail-type')) document.getElementById('detail-type').innerText = ev.type;
        if(document.getElementById('detail-ines')) document.getElementById('detail-ines').innerText = ev.ines;

        document.getElementById('detail-headline').innerText = ev.headline;
        document.getElementById('detail-description').innerText = ev.description;
        document.getElementById('detail-impact').innerText = ev.impact;
        document.getElementById('detail-zone').innerText = ev.zone;

        const imgContainer = document.getElementById('details-image-container');
        imgContainer.innerHTML = `<img src="${ev.imageUrl}" onerror="this.src='https://via.placeholder.com/400x300?text=Pas+d+image'" style="width:100%; height:100%; object-fit:cover;">`;
    };

    window.updateFocus(0, suffix);
}

// --- 6. LEAFLET (Code inchangé) ---
function toggleLayer(type, color) {
    if(!map) return;
    const btn = document.getElementById('btn-' + type);
    if(!btn) return;
    const chk = btn.querySelector('.chk-box');
    if (activeLayers[type]) { map.removeLayer(activeLayers[type]); delete activeLayers[type]; btn.classList.remove('active'); chk.style.backgroundColor = 'transparent'; chk.style.borderColor = '#ddd'; } 
    else { var lg = L.layerGroup(); (mapData[type]||[]).forEach(d => { L.circle(d.loc, {color: color, fillColor:color, fillOpacity:0.4, radius: d.r}).bindPopup(type).addTo(lg); }); lg.addTo(map); activeLayers[type] = lg; btn.classList.add('active'); chk.style.backgroundColor = color; chk.style.borderColor = color; }
}
function resetMap() { if(!map) return; for (let key in activeLayers) { map.removeLayer(activeLayers[key]); const btn = document.getElementById('btn-' + key); if(btn) { btn.classList.remove('active'); btn.querySelector('.chk-box').style.backgroundColor = 'transparent'; } } activeLayers = {}; }
function toggleInfoPanel(show) { const panel = document.getElementById('info-panel'); const btn = document.getElementById('info-toggle'); if(show) { panel.classList.remove('closed'); btn.classList.remove('visible'); } else { panel.classList.add('closed'); btn.classList.add('visible'); } }
document.addEventListener('DOMContentLoaded', function() { if(document.getElementById('map')) { map = L.map('map').setView([46.603354, 1.888334], 6); L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png').addTo(map); } });