// --- 1. CONFIGURATION ET DONNÉES ---

// Données Géographiques (Carte)
const mapData = {
    'inondation': [{loc:[48.85, 2.35], r:15000}, {loc:[44.83, -0.57], r:20000}, {loc:[43.83, 4.36], r:10000}], 
    'seisme': [{loc:[43.71, 7.26], r:30000}, {loc:[42.69, 2.89], r:25000}, {loc:[43.09, 0.05], r:25000}], 
    'mouvement': [{loc:[45.76, 4.83], r:10000}, {loc:[44.17, 6.94], r:15000}], 
    'radon': [{loc:[48.11, -1.67], r:60000}, {loc:[45.83, 1.26], r:50000}], 
    'nucleaire': [{loc:[47.72, 1.57], r:50000}, {loc:[49.63, 1.62], r:50000}, {loc:[44.34, 4.73], r:50000}], 
    'industriel': [{loc:[49.44, 1.09], r:15000}, {loc:[43.58, 1.43], r:10000}, {loc:[43.44, 5.20], r:15000}] 
};

// Données Textuelles + Graphiques
const detailsContent = {
    'inondation': { 
        title: "Inondations", 
        color: "#3A6EA5", 
        icon: "fa-water", 
        desc: "Les inondations représentent le risque naturel le plus coûteux en France.",
        timeline: [
            {year:"1910", t:"Crue centennale de la Seine", d:"Paris inondé."},
            {year:"2010", t:"Tempête Xynthia", d:"Submersion marine, 47 morts."}
        ],
        // CONFIGURATION DU GRAPHIQUE INONDATION
        chartTitle: "Coût des Crues (Milliards €)",
        chartType: 'line',
        chartLabels: ['2010', '2015', '2020', '2023'],
        chartData: [1.2, 0.8, 1.5, 1.1]
    },
    'seisme': { 
        title: "Risque Sismique", 
        color: "#B23A48", 
        icon: "fa-house-crack", 
        desc: "La France a une sismicité modérée, mais présente dans les Pyrénées et les Alpes.",
        timeline: [
            {year:"1909", t:"Séisme de Lambesc", d:"Le plus fort en métropole."},
            {year:"2019", t:"Séisme du Teil", d:"Dégâts majeurs (Mag 5.4)."}
        ]
        // Pas de graphique pour séisme dans cet exemple
    },
    'nucleaire': { 
        title: "Accidents Nucléaires", 
        color: "#27ae60", 
        icon: "fa-radiation", 
        desc: "Surveillance stricte des centrales nucléaires (CNPE).",
        timeline: [
            {year:"1969", t:"Saint-Laurent-des-Eaux", d:"Fusion partielle (INES 4)."},
            {year:"2008", t:"Fuite à Tricastin", d:"Rejet d'uranium."}
        ],
        // CONFIGURATION DU GRAPHIQUE NUCLEAIRE
        chartTitle: "Incidents par gravité (INES)",
        chartType: 'bar',
        chartLabels: ['INES 1', 'INES 2', 'INES 3', 'INES 4'],
        chartData: [80, 5, 1, 0]
    },
    'industriel': { 
        title: "Accidents Industriels", 
        color: "#2c3e50", 
        icon: "fa-industry", 
        desc: "Les sites Seveso présentent des risques majeurs.",
        timeline: [
            {year:"2001", t:"Explosion AZF", d:"Plus grave accident industriel."},
            {year:"2019", t:"Lubrizol Rouen", d:"Incendie et pollution."}
        ]
    },
    'mouvement': { 
        title: "Mouvements de Terrain", 
        color: "#8C6A43", 
        icon: "fa-hill-rockslide", 
        desc: "Glissements et éboulements en zone montagneuse.",
        timeline: [
            {year:"1953", t:"Harmalière", d:"Effondrement majeur en Isère."}
        ]
    },
    'radon': { 
        title: "Radon", 
        color: "#8e44ad", 
        icon: "fa-wind", 
        desc: "Gaz radioactif naturel provenant du sol.",
        timeline: [
            {year:"2018", t:"Nouveau zonage", d:"Obligation de mesure."}
        ]
    }
};

// --- 2. VARIABLES GLOBALES ---
var map;
var activeLayers = {};
var currentChart = null; // Pour pouvoir détruire le graphique précédent si besoin

// --- 3. FONCTIONS ---

function switchView(name) {
    document.querySelectorAll('.view-section').forEach(el => el.classList.remove('visible'));
    document.querySelectorAll('.nav-btn').forEach(el => el.classList.remove('active-tab'));
    
    const view = document.getElementById('view-' + name);
    if(view) view.classList.add('visible');
    
    // Onglet Actif
    if(name === 'grid') document.querySelectorAll('.nav-btn')[0].classList.add('active-tab');
    if(name === 'map') document.querySelectorAll('.nav-btn')[1].classList.add('active-tab');
}

function openMap(mode) {
    switchView('map');
    
    // Récupération des éléments
    const groupNat = document.getElementById('group-naturel');
    const groupTech = document.getElementById('group-technique');
    const mapTitle = document.getElementById('map-title');
    const infoHeader = document.getElementById('info-header');
    const infoContent = document.getElementById('info-content');
    const mapDiv = document.getElementById('map');

    resetMap(); // Nettoyer

    if (mode === 'naturel') {
        groupNat.style.display = 'block';
        groupTech.style.display = 'none';
        mapTitle.innerText = "Risques Naturels";
        mapDiv.style.borderTop = "5px solid #3A6EA5";
        infoHeader.style.backgroundColor = "#3A6EA5";
        document.getElementById('info-title-text').innerText = "Info Naturel";
        infoContent.innerHTML = "<p>Visualisation des aléas naturels (Inondations, Séismes...). Cliquez sur les calques à gauche.</p>";
        toggleLayer('inondation', '#3A6EA5'); 
    } else {
        groupNat.style.display = 'none';
        groupTech.style.display = 'block';
        mapTitle.innerText = "Risques Technologiques";
        mapDiv.style.borderTop = "5px solid #5A5A5A";
        infoHeader.style.backgroundColor = "#5A5A5A";
        document.getElementById('info-title-text').innerText = "Info Technique";
        infoContent.innerHTML = "<p>Sites SEVESO et Centrales Nucléaires. Cliquez sur les calques à gauche.</p>";
        toggleLayer('nucleaire', '#5A5A5A');
    }
    
    toggleInfoPanel(true);
    setTimeout(() => { if(map) map.invalidateSize(); }, 200);
}

function openDetail(key) {
    const d = detailsContent[key];
    if(!d) return;

    // 1. Construire le HTML de la page (En-tête + Frise)
    let html = `
        <div class="detail-header" style="background:${d.color}; padding: 40px; color: white;">
            <button class="back-btn" onclick="switchView('grid')" style="margin-bottom:20px; color:${d.color}; background:white; border:none; padding:8px 16px; border-radius:20px; font-weight:bold; cursor:pointer;">
                <i class="fa-solid fa-arrow-left"></i> Retour
            </button>
            <div style="font-size: 3rem; margin-bottom: 10px;"><i class="fa-solid ${d.icon}"></i></div>
            <h1 style="margin:0;">${d.title}</h1>
            <p style="margin-top:10px; font-size:1.1rem;">${d.desc}</p>
        </div>

        <div style="padding: 40px; max-width: 800px; margin: 0 auto;">
            <h2 style="color:#333;">Chronologie</h2>
            <div class="timeline-container" style="border-left: 3px solid #eee; margin-left: 15px;">
                ${d.timeline.map((t, i) => `
                    <div class="timeline-item" style="margin-bottom: 30px; padding-left: 30px; position: relative;">
                        <div style="position: absolute; left: -14px; top: 0; width: 25px; height: 25px; background: ${d.color}; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; border: 3px solid white;">${i+1}</div>
                        <span style="background:${d.color}; color:white; padding:3px 8px; border-radius:4px; font-size:0.85rem; font-weight:bold;">${t.year}</span>
                        <h3 style="margin: 5px 0; color:#2c3e50;">${t.t}</h3>
                        <p style="margin:0; color:#666;">${t.d}</p>
                    </div>
                `).join('')}
            </div>
    `;

    // 2. Ajouter la section Graphique SI des données existent pour ce risque
    if (d.chartData) {
        html += `
            <div style="margin-top: 50px; padding-top: 30px; border-top: 1px solid #eee;">
                <h2 style="color:#333;">Statistiques : ${d.chartTitle}</h2>
                <div style="background:white; padding:20px; border-radius:10px; box-shadow:0 2px 10px rgba(0,0,0,0.05);">
                    <canvas id="riskChart"></canvas>
                </div>
            </div>
        `;
    }

    html += `</div>`; // Fin du conteneur principal

    // 3. Insérer le HTML
    document.getElementById('view-detail').innerHTML = html;
    switchView('detail');
    window.scrollTo(0,0);

    // 4. Créer le graphique Chart.js si nécessaire
    if (d.chartData) {
        const ctx = document.getElementById('riskChart');
        if (currentChart) { currentChart.destroy(); } // Détruire l'ancien graph s'il existe

        currentChart = new Chart(ctx, {
            type: d.chartType,
            data: {
                labels: d.chartLabels,
                datasets: [{
                    label: d.chartTitle,
                    data: d.chartData,
                    backgroundColor: d.color,
                    borderColor: d.color,
                    borderWidth: 1,
                    tension: 0.3 // Courbe arrondie si c'est une ligne
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: { beginAtZero: true }
                }
            }
        });
    }
}

// --- Fonctions Carte (inchangées mais nécessaires) ---
function toggleLayer(type, color) {
    if(!map) return;
    const btn = document.getElementById('btn-' + type);
    if(!btn) return;
    const chk = btn.querySelector('.chk-box');
    
    if (activeLayers[type]) {
        map.removeLayer(activeLayers[type]);
        delete activeLayers[type];
        btn.classList.remove('active');
        chk.style.backgroundColor = 'transparent';
        chk.style.borderColor = '#ddd';
    } else {
        var lg = L.layerGroup();
        (mapData[type]||[]).forEach(d => {
            L.circle(d.loc, {color: color, fillColor:color, fillOpacity:0.4, radius: d.r}).bindPopup(type).addTo(lg);
        });
        lg.addTo(map);
        activeLayers[type] = lg;
        btn.classList.add('active');
        chk.style.backgroundColor = color;
        chk.style.borderColor = color;
    }
}

function resetMap() {
    if(!map) return;
    for (let key in activeLayers) {
        map.removeLayer(activeLayers[key]);
        const btn = document.getElementById('btn-' + key);
        if(btn) {
            btn.classList.remove('active');
            btn.querySelector('.chk-box').style.backgroundColor = 'transparent';
        }
    }
    activeLayers = {};
}

function toggleInfoPanel(show) {
    const panel = document.getElementById('info-panel');
    const btn = document.getElementById('info-toggle');
    if(show) {
        panel.classList.remove('closed');
        btn.classList.remove('visible');
    } else {
        panel.classList.add('closed');
        btn.classList.add('visible');
    }
}

// --- Initialisation ---
document.addEventListener('DOMContentLoaded', function() {
    if(document.getElementById('map')) {
        map = L.map('map').setView([46.603354, 1.888334], 6);
        L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png').addTo(map);
    }
});