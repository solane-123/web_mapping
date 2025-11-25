/* --- CONFIGURATION DES DONNÉES --- */
const CONFIG = {
    colors: {
        inondation: '#3A6EA5', seisme: '#B23A48', mouvement: '#8C6A43',
        nucleaire: '#5A5A5A', industriel: '#6B8E23', radon: '#6A4C93'
    },
    // Définition des icônes personnalisées avec tes images
    icons: {
        edf: L.icon({
            iconUrl: 'assets/icon-edf.png', // Chemin vers ton image EDF
            iconSize: [40, 50], // Taille de l'icône
            iconAnchor: [20, 50], // Point d'ancrage (bas de l'icône)
            popupAnchor: [0, -50]
        }),
        sevesoHaut: L.icon({
            iconUrl: 'assets/icon-seveso-haut.png', // Image Seveso Rouge
            iconSize: [40, 40],
            iconAnchor: [20, 20],
            popupAnchor: [0, -20]
        }),
        sevesoBas: L.icon({
            iconUrl: 'assets/icon-seveso-bas.png', // Image Seveso Vert
            iconSize: [30, 30],
            iconAnchor: [15, 15],
            popupAnchor: [0, -15]
        })
    }
};

// Données Géographiques
const mapData = {
    'inondation': [{loc:[48.85, 2.35], r:15000}, {loc:[44.83, -0.57], r:20000}],
    'seisme': [{loc:[43.71, 7.26], r:30000}, {loc:[42.69, 2.89], r:25000}],
    'mouvement': [{loc:[45.76, 4.83], r:10000}],
    // Utilisation du type spécial pour Nucléaire et Industriel
    'nucleaire': [
        {loc:[47.22, 0.17], type: 'edf', name: "Centrale de Chinon"}, 
        {loc:[49.63, 1.62], type: 'edf', name: "Centrale de Penly"}
    ],
    'industriel': [
        {loc:[49.44, 1.09], type: 'sevesoHaut', name: "Usine Chimique (Haut)"},
        {loc:[43.49, 5.37], type: 'sevesoBas', name: "Dépôt (Bas)"}
    ]
};

const detailsContent = {
    'inondation': { title: "Inondations", color: CONFIG.colors.inondation, timeline: [{year:"1910", t:"Crue Seine"}, {year:"2010", t:"Xynthia"}] },
    'seisme': { title: "Séismes", color: CONFIG.colors.seisme, timeline: [{year:"1909", t:"Lambesc"}] },
    'industriel': { title: "Industriel", color: CONFIG.colors.industriel, timeline: [{year:"2001", t:"AZF Toulouse"}] },
    'nucleaire': { title: "Nucléaire", color: CONFIG.colors.nucleaire, timeline: [{year:"1980", t:"St Laurent des Eaux"}] },
    'mouvement': { title: "Mouvements", color: CONFIG.colors.mouvement, timeline: [{year:"1970", t:"La Clapière"}] }
};

/* --- LOGIQUE DE L'APPLICATION --- */
const app = {
    map: null,
    activeLayers: {},
    currentMode: null, // 'naturel' ou 'technique'

    init: function() {
        // Initialiser la carte
        this.map = L.map('map').setView([46.603354, 1.888334], 6);
        L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png').addTo(this.map);

        // Initialiser la navigation
        document.querySelectorAll('.nav-btn[data-target]').forEach(btn => {
            btn.addEventListener('click', (e) => this.switchView(e.target.dataset.target, e.target));
        });

        // Initialiser les graphiques
        this.initCharts();
    },

    switchView: function(viewName, btnElement) {
        document.querySelectorAll('.view-section').forEach(el => el.classList.remove('visible'));
        document.getElementById('view-' + viewName).classList.add('visible');
        
        // Gérer les onglets actifs
        if(btnElement) {
            document.querySelectorAll('.nav-btn').forEach(el => el.classList.remove('active-tab'));
            btnElement.classList.add('active-tab');
        }
    },

    // Mode: 'naturel' ou 'technique'
    openMap: function(mode) {
        this.currentMode = mode;
        this.switchView('map'); // Pas de bouton actif spécifique
        this.resetMap();
        
        const controlsContainer = document.getElementById('controls-container');
        const mapTitle = document.getElementById('map-title');
        const mapDiv = document.getElementById('map');
        const infoHeader = document.getElementById('info-header');
        
        controlsContainer.innerHTML = ''; // Vider les contrôles

        let layersToShow = [];
        let infoText = "";
        let themeColor = "";

        if (mode === 'naturel') {
            mapTitle.innerText = "Risques Naturels";
            themeColor = CONFIG.colors.inondation;
            mapDiv.style.backgroundColor = "#eef4fa";
            infoText = "<p>Les risques naturels incluent inondations, séismes et mouvements de terrain.</p>";
            layersToShow = [
                {id: 'inondation', label: 'Inondations', color: CONFIG.colors.inondation},
                {id: 'seisme', label: 'Séismes', color: CONFIG.colors.seisme},
                {id: 'mouvement', label: 'Mouvements', color: CONFIG.colors.mouvement}
            ];
        } else {
            mapTitle.innerText = "Risques Techniques";
            themeColor = CONFIG.colors.nucleaire;
            mapDiv.style.backgroundColor = "#e8e8e8";
            infoText = "<p>Les risques technologiques incluent les sites <strong>Seveso</strong> et les centrales <strong>Nucléaires (EDF)</strong>.</p>";
            layersToShow = [
                {id: 'nucleaire', label: 'Nucléaire', color: CONFIG.colors.nucleaire},
                {id: 'industriel', label: 'Industriel', color: CONFIG.colors.industriel}
            ];
        }

        // Configuration du Panneau Info
        infoHeader.style.backgroundColor = themeColor;
        document.getElementById('info-content').innerHTML = infoText;
        this.toggleInfoPanel(true);

        // Génération des boutons
        layersToShow.forEach(layer => {
            const div = document.createElement('div');
            div.className = 'risk-toggle';
            div.id = 'btn-' + layer.id;
            div.onclick = () => this.toggleLayer(layer.id, layer.color);
            div.innerHTML = `<div class="chk-box"></div> ${layer.label}`;
            controlsContainer.appendChild(div);
        });

        // Activer la première couche par défaut
        if(layersToShow.length > 0) this.toggleLayer(layersToShow[0].id, layersToShow[0].color);
        
        setTimeout(() => this.map.invalidateSize(), 100);
    },

    toggleLayer: function(type, color) {
        const btn = document.getElementById('btn-' + type);
        const checkbox = btn.querySelector('.chk-box');
        
        if (this.activeLayers[type]) {
            this.map.removeLayer(this.activeLayers[type]);
            delete this.activeLayers[type];
            btn.classList.remove('active');
            checkbox.style.backgroundColor = 'transparent';
            checkbox.style.borderColor = '#ddd';
        } else {
            var layerGroup = L.layerGroup();
            const dataPoints = mapData[type] || [];

            dataPoints.forEach(d => {
                if(d.type && CONFIG.icons[d.type]) {
                    // Si c'est un point spécial (EDF / Seveso) avec une icône image
                    L.marker(d.loc, {icon: CONFIG.icons[d.type]})
                     .bindPopup(`<b>${d.name}</b>`)
                     .addTo(layerGroup);
                } else {
                    // Si c'est un point classique (Cercle couleur)
                    L.circle(d.loc, {color: color, fillColor:color, fillOpacity:0.4, radius: d.r})
                     .bindPopup(type)
                     .addTo(layerGroup);
                }
            });

            layerGroup.addTo(this.map);
            this.activeLayers[type] = layerGroup;
            btn.classList.add('active');
            checkbox.style.backgroundColor = color;
            checkbox.style.borderColor = color;
        }
    },

    resetMap: function() {
        for (let key in this.activeLayers) {
            this.map.removeLayer(this.activeLayers[key]);
        }
        this.activeLayers = {};
        document.querySelectorAll('.risk-toggle').forEach(el => {
            el.classList.remove('active');
            el.querySelector('.chk-box').style.backgroundColor = 'transparent';
        });
    },

    toggleInfoPanel: function(show) {
        const panel = document.getElementById('info-panel');
        const btn = document.getElementById('info-toggle');
        if(show) {
            panel.classList.remove('closed');
            btn.classList.remove('visible');
        } else {
            panel.classList.add('closed');
            btn.classList.add('visible');
        }
    },

    openDetail: function(key) {
        const d = detailsContent[key] || detailsContent['inondation'];
        const html = `
            <div class="detail-header" style="background:${d.color}">
                <button class="back-btn" onclick="app.switchView('grid')">Retour</button>
                <h1>${d.title}</h1>
            </div>
            <div class="timeline-container">
                ${d.timeline.map(t => `<div class="timeline-item"><span class="timeline-year">${t.year}</span> ${t.t}</div>`).join('')}
            </div>`;
        document.getElementById('view-detail').innerHTML = html;
        this.switchView('detail');
    },

    initCharts: function() {
        new Chart(document.getElementById('chartCrues'), {
            type:'line', 
            data:{labels:[1910, 1950, 2000, 2020], datasets:[{label:'Niveau', data:[8.6, 6.1, 5.2, 4.5], borderColor:'#3A6EA5', fill:true}]}
        });
        new Chart(document.getElementById('chartINES'), {
            type:'bar', 
            data:{labels:[0,1,2,3,4], datasets:[{label:'Incidents', data:[120, 45, 12, 3, 0], backgroundColor:'#5A5A5A'}]}
        });
    }
};

// Démarrage de l'application
document.addEventListener('DOMContentLoaded', () => {
    app.init();
});