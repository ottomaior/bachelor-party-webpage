// Prague Leaflet map with categorised layers.
(function () {
    'use strict';

    function initPragueMap() {
        const mapContainer = document.getElementById('prague-map');
        if (!mapContainer || typeof L === 'undefined') return;

        const pragueCenter = [50.0755, 14.4378];
        const map = L.map('prague-map').setView(pragueCenter, 14);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        }).addTo(map);

        const createIcon = (color, emoji) => L.divIcon({
            className: 'custom-marker',
            html: `<div style="background:${color};width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:18px;box-shadow:0 3px 10px rgba(0,0,0,0.3);border:3px solid #f4ecd8;">${emoji}</div>`,
            iconSize: [36, 36],
            iconAnchor: [18, 18]
        });

        const accommodationLayer = L.layerGroup();
        const attractionsLayer = L.layerGroup();
        const nightlifeLayer = L.layerGroup();
        const barsLayer = L.layerGroup();
        const activitiesLayer = L.layerGroup();
        const transportLayer = L.layerGroup();
        const foodLayer = L.layerGroup();

        const dirLink = (pos) => `<a href="https://www.google.com/maps/dir/?api=1&destination=${pos[0]},${pos[1]}" target="_blank" rel="noopener" style="color:#a8483a;text-decoration:none;font-size:0.85rem;font-weight:600;">📍 Útvonal</a>`;

        // ============== ACCOMMODATION ==============
        const accommodationData = [
            { pos: [50.0875, 14.4213], name: 'Szállás', desc: 'Óváros környéke<br><em>Pontos cím később</em>' }
        ];
        accommodationData.forEach(loc => {
            L.marker(loc.pos, { icon: createIcon('#a8483a', '🏠') })
                .addTo(accommodationLayer)
                .bindPopup(`<strong>🏠 ${loc.name}</strong><br>${loc.desc}`);
        });

        // ============== ATTRACTIONS ==============
        const attractionsData = [
            { pos: [50.0865, 14.4200], name: 'Óvárosi tér', desc: 'Prága szíve, gyönyörű épületek' },
            { pos: [50.0911, 14.4002], name: 'Károly híd', desc: 'Ikonikus 14. századi híd, szobrokkal' },
            { pos: [50.0909, 14.3985], name: 'Prágai Vár', desc: 'Világ legnagyobb várkomplexuma' },
            { pos: [50.0866, 14.4207], name: 'Orloj (Csillagászati óra)', desc: 'Középkori csillagászati óra' },
            { pos: [50.0814, 14.4290], name: 'Václavské náměstí', desc: 'Vencel tér — bevásárlás & éjszakai élet' },
            { pos: [50.0839, 14.3917], name: 'Petřín-hegy', desc: 'Kilátótorony & kertek, panoráma' },
            { pos: [50.0756, 14.4141], name: 'Táncoló Ház', desc: 'Ikonikus modern építészet' },
            { pos: [50.0898, 14.4175], name: 'Zsidó negyed (Josefov)', desc: 'Történelmi zsinagógák & temető' },
            { pos: [50.0920, 14.3930], name: 'Szent Vitus-székesegyház', desc: 'Gótikus katedrális a várban' },
            { pos: [50.0885, 14.3945], name: 'Lennon Fal', desc: 'Ikonikus graffiti fal, fotó pont' },
            { pos: [50.0780, 14.4170], name: 'Nemzeti Színház', desc: 'Neorenesszánsz operaház' },
            { pos: [50.0730, 14.4190], name: 'Vyšehrad', desc: 'Ősi erőd, panorámás kilátás' },
            { pos: [50.0888, 14.4025], name: 'Malá Strana', desc: 'Bájos barokk negyed' },
            { pos: [50.0902, 14.4215], name: 'Kafka szobor', desc: 'Forgó fej szobor, modern művészet' }
        ];
        attractionsData.forEach(attr => {
            L.marker(attr.pos, { icon: createIcon('#d4a35a', '📍') })
                .addTo(attractionsLayer)
                .bindPopup(`<strong>📍 ${attr.name}</strong><br>${attr.desc}<br>${dirLink(attr.pos)}`);
        });

        // ============== NIGHTLIFE ==============
        const nightlifeData = [
            { pos: [50.0897, 14.4263], name: 'Dlouhá utca', desc: 'Fő bulinegyed, rengeteg klub & bár' },
            { pos: [50.0760, 14.4180], name: 'Karlovo náměstí környéke', desc: 'Klubok & éjszakai bárok' },
            { pos: [50.0890, 14.4250], name: 'Roxy', desc: 'Legendás klub, elektronikus zene' },
            { pos: [50.0892, 14.4268], name: 'Chapeau Rouge', desc: 'Háromszintes buli, külföldi kedvenc' },
            { pos: [50.0896, 14.4275], name: 'Karlovy Lázně', desc: 'Európa egyik legnagyobb klubja, 5 szint' },
            { pos: [50.0815, 14.4295], name: 'Nebe Cocktail Bar', desc: 'Koktélok & tánc, fiatalos' },
            { pos: [50.0905, 14.4210], name: 'James Dean', desc: 'Koktélbár & DJ' },
            { pos: [50.0880, 14.4310], name: 'M1 Lounge', desc: 'Elegáns koktélbár' },
            { pos: [50.0870, 14.4320], name: 'Lucerna Music Bar', desc: 'Live zene & retro partik' },
            { pos: [50.0788, 14.4330], name: 'Duplex', desc: 'Rooftop klub, panorámás kilátás' },
            { pos: [50.0750, 14.4130], name: 'Cross Club', desc: 'Alternatív ipari klub, egyedi dizájn' },
            { pos: [50.0862, 14.4340], name: 'Retro Music Hall', desc: '80s-90s partik' }
        ];
        nightlifeData.forEach(nl => {
            L.marker(nl.pos, { icon: createIcon('#e8c084', '🎉') })
                .addTo(nightlifeLayer)
                .bindPopup(`<strong>🎉 ${nl.name}</strong><br>${nl.desc}<br>${dirLink(nl.pos)}`);
        });

        // ============== BARS & PUBS ==============
        const barsData = [
            { pos: [50.0780, 14.4198], name: 'U Fleků', desc: 'Történelmi sörfőzde 1499 óta!' },
            { pos: [50.0880, 14.4197], name: 'Lokál', desc: 'Cseh konyha & tank sör, kötelező!' },
            { pos: [50.0855, 14.4285], name: 'Beer Museum', desc: '30+ csapolt cseh sör' },
            { pos: [50.0872, 14.4205], name: 'U Zlatého Tygra', desc: 'Legendás prágai kocsma, Pilsner Urquell' },
            { pos: [50.0890, 14.4185], name: 'Pivovarský Dům', desc: 'Minisörfőzde, különleges sörök' },
            { pos: [50.0835, 14.4160], name: 'U Medvídků', desc: 'Legrégebbi söröző, X-Beer' },
            { pos: [50.0920, 14.4145], name: 'Vinárna U Sudu', desc: 'Barlangrendszer, bor & koktél' },
            { pos: [50.0867, 14.4230], name: 'Hemingway Bar', desc: 'Prémium koktélbár, világszínvonal' },
            { pos: [50.0910, 14.4185], name: "Tretter's", desc: 'New York stílusú koktélbár' },
            { pos: [50.0878, 14.4168], name: 'Propaganda', desc: 'Retro szocialista dizájn kocsma' },
            { pos: [50.0898, 14.4245], name: 'Anonymous Bar', desc: 'Titkos speakeasy stílusú bár' },
            { pos: [50.0845, 14.4240], name: 'BeerGeek Bar', desc: 'Craft sörök, sörrajongóknak' },
            { pos: [50.0820, 14.4155], name: 'Výtopna', desc: 'Vonatmodellek hozzák a sört!' },
            { pos: [50.0930, 14.4120], name: 'Letná Beer Garden', desc: 'Szabadtéri sörözés, panoráma' },
            { pos: [50.0858, 14.4195], name: 'U Parlamentu', desc: 'Hagyományos cseh söröző' }
        ];
        barsData.forEach(bar => {
            L.marker(bar.pos, { icon: createIcon('#84362b', '🍺') })
                .addTo(barsLayer)
                .bindPopup(`<strong>🍺 ${bar.name}</strong><br>${bar.desc}<br>${dirLink(bar.pos)}`);
        });

        // ============== ACTIVITIES ==============
        const activitiesData = [
            { pos: [50.0940, 14.4380], name: 'Beer Spa Bernard', desc: 'Sörspa élmény — fürdés sörben!' },
            { pos: [50.0680, 14.4500], name: 'AK-47 Shooting Range', desc: 'Fegyveres lövészet, AK-47 & más' },
            { pos: [50.0790, 14.4400], name: 'Escape Room Prague', desc: 'Több mint 10 szoba, csapatépítés' },
            { pos: [50.0850, 14.4350], name: 'Black Light Mini Golf', desc: 'UV fényű minigolf, neon élmény' },
            { pos: [50.0720, 14.4250], name: 'Prague Boats', desc: 'Hajókirándulás a Moldván' },
            { pos: [50.0810, 14.4000], name: 'Pedal Boat Rental', desc: 'Vízibicikli a Moldván' },
            { pos: [50.1050, 14.4510], name: 'Segway Tours', desc: 'Segway városnézés' },
            { pos: [50.0755, 14.4378], name: 'Pub Crawl Prague', desc: 'Szervezett kocsmaturák' },
            { pos: [50.0865, 14.4190], name: 'Ghost Tour', desc: 'Éjszakai szellemjárás séta' },
            { pos: [50.0900, 14.4100], name: 'Wallenstein Garden', desc: 'Ingyenes barokk kert, páva' },
            { pos: [50.0842, 14.4380], name: 'Sex Machines Museum', desc: 'Egyedi múzeum, 18+' },
            { pos: [50.0870, 14.4350], name: 'Hooters Prague', desc: 'Amerikai étterem & bár' },
            { pos: [50.0760, 14.4050], name: 'Laser Game', desc: 'Lézeres lövölde, csapatjáték' },
            { pos: [50.0830, 14.4280], name: 'Casino Atrium', desc: 'Kaszinó & poker' }
        ];
        activitiesData.forEach(act => {
            L.marker(act.pos, { icon: createIcon('#2c4a30', '🎯') })
                .addTo(activitiesLayer)
                .bindPopup(`<strong>🎯 ${act.name}</strong><br>${act.desc}<br>${dirLink(act.pos)}`);
        });

        // ============== RESTAURANTS ==============
        const foodData = [
            { pos: [50.0862, 14.4178], name: 'Kantýna', desc: 'Modern cseh konyha, friss húsok' },
            { pos: [50.0848, 14.4205], name: 'Café Louvre', desc: 'Historikus kávézó, reggelizőhely' },
            { pos: [50.0893, 14.4188], name: 'Havelská Koruna', desc: 'Olcsó & finom cseh kaja, önkiszolgáló' },
            { pos: [50.0875, 14.4155], name: 'Potrefená Husa', desc: 'Cseh sörétterem lánc' },
            { pos: [50.0888, 14.4232], name: 'Restaurace Mlejnice', desc: 'Hagyományos cseh ételek' },
            { pos: [50.0825, 14.4175], name: 'Pizzeria Kmotra', desc: 'Híres prágai pizza' },
            { pos: [50.0915, 14.4162], name: 'Lehká Hlava', desc: 'Vegetáriánus, egyedi dizájn' },
            { pos: [50.0795, 14.4220], name: 'Las Adelitas', desc: 'Mexikói étel & margarita' },
            { pos: [50.0905, 14.4078], name: 'Coda Restaurant', desc: 'Fine dining, Michelin' },
            { pos: [50.0840, 14.4135], name: 'Café Savoy', desc: 'Elegáns brunch & torta' },
            { pos: [50.0910, 14.4225], name: 'Ambiente', desc: 'Pasta & olasz ételek' },
            { pos: [50.0770, 14.4290], name: "Sad Man's Tongue", desc: 'Burger & BBQ' }
        ];
        foodData.forEach(food => {
            L.marker(food.pos, { icon: createIcon('#c46a5d', '🍽️') })
                .addTo(foodLayer)
                .bindPopup(`<strong>🍽️ ${food.name}</strong><br>${food.desc}<br>${dirLink(food.pos)}`);
        });

        // ============== TRANSPORT ==============
        const transportData = [
            { pos: [50.0833, 14.4351], name: 'Hlavní nádraží', desc: 'Fő pályaudvar — érkezés vonattal' },
            { pos: [50.1018, 14.2632], name: 'Václav Havel Repülőtér', desc: 'Nemzetközi repülőtér' },
            { pos: [50.0839, 14.4299], name: 'Florenc Buszállomás', desc: 'Nemzetközi buszok' },
            { pos: [50.0755, 14.4378], name: 'Můstek metró', desc: 'Központi metrómegálló (A & B)' },
            { pos: [50.0865, 14.4200], name: 'Staroměstská metró', desc: 'Óváros metró (A)' }
        ];
        transportData.forEach(tr => {
            L.marker(tr.pos, { icon: createIcon('#4a6f4f', '🚆') })
                .addTo(transportLayer)
                .bindPopup(`<strong>🚆 ${tr.name}</strong><br>${tr.desc}`);
        });

        // Add layers to map
        accommodationLayer.addTo(map);
        attractionsLayer.addTo(map);
        nightlifeLayer.addTo(map);
        barsLayer.addTo(map);
        activitiesLayer.addTo(map);
        foodLayer.addTo(map);
        transportLayer.addTo(map);

        const overlays = {
            '🏠 Szállás': accommodationLayer,
            '📍 Látnivalók': attractionsLayer,
            '🎉 Bulinegyed': nightlifeLayer,
            '🍺 Kocsmák & Bárok': barsLayer,
            '🎯 Aktivitások': activitiesLayer,
            '🍽️ Éttermek': foodLayer,
            '🚆 Közlekedés': transportLayer
        };

        const isMobile = window.matchMedia('(max-width: 768px)').matches;
        L.control.layers(null, overlays, { collapsed: isMobile, position: 'topright' }).addTo(map);

        const allMarkers = [
            ...accommodationData.map(d => L.marker(d.pos)),
            ...attractionsData.slice(0, 5).map(d => L.marker(d.pos))
        ];
        const group = L.featureGroup(allMarkers);
        map.fitBounds(group.getBounds().pad(0.1));
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => setTimeout(initPragueMap, 100));
    } else {
        setTimeout(initPragueMap, 100);
    }

    window.initPragueMap = initPragueMap;
})();
