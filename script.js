(function () {
  "use strict";

  var hemat = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var WARNA = { tinta: "#1F2341", hijau: "#8BD450", teal: "#4C8C8F" };

  /* =========================================================
     1) SPRITE DINO (gambar piksel buatan sendiri, 18 x 16)
        O = garis, G = hijau, D = perut teal
     ========================================================= */
  var badanDino = [
    "............OOOO..",
    "...........OGGGGO.",
    "...........OGOGGGO",
    "...........OGGGGGO",
    "............OOGGO.",
    ".............OGGO.",
    ".............OGGO.",
    ".............OGGO.",
    "......OOOOOO.OGGO.",
    "O...OOGGGGGGOOGGO.",
    "OG.OGGGDGGDGGGGGO.",
    "OGOGGGGDGGDGGGGGO.",
    ".OGGGDDDDDDDDDGO..",
    "..OOODDDDDDDDDO..."
  ];
  var kakiDino = [
    ["....OGGO...OGGO...", "....OOOO...OOOO..."],
    [".....OGGO.OGGO....", ".....OOOO.OOOO...."]
  ];
  var warnaHuruf = { O: WARNA.tinta, G: WARNA.hijau, D: WARNA.teal };

  function gambarDino(canvas, langkah) {
    var ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, 18, 16);
    var baris = badanDino.concat(kakiDino[langkah % 2]);
    for (var y = 0; y < baris.length; y++) {
      for (var x = 0; x < baris[y].length; x++) {
        var w = warnaHuruf[baris[y][x]];
        if (w) { ctx.fillStyle = w; ctx.fillRect(x, y, 1, 1); }
      }
    }
  }

  /* =========================================================
     2) BUMI PIKSEL (digambar dengan noise, bisa berputar)
     ========================================================= */
  function acak(x, y, z) {
    var h = Math.imul(x, 374761393) + Math.imul(y, 668265263) + Math.imul(z, 1274126177);
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    h ^= h >>> 16;
    return (h >>> 0) / 4294967295;
  }
  function halus(t) { return t * t * (3 - 2 * t); }
  function noise(x, y, z) {
    var xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z);
    var xf = halus(x - xi), yf = halus(y - yi), zf = halus(z - zi);
    function c(a, b, d) { return acak(xi + a, yi + b, zi + d); }
    function lerp(a, b, t) { return a + (b - a) * t; }
    return lerp(
      lerp(lerp(c(0,0,0), c(1,0,0), xf), lerp(c(0,1,0), c(1,1,0), xf), yf),
      lerp(lerp(c(0,0,1), c(1,0,1), xf), lerp(c(0,1,1), c(1,1,1), xf), yf), zf);
  }
  function fbm(x, y, z) {
    return noise(x * 1.6, y * 1.6, z * 1.6) * 0.6 + noise(x * 3.2, y * 3.2, z * 3.2) * 0.3 + noise(x * 6.4, y * 6.4, z * 6.4) * 0.1;
  }
  function hex(h) { return [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)]; }
  var W = {
    lautDalam: hex("#2B6CA3"), laut: hex("#3E8FCB"), pantai: hex("#6FC0E4"),
    darat: hex("#6BBF4E"), daratTua: hex("#3F8E3E"), gunung: hex("#C9B97A"),
    es: hex("#F4FAFD"), awan: hex("#FFFFFF"), atmosfer: hex("#E8F6FC")
  };

  function buatBumi(canvas) {
    var N = canvas.width, R = N / 2 - 1, ctx = canvas.getContext("2d");
    var img = ctx.createImageData(N, N), data = img.data;
    var titik = [];
    for (var j = 0; j < N; j++) for (var i = 0; i < N; i++) {
      var dx = (i + 0.5 - N / 2) / R, dy = (j + 0.5 - N / 2) / R, r2 = dx * dx + dy * dy;
      if (r2 <= 1) titik.push({ idx: (j * N + i) * 4, x: dx, y: dy, z: Math.sqrt(1 - r2), r: Math.sqrt(r2) });
    }
    return function gambar(sudut) {
      var cs = Math.cos(sudut), sn = Math.sin(sudut), cs2 = Math.cos(sudut * 1.6), sn2 = Math.sin(sudut * 1.6);
      for (var k = 0; k < titik.length; k++) {
        var t = titik[k];
        var x = t.x * cs + t.z * sn, z = -t.x * sn + t.z * cs;
        var v = fbm(x * 1.8 + 10, t.y * 1.8 + 3, z * 1.8 + 7);
        var w;
        if (Math.abs(t.y) > 0.86) w = W.es;
        else if (v > 0.6) w = W.gunung;
        else if (v > 0.55) w = W.daratTua;
        else if (v > 0.5) w = W.darat;
        else if (v > 0.47) w = W.pantai;
        else if (v > 0.38) w = W.laut;
        else w = W.lautDalam;
        var xa = t.x * cs2 + t.z * sn2, za = -t.x * sn2 + t.z * cs2;
        if (fbm(xa * 2.4 + 40, t.y * 3.2 + 40, za * 2.4 + 40) > 0.64) w = W.awan;
        if (t.r > 0.94) w = W.atmosfer;
        // bayangan: sisi kanan bawah lebih gelap
        var terang = (-0.55 * t.x - 0.55 * t.y + 0.63 * t.z);
        var f = terang < -0.05 ? 0.62 : terang < 0.25 ? 0.82 : 1;
        data[t.idx] = w[0] * f; data[t.idx + 1] = w[1] * f; data[t.idx + 2] = w[2] * f; data[t.idx + 3] = 255;
      }
      ctx.putImageData(img, 0, 0);
    };
  }

  /* Satu jam animasi untuk semua yang bergerak, dibuat patah-patah (10 fps) supaya terasa seperti game piksel. */
  var animasi = [];
  function jalankan(fn) { animasi.push(fn); }
  var terakhir = 0, detik = 0;
  function loop(waktu) {
    if (waktu - terakhir >= 100) {
      detik += (waktu - terakhir) / 1000;
      terakhir = waktu;
      for (var i = 0; i < animasi.length; i++) animasi[i](detik);
    }
    requestAnimationFrame(loop);
  }

  /* =========================================================
     3) LAYAR LOADING
     ========================================================= */
  var bumiLoading = document.getElementById("bumi-loading");
  var dinoLoading = document.getElementById("dino-loading");
  var loadingAktif = true;
  if (bumiLoading && dinoLoading) {
    var gambarBumiLoading = buatBumi(bumiLoading);
    gambarBumiLoading(0);
    gambarDino(dinoLoading, 0);
    if (!hemat) jalankan(function (t) {
      if (!loadingAktif) return;
      gambarBumiLoading(t * 0.8);
      gambarDino(dinoLoading, Math.floor(t * 6));
    });
  }
  var mulai = Date.now(), MINIMAL = hemat ? 300 : 1900;
  function selesaiLoading() {
    var sisa = Math.max(0, MINIMAL - (Date.now() - mulai));
    setTimeout(function () {
      document.documentElement.classList.add("siap");
      setTimeout(function () { loadingAktif = false; }, 500);
    }, sisa);
  }
  if (document.readyState === "complete") selesaiLoading();
  else window.addEventListener("load", selesaiLoading);
  setTimeout(selesaiLoading, 6000); // jaga-jaga kalau event load tidak datang

  /* =========================================================
     4) BUMI DAN DINO DI HOME
     ========================================================= */
  var bumiHero = document.getElementById("bumi-hero");
  var dinoHero = document.getElementById("dino-hero");
  var heroTerlihat = true;
  if (bumiHero && dinoHero) {
    var gambarBumiHero = buatBumi(bumiHero);
    gambarBumiHero(0);
    gambarDino(dinoHero, 0);
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (e) { heroTerlihat = e[0].isIntersecting; }).observe(bumiHero);
    }
    if (!hemat) jalankan(function (t) {
      if (!heroTerlihat) return;
      gambarBumiHero(t * 0.35);
      gambarDino(dinoHero, Math.floor(t * 5));
    });
  }
  requestAnimationFrame(loop);

  /* =========================================================
     5) ISI HOME MEMUDAR SAAT DIGULIR KE BAWAH
     ========================================================= */
  var isiHero = document.querySelector(".beranda-isi");
  var planet = document.querySelector(".planet");
  var gulir = document.querySelector(".gulir");
  var antri = false;
  function saatGulir() {
    antri = false;
    var p = Math.min(1, window.scrollY / (window.innerHeight * 0.6));
    if (isiHero) {
      isiHero.style.opacity = String(1 - p);
      isiHero.style.transform = hemat ? "" : "translateY(" + (-p * 48) + "px)";
    }
    if (planet && !hemat) planet.style.transform = "translateY(" + (p * 90) + "px)";
    if (gulir) gulir.style.opacity = String(Math.max(0, 1 - p * 3));
  }
  window.addEventListener("scroll", function () {
    if (!antri) { antri = true; requestAnimationFrame(saatGulir); }
  }, { passive: true });
  saatGulir();

  /* =========================================================
     6) TRANSISI KOTAK-KOTAK SAAT PINDAH BAGIAN
     ========================================================= */
  var lapisan = document.querySelector(".transisi");
  var sedangPindah = false;

  function acakUrutan(n) {
    var a = []; for (var i = 0; i < n; i++) a.push(i);
    for (var j = n - 1; j > 0; j--) { var k = Math.floor(Math.random() * (j + 1)); var s = a[j]; a[j] = a[k]; a[k] = s; }
    return a;
  }
  function animasiKotak(ctx, kolom, total, isi, durasi, selesai) {
    var urut = acakUrutan(total), awal = performance.now(), sudah = 0;
    ctx.fillStyle = WARNA.tinta;
    function langkah(now) {
      var target = Math.min(total, Math.ceil(total * (now - awal) / durasi));
      for (; sudah < target; sudah++) {
        var n = urut[sudah], x = n % kolom, y = Math.floor(n / kolom);
        if (isi) ctx.fillRect(x, y, 1, 1); else ctx.clearRect(x, y, 1, 1);
      }
      if (sudah < total) requestAnimationFrame(langkah); else selesai();
    }
    requestAnimationFrame(langkah);
  }
  function lompatKe(target) {
    var y = target.getBoundingClientRect().top + window.scrollY;
    window.scrollTo(0, target.id === "beranda" ? 0 : y);
    target.setAttribute("tabindex", "-1");
    target.focus({ preventScroll: true });
    if (history.replaceState) history.replaceState(null, "", "#" + target.id);
  }
  function pindah(target) {
    if (hemat || !lapisan) { lompatKe(target); return; }
    if (sedangPindah) return;
    sedangPindah = true;
    var ukuran = 28;
    var kolom = Math.ceil(window.innerWidth / ukuran), baris = Math.ceil(window.innerHeight / ukuran);
    lapisan.width = kolom; lapisan.height = baris;
    var ctx = lapisan.getContext("2d");
    animasiKotak(ctx, kolom, kolom * baris, true, 320, function () {
      lompatKe(target);
      setTimeout(function () {
        animasiKotak(ctx, kolom, kolom * baris, false, 360, function () { sedangPindah = false; });
      }, 60);
    });
  }
  document.querySelectorAll('a[href^="#"]').forEach(function (a) {
    a.addEventListener("click", function (e) {
      var id = a.getAttribute("href").slice(1);
      var target = document.getElementById(id);
      if (!target) return;
      e.preventDefault();
      pindah(target);
    });
  });

  /* =========================================================
     7) ISI BAGIAN MUNCUL PERLAHAN SAAT MASUK LAYAR
     ========================================================= */
  var munculan = document.querySelectorAll(".muncul");
  if ("IntersectionObserver" in window && !hemat) {
    var pengamatMuncul = new IntersectionObserver(function (entri) {
      entri.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("tampil"); pengamatMuncul.unobserve(e.target); }
      });
    }, { threshold: 0.12 });
    munculan.forEach(function (el, i) {
      el.style.transitionDelay = (i % 4) * 80 + "ms";
      pengamatMuncul.observe(el);
    });
  } else {
    munculan.forEach(function (el) { el.classList.add("tampil"); });
  }

  /* =========================================================
     8) PENANDA MENU AKTIF
     ========================================================= */
  var tautanNav = document.querySelectorAll(".nav a");
  function tandai(id) {
    tautanNav.forEach(function (a) {
      if (a.getAttribute("href") === "#" + id) a.setAttribute("aria-current", "true");
      else a.removeAttribute("aria-current");
    });
  }
  if ("IntersectionObserver" in window) {
    var pengamatNav = new IntersectionObserver(function (entri) {
      entri.forEach(function (e) { if (e.isIntersecting) tandai(e.target.id); });
    }, { rootMargin: "-45% 0px -50% 0px" });
    document.querySelectorAll("main section[id]").forEach(function (s) { pengamatNav.observe(s); });
  }
  tandai("beranda");

  /* =========================================================
     9) JAM WITA
     ========================================================= */
  var jam = document.getElementById("jam");
  if (jam) {
    try {
      var format = new Intl.DateTimeFormat("id-ID", { timeZone: "Asia/Makassar", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });
      var tik = function () { jam.textContent = format.format(new Date()).replace(/\./g, ":"); };
      tik(); setInterval(tik, 1000);
    } catch (e) { jam.parentNode.textContent = "WITA (UTC+8)"; }
  }

  /* =========================================================
     10) IKON PIKSEL 8 x 8
     ========================================================= */
  var IKON = {
    hati:    [".XX..XX.","XXXXXXXX","XXXXXXXX","XXXXXXXX",".XXXXXX.","..XXXX..","...XX...","........"],
    bintang: ["...XX...","...XX...","XXXXXXXX",".XXXXXX.","..XXXX..",".XX..XX.","XX....XX","........"],
    buku:    ["........","XXX..XXX","X.XXXX.X","X..XX..X","X..XX..X","X..XX..X","XXXXXXXX","........"],
    kunci:   ["........",".XXX....","X...X...","X...XXXX","X...X.X.",".XXX..X.","........","........"],
    layar:   ["XXXXXXXX","X......X","X......X","X......X","XXXXXXXX","...XX...","..XXXX..","........"],
    chip:    ["..X..X..",".XXXXXX.","XX....XX",".X.XX.X.",".X.XX.X.","XX....XX",".XXXXXX.","..X..X.."],
    peta:    ["..XXXX..",".XX..XX.",".X....X.",".XX..XX.","..XXXX..","...XX...","...XX...","........"],
    kamera:  ["........","..XX....","XXXXXXXX","X..XX..X","X.X..X.X","X..XX..X","XXXXXXXX","........"],
    nada:    ["...XXXXX","...X...X","...X...X","...X...X",".XXX.XXX","XXXX.XXX",".XX...X.","........"]
  };
  document.querySelectorAll("svg[data-ikon]").forEach(function (svg) {
    var pola = IKON[svg.getAttribute("data-ikon")];
    if (!pola) return;
    svg.setAttribute("viewBox", "0 0 8 8");
    var d = "";
    pola.forEach(function (b, y) { for (var x = 0; x < 8; x++) if (b[x] === "X") d += "M" + x + " " + y + "h1v1h-1z"; });
    svg.innerHTML = '<path fill="' + WARNA.tinta + '" d="' + d + '"/>';
  });
})();

/* =========================================================
   11) GALERI: kotak pengingat kalau file belum ada, dan foto bisa diperbesar
   ========================================================= */
(function () {
  "use strict";

  function gantiDenganPengingat(el, jenis) {
    var kotak = document.createElement("div");
    kotak.className = "kosong";
    var judul = document.createElement("span");
    judul.textContent = jenis === "video" ? "Video belum ada" : "Foto belum ada";
    var nama = document.createElement("code");
    nama.textContent = el.getAttribute("src");
    kotak.appendChild(judul);
    kotak.appendChild(nama);
    el.replaceWith(kotak);
  }

  document.querySelectorAll(".media img").forEach(function (img) {
    if (img.complete && img.naturalWidth === 0) gantiDenganPengingat(img, "foto");
    else img.addEventListener("error", function () { gantiDenganPengingat(img, "foto"); });
  });
  document.querySelectorAll(".media video").forEach(function (v) {
    if (v.error || v.networkState === 3) gantiDenganPengingat(v, "video");
    else v.addEventListener("error", function () { gantiDenganPengingat(v, "video"); });
  });

  // Foto diperbesar saat diketuk
  if (typeof HTMLDialogElement === "function") {
    var dialog = document.createElement("dialog");
    dialog.className = "lightbox";
    dialog.innerHTML = '<img alt=""><button type="button" class="tombol">Tutup</button>';
    document.body.appendChild(dialog);
    var gambarBesar = dialog.querySelector("img");
    dialog.querySelector("button").addEventListener("click", function () { dialog.close(); });
    dialog.addEventListener("click", function (e) { if (e.target === dialog) dialog.close(); });

    document.querySelector(".galeri") && document.querySelector(".galeri").addEventListener("click", function (e) {
      var img = e.target.closest(".media img");
      if (!img) return;
      gambarBesar.src = img.currentSrc || img.src;
      gambarBesar.alt = img.alt;
      dialog.showModal();
    });
  }
})();

/* =========================================================
   12) PEMUTAR LAGU: ubah link Spotify / YouTube menjadi pemutar
   ========================================================= */
(function () {
  "use strict";

  function bacaLink(link) {
    var u;
    try { u = new URL(link, location.href); } catch (e) { return null; }
    var host = u.hostname.replace(/^www\./, "");
    var m;

    if (host === "open.spotify.com") {
      m = u.pathname.match(/\/(track|album|playlist|episode)\/([A-Za-z0-9]+)/);
      if (m) return { jenis: "spotify", src: "https://open.spotify.com/embed/" + m[1] + "/" + m[2], tinggi: m[1] === "track" ? 152 : 352 };
    }

    var id = null;
    if (host === "youtu.be") id = u.pathname.slice(1).split("/")[0];
    else if (host === "youtube.com" || host === "m.youtube.com" || host === "music.youtube.com") {
      id = u.searchParams.get("v");
      if (!id) { m = u.pathname.match(/\/(shorts|embed|live)\/([\w-]{11})/); if (m) id = m[2]; }
    }
    if (id && /^[\w-]{11}$/.test(id)) return { jenis: "youtube", src: "https://www.youtube-nocookie.com/embed/" + id };

    if (/\.(mp3|m4a|ogg|wav)$/i.test(u.pathname)) return { jenis: "audio", src: u.href };
    return null;
  }

  function pengingat(wadah, judul, ket) {
    wadah.innerHTML = "";
    var kotak = document.createElement("div");
    kotak.className = "kosong";
    var a = document.createElement("span"); a.textContent = judul;
    var b = document.createElement("code"); b.textContent = ket;
    kotak.appendChild(a); kotak.appendChild(b);
    wadah.appendChild(kotak);
  }

  document.querySelectorAll(".pemutar").forEach(function (wadah) {
    var link = (wadah.getAttribute("data-link") || "").trim();
    if (!link) { pengingat(wadah, "Lagu belum diisi", 'Tempel link Spotify di data-link=""'); return; }

    var hasil = bacaLink(link);
    if (!hasil) { pengingat(wadah, "Link tidak dikenali", link); return; }

    if (hasil.jenis === "audio") {
      var audio = document.createElement("audio");
      audio.controls = true; audio.preload = "none"; audio.src = hasil.src;
      wadah.appendChild(audio);
      return;
    }

    var iframe = document.createElement("iframe");
    iframe.src = hasil.src;
    iframe.title = hasil.jenis === "spotify" ? "Pemutar Spotify" : "Pemutar YouTube";
    iframe.loading = "lazy";
    iframe.setAttribute("allow", "autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture");
    iframe.setAttribute("referrerpolicy", "strict-origin-when-cross-origin");
    if (hasil.jenis === "spotify") iframe.height = hasil.tinggi;
    else iframe.className = "yt";
    wadah.appendChild(iframe);
  });
})();
