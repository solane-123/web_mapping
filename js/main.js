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
// --- REMPLACE TA FONCTION openDetail PAR CELLE-CI ---
function openDetail(key) {
    const d = detailsContent[key];
    if(!d) return;

    // 1. On crée le Header (commun à toutes les pages)
    let html = `
        <div class="detail-header" style="background:${d.color}; padding: 15px 40px; color: white; display:flex; justify-content:space-between; align-items:center;">
            <div>
                <div style="font-size: 2rem; display:inline-block; margin-right:10px;"><i class="fa-solid ${d.icon}"></i></div>
                <h1 style="margin:0; display:inline-block;">${d.title}</h1>
            </div>
            <button class="back-btn" onclick="switchView('grid')" style="color:${d.color}; background:white; border:none; padding:8px 16px; border-radius:20px; font-weight:bold; cursor:pointer;">
                <i class="fa-solid fa-arrow-left"></i> Retour
            </button>
        </div>`;

    // 2. LOGIQUE : SI C'EST INONDATION, ON CHANGE L'AFFICHAGE
    if(key === 'inondation') {
        // --- LAYOUT SPECIAL AVEC CARTE A GAUCHE ---
        html += `
            <div class="split-layout">
                <div class="left-map-area"><div id="detail-map-canvas"></div></div>
                <div class="right-info-area">
                    <h2 style="color:#333; margin-top:0;">Statistiques</h2>
                    <div style="height:250px; margin-bottom:20px;">
                        <canvas id="riskChart"></canvas>
                    </div>
                    <h2 style="color:#333;">Chronologie</h2>
                    <div class="timeline-container" style="border-left: 3px solid #eee; margin-left: 10px;">
                        ${d.timeline.map((t, i) => `<div class="timeline-item" style="margin-bottom: 20px; padding-left: 20px; position: relative;"><div style="position: absolute; left: -9px; top: 0; width: 15px; height: 15px; background: ${d.color}; border-radius: 50%;"></div><span style="font-weight:bold; color:${d.color}">${t.year}</span> <div style="font-weight:bold;">${t.t}</div></div>`).join('')}
                    </div>
                </div>
            </div>`;
    } else {
        // --- LAYOUT STANDARD (POUR LES AUTRES RISQUES) ---
        html += `
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
                ${d.chartData ? `<div style="margin-top: 50px; padding-top: 30px; border-top: 1px solid #eee;"><h2 style="color:#333;">Statistiques</h2><div style="background:white; padding:20px; border-radius:10px;"><canvas id="riskChart"></canvas></div></div>` : ''}
            </div>`;
    }

    // 3. On injecte le HTML
    document.getElementById('view-detail').innerHTML = html;
    switchView('detail');

    // 4. Si c'est inondation, on lance la carte spéciale
    if(key === 'inondation') { 
        setTimeout(initInondationMap, 100); // Petit délai pour que la div soit créée
    }
    
    // 5. On crée le graphique si besoin
    if (d.chartData) {
        const ctx = document.getElementById('riskChart');
        if(ctx) {
            if (currentChart) currentChart.destroy();
            currentChart = new Chart(ctx, { type: d.chartType, data: { labels: d.chartLabels, datasets: [{ label: d.chartTitle, data: d.chartData, backgroundColor: d.color, borderColor: d.color, borderWidth:1 }] }, options: { responsive: true, maintainAspectRatio: false } });
        }
    }
}

// --- AJOUTE CETTE NOUVELLE FONCTION JUSTE APRES openDetail ---
function initInondationMap() {
    if(detailMap) { detailMap.remove(); detailMap = null; }

    // Configuration Carte Inondation
    var basemapSat = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', { attribution: 'Tiles &copy; Esri' });
    var basemapGris = L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', { attribution: '&copy; CARTO' });

    detailMap = L.map('detail-map-canvas', {
        center: [46.6, 2.5],
        zoom: 6,
        layers: [basemapGris] 
    });

    L.control.scale({ position: 'bottomleft', metric: true, imperial: false }).addTo(detailMap);

    // Titre sur la carte
    var titleDiv = document.createElement('div');
    titleDiv.className = 'map-title-overlay';
    titleDiv.innerHTML = "<h1>Unités urbaines et risque d'inondation</h1><p>Comparaison 1999 - 2017</p>";
    titleDiv.style.position = 'absolute'; titleDiv.style.top = '10px'; titleDiv.style.left = '50%'; titleDiv.style.transform = 'translateX(-50%)';
    document.getElementById('detail-map-canvas').appendChild(titleDiv);

    // Fonctions internes pour le style
    function getColor(d) { return d > 0.5 ? '#800026' : d > 0.25 ? '#BD0026' : d > 0.15 ? '#E31A1C' : d > 0.1 ? '#FC4E2A' : d > 0.05 ? '#FD8D3C' : d > 0.02 ? '#FEB24C' : d > 0 ? '#FFEDA0' : '#CCCCCC'; }
    function style(feature) { return { fillColor: getColor(feature.properties.PCT_EXPO), weight: 0.5, opacity: 1, color: 'black', fillOpacity: 0.7 }; }
    function formatPct(val) { if (val == null) return 'N/A'; return (val * 100).toFixed(1) + '%'; }
    function filterData(feature) { return feature.properties.PCT_EXPO !== null; }

    // Info Panel (survol)
    var info = L.control();
    info.onAdd = function (map) { this._div = L.DomUtil.create('div', 'info'); this.update(); return this._div; };
    info.update = function (props) {
        this._div.innerHTML = props ? 
            '<h4>' + props.libuu2020 + ' (' + props.annee + ')</h4><b>Exposition : ' + formatPct(props.PCT_EXPO) + '</b><br>Pop ZI: ' + Math.round(props.POP_ZI).toLocaleString() 
            : '<h4>Unités Urbaines</h4>Survolez une zone';
    };
    info.addTo(detailMap);

    // Interactions
    function highlightFeature(e) { var l = e.target; l.setStyle({weight:2, color:'black', fillOpacity:0.9}); l.bringToFront(); info.update(l.feature.properties); }
    function resetHighlight(e) { e.target.setStyle(style(e.target.feature)); info.update(); }
    function onEach(feature, layer) { layer.on({ mouseover: highlightFeature, mouseout: resetHighlight }); }

    // Chargement Fetch
    Promise.all([
        fetch('inondations/cours_eau.json').then(r => r.json()),
        fetch('inondations/inondation_1999_wgs84.json').then(r => r.json()),
        fetch('inondations/inondation_2008_wgs84.json').then(r => r.json()),
        fetch('inondations/inondation_2017_wgs84.json').then(r => r.json())
    ]).then(([dEau, d99, d08, d17]) => {
        var lEau = L.geoJSON(dEau, {style:{color:'#4FC3F7', weight:1}}).addTo(detailMap);
        var l99 = L.geoJSON(d99, {style:style, onEachFeature:onEach, filter:filterData});
        var l08 = L.geoJSON(d08, {style:style, onEachFeature:onEach, filter:filterData});
        var l17 = L.geoJSON(d17, {style:style, onEachFeature:onEach, filter:filterData}).addTo(detailMap);
        
        detailMap.fitBounds(l17.getBounds());

        L.control.layers(
            { "Satellite": basemapSat, "Plan": basemapGris },
            { "1999": l99, "2008": l08, "2017": l17, "Eau": lEau },
            { collapsed: false }
        ).addTo(detailMap);
        
        // Légende
        var legend = L.control({position: 'bottomright'});
        legend.onAdd = function (map) {
            var div = L.DomUtil.create('div', 'info legend'), grades = [0, 0.02, 0.05, 0.1, 0.15, 0.25, 0.5];
            div.innerHTML = '<h4>% Pop Exposée</h4>';
            for (var i = 0; i < grades.length; i++) {
                div.innerHTML += '<i style="background:' + getColor(grades[i] + 0.001) + '; width:18px; height:18px; float:left; margin-right:8px; opacity:0.7"></i> ' + (grades[i]*100) + '%+<br>';
            }
            return div;
        };
        legend.addTo(detailMap);

    }).catch(err => console.error("Erreur chargement (Live Server requis):", err));
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