// --- DONNEES ---
const mapData = {
    'inondation': [{loc:[48.85, 2.35], r:15000}, {loc:[44.83, -0.57], r:20000}],
    'seisme': [{loc:[43.71, 7.26], r:30000}, {loc:[42.69, 2.89], r:25000}],
    'mouvement': [{loc:[45.76, 4.83], r:10000}],
    'radon': [{loc:[48.11, -1.67], r:60000}],
    'nucleaire': [{loc:[47.22, 0.17], r:50000}, {loc:[49.63, 1.62], r:50000}],
    'industriel': [{loc:[49.44, 1.09], r:15000}, {loc:[43.49, 5.37], r:5000}]
};

const detailsContent = {
    'inondation': { title: "Inondations", color: "#3A6EA5", icon: "fa-water", timeline: [{year:"1910", t:"Crue Seine"}, {year:"2010", t:"Xynthia"}] },
    'seisme': { title: "Séismes", color: "#B23A48", icon: "fa-house-crack", timeline: [{year:"1909", t:"Lambesc"}] },
    // ... (ajouter les autres pour la démo complète)
    'industriel': { title: "Industriel", color: "#6B8E23", icon: "fa-industry", timeline: [{year:"2001", t:"AZF"}] }
};

// --- MAP INIT ---
var map = L.map('map').setView([46.603354, 1.888334], 6);
L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png').addTo(map);
var activeLayers = {};

// --- LOGIQUE DE NAVIGATION (MODE NATUREL vs TECHNIQUE) ---
function openMap(mode) {
    // 1. Changer la vue
    switchView('map');

    // 2. Configurer l'interface selon le mode
    const groupNat = document.getElementById('group-naturel');
    const groupTech = document.getElementById('group-technique');
    const mapTitle = document.getElementById('map-title');
    const infoHeader = document.getElementById('info-header');
    const infoContent = document.getElementById('info-content');
    const mapDiv = document.getElementById('map');

    resetMap(); // On nettoie la carte

    if (mode === 'naturel') {
        // UI
        groupNat.style.display = 'block';
        groupTech.style.display = 'none';
        mapTitle.innerText = "Risques Naturels";
        mapDiv.style.backgroundColor = "var(--bg-naturel)"; // Fond légèrement bleu
        
        // Info Panel
        infoHeader.style.backgroundColor = "#3A6EA5";
        document.getElementById('info-title-text').innerText = "Comprendre les Risques Naturels";
        infoContent.innerHTML = `
            <p><strong>Les risques naturels</strong> sont liés aux phénomènes géologiques et climatiques. En France, ils concernent principalement :</p>
            <ul>
                <li>Les inondations (le risque le plus fréquent).</li>
                <li>Les mouvements de terrain en montagne.</li>
                <li>La sismicité dans les zones de faille.</li>
            </ul>
            <p>Utilisez les boutons à gauche pour afficher les zones concernées.</p>
        `;
        
        // Activer une couche par défaut ?
        toggleLayer('inondation', '#3A6EA5');

    } else {
        // UI
        groupNat.style.display = 'none';
        groupTech.style.display = 'block';
        mapTitle.innerText = "Risques Technologiques";
        mapDiv.style.backgroundColor = "var(--bg-techno)"; // Fond gris

        // Info Panel
        infoHeader.style.backgroundColor = "#5A5A5A";
        document.getElementById('info-title-text').innerText = "Comprendre les Risques Techniques";
        infoContent.innerHTML = `
            <p><strong>Les risques technologiques</strong> sont liés à l'activité humaine et industrielle.</p>
            <p>Ils incluent les sites industriels classés <strong>Seveso</strong> (stockage de produits dangereux) et les installations <strong>nucléaires</strong> (CNPE).</p>
            <p>Ces sites font l'objet de plans particuliers d'intervention (PPI).</p>
        `;

        // Activer une couche par défaut ?
        toggleLayer('nucleaire', '#5A5A5A');
    }
    
    // Ouvrir le panneau d'info par défaut
    toggleInfoPanel(true);
    setTimeout(() => map.invalidateSize(), 100);
}

// --- GESTION DU PANNEAU LATERAL ---
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

// --- FONCTIONS CLASSIQUES (Carte, Toggle, Views) ---
function switchView(name) {
    document.querySelectorAll('.view-section').forEach(el => el.classList.remove('visible'));
    document.querySelectorAll('.nav-btn').forEach(el => el.classList.remove('active-tab'));
    
    document.getElementById('view-' + name).classList.add('visible');
    
    // Gestion sommaire des onglets actifs
    if(name === 'grid') document.querySelectorAll('.nav-btn')[0].classList.add('active-tab');
    if(name === 'stats') document.querySelectorAll('.nav-btn')[3].classList.add('active-tab');
}

function toggleLayer(type, color) {
    const btn = document.getElementById('btn-' + type);
    if(!btn) return;
    const checkbox = btn.querySelector('.chk-box');
    
    if (activeLayers[type]) {
        map.removeLayer(activeLayers[type]);
        delete activeLayers[type];
        btn.classList.remove('active');
        checkbox.style.backgroundColor = 'transparent';
        checkbox.style.borderColor = '#ddd';
    } else {
        var lg = L.layerGroup();
        (mapData[type]||[]).forEach(d => {
            L.circle(d.loc, {color: color, fillColor:color, fillOpacity:0.4, radius: d.r}).bindPopup(type).addTo(lg);
        });
        lg.addTo(map);
        activeLayers[type] = lg;
        btn.classList.add('active');
        checkbox.style.backgroundColor = color;
        checkbox.style.borderColor = color;
    }
}

function resetMap() {
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

// Fonction simplifiée pour le détail (pour que le code reste court)
function openDetail(key) {
    const d = detailsContent[key] || detailsContent['inondation']; // Fallback
    const html = `
        <div class="detail-header" style="background:${d.color}">
            <button class="back-btn" onclick="switchView('grid')">Retour</button>
            <h1><i class="fa-solid ${d.icon}"></i> ${d.title}</h1>
        </div>
        <div class="timeline-container">
            ${d.timeline.map(t => `<div class="timeline-item"><span class="timeline-year">${t.year}</span> ${t.t}</div>`).join('')}
        </div>`;
    document.getElementById('view-detail').innerHTML = html;
    switchView('detail');
}

// Initialisation Chart.js (Dummy)
new Chart(document.getElementById('chartCrues'), {type:'line', data:{labels:[2010,2020], datasets:[{label:'Niveau', data:[5,8]}]}});
new Chart(document.getElementById('chartINES'), {type:'bar', data:{labels:[1,2,3], datasets:[{label:'Events', data:[10,2,1]}]}});