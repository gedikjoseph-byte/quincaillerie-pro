// --- CONNEXION FIREBASE ---
const firebaseConfig = {
  apiKey: "AIzaSyBnsH5HUVrBOxeyAFgbyJo4Dsz1PqGEK98",
  authDomain: "hirdavatpro-gedik.firebaseapp.com",
  databaseURL: "https://hirdavatpro-gedik-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "hirdavatpro-gedik",
  storageBucket: "hirdavatpro-gedik.firebasestorage.app",
  messagingSenderId: "1002511772722",
  appId: "1:1002511772722:web:839952ac6748d1569b202b"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// --- CONTRÔLE D'ACCÈS ---
const AUTH_DATA = { user: "Gediks", pass: "Gediks" };

function sistemeGirisYap() {
    const u = document.getElementById('loginUser').value;
    const p = document.getElementById('loginPass').value;

    if (u === AUTH_DATA.user && p === AUTH_DATA.pass) {
        document.getElementById('authScreen').style.display = 'none';
        sessionStorage.setItem('isLogged', 'true');
    } else {
        document.getElementById('errorMsg').style.display = 'block';
    }
}

window.onload = function() {
    if (sessionStorage.getItem('isLogged') === 'true') {
        document.getElementById('authScreen').style.display = 'none';
    }
};

// --- VARIABLES ---
let urunler = [], musteriler = [], satislar = [], sepet = [], seciliUrun = null;

// --- RÉCUPÉRATION DES DONNÉES DEPUIS LE CLOUD ---
db.ref('/').on('value', (snapshot) => {
    const data = snapshot.val();
    if (data) {
        urunler = data.stok || [];
        musteriler = data.cariler || [];
        satislar = data.satislar || [];
        raporListele();
        musteriListele();
        stockListele(); // Mise à jour de la liste stock
    }
});

// --- SAUVEGARDE SUR LE CLOUD ---
function bulutaKaydet() {
    db.ref('/').set({ stok: urunler, cariler: musteriler, satislar: satislar });
}

// --- FONCTIONS DE NAVIGATION ---
function tabDegistir(id) {
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    if(id === 'musteriler') musteriListele();
    if(id === 'raporlar') raporListele();
    if(id === 'urunler') stockListele();
    musteriDropdownGuncelle();
}

// --- GESTION DU STOCK ---
function urunAra() {
    const q = document.getElementById('searchInput').value.toLowerCase();
    seciliUrun = urunler.find(u => u.ad.toLowerCase().includes(q));
    if(seciliUrun && q !== "") {
        document.getElementById('pTitle').innerText = seciliUrun.ad;
        document.getElementById('pImg').src = seciliUrun.resim || '';
        document.getElementById('editAd').value = seciliUrun.ad;
        document.getElementById('editAlis').value = seciliUrun.alis;
        document.getElementById('editSatis').value = seciliUrun.satis;
        document.getElementById('productCard').style.display = 'block';
        araToplamGuncelle();
    } else { 
        document.getElementById('productCard').style.display = 'none'; 
    }
}

function stockListele() {
    const tbody = document.querySelector('#stockTable tbody');
    if (!tbody) return;
    
    tbody.innerHTML = urunler.map((u, i) => `
        <tr>
            <td><img src="${u.resim || ''}" style="width:40px; height:40px; object-fit:cover; border-radius:4px;"></td>
            <td>${u.ad}</td>
            <td>${u.alis.toFixed(2)}€</td>
            <td>${u.satis.toFixed(2)}€</td>
            <td>
                <button style="background:#e11d48; color:white; border:none; padding:5px 10px; cursor:pointer; border-radius:3px;" 
                        onclick="if(confirm('Supprimer ce produit ?')){urunler.splice(${i},1); bulutaKaydet();}">
                    Supprimer
                </button>
            </td>
        </tr>
    `).join('');
}

function yeniUrunKaydet() {
    const ad = document.getElementById('yeniAd').value;
    const alis = parseFloat(document.getElementById('yeniAlis').value);
    const satis = parseFloat(document.getElementById('yeniSatis').value);
    const file = document.getElementById('resimInput').files[0];

    if(!ad || isNaN(alis)) { alert("Veuillez remplir les informations !"); return; }

    const saveProcess = (imgData) => {
        urunler.push({ ad, alis, satis, resim: imgData });
        bulutaKaydet();
        alert("Produit ajouté !");
        // Reset formulaire
        document.getElementById('yeniAd').value = "";
        document.getElementById('yeniAlis').value = "";
        document.getElementById('yeniSatis').value = "";
        document.getElementById('resimInput').value = "";
    };

    if(file) {
        const reader = new FileReader();
        reader.onload = (e) => saveProcess(e.target.result);
        reader.readAsDataURL(file);
    } else {
        saveProcess('');
    }
}

function stokBilgiGuncelle() {
    const idx = urunler.findIndex(u => u.ad === seciliUrun.ad);
    const file = document.getElementById('editResim').files[0];
    const updateData = () => {
        urunler[idx].ad = document.getElementById('editAd').value;
        urunler[idx].alis = parseFloat(document.getElementById('editAlis').value);
        urunler[idx].satis = parseFloat(document.getElementById('editSatis').value);
        bulutaKaydet();
        alert("Mise à jour réussie !");
    };
    if(file) {
        const reader = new FileReader();
        reader.onload = (e) => { urunler[idx].resim = e.target.result; updateData(); };
        reader.readAsDataURL(file);
    } else { updateData(); }
}

// --- GESTION DU PANIER & VENTE ---
function araToplamGuncelle() {
    const adet = parseFloat(document.getElementById('pAdet').value) || 0;
    const alis = parseFloat(document.getElementById('editAlis').value) || 0;
    const satis = parseFloat(document.getElementById('editSatis').value) || 0;
    document.getElementById('pAlisToplam').innerText = (alis * adet).toFixed(2);
    document.getElementById('pSatisToplam').innerText = (satis * adet).toFixed(2);
}

function sepeteEkle() {
    const adet = parseFloat(document.getElementById('pAdet').value) || 1;
    sepet.push({
        ad: document.getElementById('editAd').value,
        adet: adet,
        alisToplam: parseFloat(document.getElementById('editAlis').value) * adet,
        satisToplam: parseFloat(document.getElementById('editSatis').value) * adet
    });
    sepetGuncelle();
    document.getElementById('productCard').style.display = 'none';
}

function sepetGuncelle() {
    const tbody = document.querySelector('#cartTable tbody');
    tbody.innerHTML = '';
    let ts = 0;
    sepet.forEach((u, i) => {
        ts += u.satisToplam;
        tbody.innerHTML += `<tr><td>${u.ad}</td><td>${u.adet}</td><td>${u.alisToplam.toFixed(2)}€</td><td>${u.satisToplam.toFixed(2)}€</td><td style="color:red; cursor:pointer;" onclick="sepet.splice(${i},1);sepetGuncelle()">Supprimer</td></tr>`;
    });
    document.getElementById('rawTotal').innerText = ts.toFixed(2);
    finalHesapla();
}

function finalHesapla() {
    let ta = sepet.reduce((a, b) => a + b.alisToplam, 0);
    let rawTs = sepet.reduce((a, b) => a + b.satisToplam, 0);
    let finalInput = parseFloat(document.getElementById('finalCashAmount').value);
    let ts = isNaN(finalInput) ? rawTs : finalInput;
    document.getElementById('totalSatis').innerText = ts.toFixed(2);
    document.getElementById('totalKar').innerText = (ts - ta).toFixed(2);
}

function satisiBitir() {
    if(sepet.length === 0) return;
    const tip = document.getElementById('odemeYontemi').value;
    const ts = parseFloat(document.getElementById('totalSatis').innerText);
    const ta = sepet.reduce((a, b) => a + b.alisToplam, 0);
    const mIdx = document.getElementById('musteriSec').value;

    satislar.push({ 
        tarih: new Date().toLocaleString('fr-FR'), 
        detay: sepet.map(u => u.ad).join(','), 
        tutar: ts, 
        kar: ts - ta, 
        tip: tip 
    });
    
    if(tip === 'Crédit') { musteriler[mIdx].borc += ts; }
    
    bulutaKaydet();
    alert("Vente confirmée !");
    sepet = []; sepetGuncelle();
}

// --- RAPPORTS & CLIENTS ---
function raporListele() {
    let n = 0, k = 0, b = musteriler.reduce((t, m) => t + m.borc, 0), tK = 0;
    document.querySelector('#raporTable tbody').innerHTML = satislar.slice().reverse().map(s => {
        if(s.tip === 'Espèces' || s.tip === 'ENCAISSEMENT') n += s.tutar;
        if(s.tip === 'Carte Bancaire') k += s.tutar;
        tK += (s.tip === 'ENCAISSEMENT' ? 0 : s.kar);
        return `<tr><td>${s.tarih}</td><td>${s.detay}</td><td>${s.tutar.toFixed(2)}€</td><td>${s.kar.toFixed(2)}€</td></tr>`;
    }).join('');
    document.getElementById('repNakit').innerText = n.toFixed(2);
    document.getElementById('repKart').innerText = k.toFixed(2);
    document.getElementById('repBorc').innerText = b.toFixed(2);
    document.getElementById('repKar').innerText = tK.toFixed(2);
}

function musteriEkle() {
    musteriler.push({ ad: document.getElementById('mAd').value, tel: document.getElementById('mTel').value, borc: 0 });
    bulutaKaydet();
    musteriListele();
}

function musteriListele() {
    document.querySelector('#musteriTable tbody').innerHTML = musteriler.map((m, i) => `<tr><td>${m.ad}</td><td>${m.borc.toFixed(2)}€</td><td><button onclick="tahsilatYap(${i})">Encaisser</button></td></tr>`).join('');
}

function tahsilatYap(i) {
    const t = parseFloat(prompt("Montant de l'encaissement :"));
    if(t > 0) {
        musteriler[i].borc -= t;
        satislar.push({ 
            tarih: new Date().toLocaleString('fr-FR'), 
            detay: `Encaissement : ${musteriler[i].ad}`, 
            tutar: t, 
            kar: 0, 
            tip: 'ENCAISSEMENT' 
        });
        bulutaKaydet();
    }
}

function musteriDropdownGuncelle() {
    document.getElementById('musteriSec').innerHTML = musteriler.map((m, i) => `<option value="${i}">${m.ad}</option>`).join('');
}

function odemeKontrol() { 
    document.getElementById('musteriSec').style.display = (document.getElementById('odemeYontemi').value === 'Crédit' ? 'block' : 'none'); 
}

// --- GESTION DES RETOURS / ANNULATIONS ---
function iptalMusteriKontrol() {
    const tip = document.getElementById('iptalTip').value;
    const mSec = document.getElementById('iptalMusteriSec');
    mSec.style.display = (tip === 'Veresiye' ? 'block' : 'none');
    mSec.innerHTML = musteriler.map((m, i) => `<option value="${i}">${m.ad}</option>`).join('');
}

function iptalIsleminiYap() {
    const tip = document.getElementById('iptalTip').value;
    const tutar = parseFloat(document.getElementById('iptalTutar').value);
    const kar = parseFloat(document.getElementById('iptalKar').value) || 0;
    const detay = document.getElementById('iptalDetay').value;
    const mIdx = document.getElementById('iptalMusteriSec').value;

    if (!tutar || !detay) { alert("Veuillez remplir les champs !"); return; }
    if (!confirm(tutar + " € seront déduits. Confirmer ?")) return;

    satislar.push({
        tarih: new Date().toLocaleString('fr-FR'),
        detay: "RETOUR : " + detay,
        tutar: -tutar, 
        kar: -kar,    
        tip: tip
    });

    if (tip === 'Veresiye' && musteriler[mIdx]) { musteriler[mIdx].borc -= tutar; }

    bulutaKaydet();
    alert("Déduction effectuée.");
    document.getElementById('iptalTutar').value = "";
    document.getElementById('iptalDetay').value = "";
    tabDegistir('raporlar');
}
