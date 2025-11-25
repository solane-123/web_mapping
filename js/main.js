// --- 1. DONNÉES ET CONTENU (TEXTES DE LA VIDÉO) ---
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
        title: "Inondations", 
        color: "#3A6EA5", 
        icon: "fa-water", 
        desc: "Les inondations représentent le risque naturel le plus coûteux en France, touchant des milliers de communes.",
        timeline: [
            {year:"1910", t:"Crue centennale de la Seine", d:"Paris inondé, référence pour les scénarios actuels."},
            {year:"1930", t:"Crue du Tarn", d:"L'une des plus meurtrières (environ 200 morts)."},
            {year:"1988", t:"Inondations de Nîmes", d:"Pluies torrentielles, 9 morts."},
            {year:"2010", t:"Tempête Xynthia", d:"Submersion marine sur la côte atlantique (47 morts)."},
            {year:"2020", t:"Tempête Alex", d:"Villages détruits dans les Alpes-Maritimes."}
        ] 
    },
    'seisme': { 
        title: "Risque Sismique", 
        color: "#B23A48", 
        icon: "fa-house-crack", 
        desc: "La France a une sismicité modérée, mais les Pyrénées, les Alpes et le Rhin sont exposés.",
        timeline: [
            {year:"1909", t:"Séisme de Lambesc", d:"Le plus fort en métropole (Mag ~6, 46 morts)."},
            {year:"1967", t:"Séisme d'Arette", d:"Village des Pyrénées détruit à 80%."},
            {year:"2019", t:"Séisme du Teil (Ardèche)", d:"Dégâts majeurs sur les bâtiments (Mag 5.4)."}
        ] 
    },
    'mouvement': { 
        title: "Mouvements de Terrain", 
        color: "#8C6A43", 
        icon: "fa-hill-rockslide", 
        desc: "Glissements et éboulements en zone montagneuse.",
        timeline: [
            {year:"1953", t:"Éboulement de l'Harmalière", d:"Effondrement majeur en Isère."},
            {year:"1970", t:"La Clapière", d:"Glissement massif toujours actif."}
        ] 
    },
    'industriel': { 
        title: "Accidents Industriels", 
        color: "#2c3e50", 
        icon: "fa-industry", 
        desc: "Les sites Seveso présentent des risques majeurs.",
        timeline: [
            {year:"1976", t:"Directive Seveso", d:"Suite à l'accident en Italie."},
            {year:"2001", t:"Explosion AZF à Toulouse", d:"31 morts, 2500 blessés. Plus grave accident industriel."},
            {year:"2019", t:"Incendie Lubrizol (Rouen)", d:"Nuage de fumée noire géant, pollution."}
        ] 
    },
    'nucleaire': { 
        title: "Accidents Nucléaires", 
        color: "#27ae60", 
        icon: "fa-radiation", 
        desc: "Surveillance stricte des centrales nucléaires (CNPE).",
        timeline: [
            {year:"1969", t:"Saint-Laurent-des-Eaux", d:"Fusion partielle (INES 4)."},
            {year:"2008", t:"Fuite à Tricastin", d:"Rejet d'uranium, incident médiatisé."}
        ] 
    },
    'radon': { 
        title: "Radon", 
        color: "#8e44ad", 
        icon: "fa-wind", 
        desc: "Gaz radioactif naturel provenant du sol granitique.",
        timeline: [
            {year:"1999", t:"Premier zonage officiel", d:"Cartographie du risque."},
            {year:"2018", t:"Nouveau zonage", d:"Obligation de mesure dans les lieux publics."}
        ] 
    }
};

// --- 2. VARIABLES GLOBALES ---
var map;
var activeLayers = {};

// --- 3. FONCTIONS GLOBALES (IMPORTANT POUR LES BOUTONS HTML) ---

function switchView(name) {
    // Cache tout
    document.querySelectorAll('.view-section').forEach(el => el.classList.remove('visible'));
    document.querySelectorAll('.nav-btn').forEach(el => el.classList.remove('active-tab'));
    
    // Affiche la bonne vue
    const view = document.getElementById('view-' + name);
    if(view) view.classList.add('visible');
    
    // Gère les boutons du menu haut
    if(name === 'grid') document.querySelectorAll('.nav-btn')[0].classList.add('active-tab');
    if(name === 'stats') document.querySelectorAll('.nav-btn')[3].classList.add('active-tab');
}

function openMap(mode) {
    switchView('map');

    const groupNat = document.getElementById('group-naturel');
    const groupTech = document.getElementById('group-technique');
    const mapTitle = document.getElementById('map-title');
    const infoHeader = document.getElementById('info-header');
    const infoContent = document.getElementById('info-content');
    const mapDiv = document.getElementById('map');

    resetMap(); // Nettoie la carte

    if (mode === 'naturel') {
        groupNat.style.display = 'block';
        groupTech.style.display = 'none';
        mapTitle.innerText = "Risques Naturels";
        mapDiv.style.borderTop = "5px solid #3A6EA5";
        infoHeader.style.backgroundColor = "#3A6EA5";
        document.getElementById('info-title-text').innerText = "Info Naturel";
        infoContent.innerHTML = "<p>Visualisation des aléas naturels (Inondations, Séismes...).</p>";
        toggleLayer('inondation', '#3A6EA5'); // Active un calque par défaut
    } else {
        groupNat.style.display = 'none';
        groupTech.style.display = 'block';
        mapTitle.innerText = "Risques Technologiques";
        mapDiv.style.borderTop = "5px solid #5A5A5A";
        infoHeader.style.backgroundColor = "#5A5A5A";
        document.getElementById('info-title-text').innerText = "Info Technique";
        infoContent.innerHTML = "<p>Sites SEVESO et Centrales Nucléaires.</p>";
        toggleLayer('nucleaire', '#5A5A5A');
    }
    
    toggleInfoPanel(true);
    setTimeout(() => { if(map) map.invalidateSize(); }, 200);
}

function openDetail(key) {
    const d = detailsContent[key];
    if(!d) return;

    const html = `
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
        </div>`;
    
    document.getElementById('view-detail').innerHTML = html;
    switchView('detail');
    window.scrollTo(0,0);
}

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

// --- 4. INITIALISATION (QUAND LA PAGE EST PRÊTE) ---
document.addEventListener('DOMContentLoaded', function() {
    
    // Initialise la carte si la div existe
    if(document.getElementById('map')) {
        map = L.map('map').setView([46.603354, 1.888334], 6);
        L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png').addTo(map);
    }

    // Initialise les graphiques si les canvas existent
    if(document.getElementById('chartCrues')) {
        new Chart(document.getElementById('chartCrues'), {
            type: 'line', 
            data: {labels: ['2010', '2015', '2020', '2023'], datasets: [{label: 'Coût (Mrd €)', data: [1.2, 0.8, 1.5, 1.1], borderColor: '#3A6EA5', tension: 0.3}]}
        });
        new Chart(document.getElementById('chartINES'), {
            type: 'bar', 
            data: {labels: ['INES 1', 'INES 2', 'INES 3', 'INES 4+'], datasets: [{label: 'Incidents récents', data: [80, 5, 0, 0], backgroundColor: '#27ae60'}]}
        });
    }
});