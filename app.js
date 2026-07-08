/* PRESENTES · NFT + UPCYCLING
   La neuro-acción te hace seis preguntas, diseñás tu prenda única, y te llevás:
   perfil de diseñador + idea rectora + cápsula + ficha NFT (mint simulado) + ficha upcycling. */

const app = document.getElementById("app");

const state = {
  answers: {},      // respuestas de la neuro-action
  profile: null,    // perfil de diseñador derivado
  line: null,       // línea elegida
  tela: null,       // camino del diseño textil elegido
  sketch: null,     // boceto o imagen subida por el usuario (dataURL)
  desc: "",         // descripción libre de la prenda
  seeds: [],        // seeds de las 4 opciones
  chosen: null,     // índice de la idea rectora
  minted: false,
  tokenId: null,
  capsuleSeeds: [],
  medidas: null,                                       // medidas del cuerpo para la moldería
  press: 0,                                            // saldo del token ES (simulado)
  pressHitos: { perfil: false, rector: false, mint: false, archivo: false, percha: false }, // para no pagar dos veces el mismo hito
};

/* Token ES: como los tokens del agro que valen granos reales,
   ES vale trabajo real de upcycling. Acá, versión educativa. */
function earnPress(monto, hito) {
  if (state.pressHitos[hito]) return false;
  state.pressHitos[hito] = true;
  state.press += monto;
  save();
  updatePressChip(true);
  return true;
}

function updatePressChip(pulse) {
  const chip = document.getElementById("pressChip");
  if (!chip) return;
  chip.hidden = state.press <= 0;
  chip.textContent = `⬢ ${state.press} ES`;
  if (pulse) {
    chip.classList.add("pulse");
    setTimeout(() => chip.classList.remove("pulse"), 400);
  }
}

/* La sesión sobrevive un refresh: se guarda en el navegador. */
function save() {
  const data = {
    answers: state.answers, lineKey: state.line?.key || null, tela: state.tela, desc: state.desc,
    seeds: state.seeds, chosen: state.chosen, minted: state.minted,
    tokenId: state.tokenId, capsuleSeeds: state.capsuleSeeds,
    press: state.press, pressHitos: state.pressHitos, medidas: state.medidas,
  };
  try {
    sessionStorage.setItem("presentes-estudio", JSON.stringify({ ...data, sketch: state.sketch }));
  } catch (_) {
    // el boceto puede no entrar en el almacenamiento: guardamos el resto igual
    try { sessionStorage.setItem("presentes-estudio", JSON.stringify(data)); } catch (_) {}
  }
}

function restore() {
  try {
    const raw = sessionStorage.getItem("presentes-estudio");
    if (!raw) return false;
    const s = JSON.parse(raw);
    if (!s.answers || !s.answers.busqueda) return false;
    Object.assign(state.answers, s.answers);
    if (Object.keys(state.answers).length < QUESTIONS.length) return false;
    state.profile = buildProfile();
    state.line = LINEAS.find((l) => l.key === s.lineKey) || null;
    state.tela = s.tela || null;
    state.sketch = s.sketch || null;
    state.desc = s.desc || "";
    state.seeds = s.seeds || [];
    state.chosen = s.chosen;
    state.minted = !!s.minted;
    state.tokenId = s.tokenId;
    state.capsuleSeeds = s.capsuleSeeds || [];
    state.press = s.press || 0;
    state.pressHitos = s.pressHitos || { perfil: false, rector: false, mint: false, archivo: false, percha: false };
    state.medidas = s.medidas || null;
    updatePressChip();
    if (state.chosen != null && state.line) screenAtelier("nft");
    else if (state.seeds.length && state.line) screenOpciones();
    else if (state.line) screenDescribe();
    else screenPerfil();
    return true;
  } catch (_) { return false; }
}

/* ---------------- NEURO-ACTION ---------------- */

const QUESTIONS = [
  {
    id: "busqueda",
    says: "Vestirte es una conversación con vos. ¿De qué hablás?",
    sub: "Contestá rápido. La primera respuesta suele ser la verdadera.",
    type: "choice",
    other: true,
    options: [
      { key: "armadura", title: "De mi fuerza", desc: "Hay días que piden armadura. Yo sé cuáles, y me la pongo." },
      { key: "lienzo", title: "De lo que siento", desc: "Lo que no encuentra palabras adentro mío, encuentra tela." },
      { key: "manifiesto", title: "De lo que creo", desc: "Mis ideas también se visten. No salgo sin ellas." },
      { key: "juego", title: "De lo que pruebo", desc: "Cada mañana me invento de nuevo. La ropa es mi laboratorio." },
    ],
  },
  {
    id: "paleta",
    says: "¿De qué color es lo que todavía no te animaste a mostrar?",
    sub: "No es el color que usás. Es el que te está esperando.",
    type: "choice",
    other: true,
    options: [
      { key: "noche", title: "Noche", desc: "Negro sobre negro. Lo que se esconde también sabe brillar." },
      { key: "tierra", title: "Tierra", desc: "Óxido, cuero, arena: el color de lo que ya vivió y sigue vivo." },
      { key: "fuego", title: "Fuego", desc: "Rojos y naranjas que no piden permiso ni piden perdón." },
      { key: "agua", title: "Agua", desc: "Azules hondos: la calma que incomoda a los que gritan." },
    ],
  },
  {
    id: "material",
    says: "Imaginate que no se fabrica ni un metro más de material textil. ¿Con cuál de los que ya existen vas a crear?",
    sub: "Sobra ropa buena en el mundo. Elegir entre lo que ya existe no es un límite: es el juego.",
    type: "choice",
    other: true,
    options: [
      { key: "cuero", title: "Cuero con pasado", desc: "Camperas que ya vivieron tres vidas y todavía piden otra." },
      { key: "denim", title: "Denim gastado", desc: "Cada jean roto trae el mapa de alguien. Vos seguís dibujándolo." },
      { key: "saten", title: "Satén y seda", desc: "El brillo de fiestas ajenas, listo para tus propias fiestas." },
      { key: "punto", title: "Punto y lana", desc: "Sweaters que se pueden destejer: la única tela con botón de deshacer." },
    ],
  },
  {
    id: "rescate",
    says: "Hay toneladas de ropa buena durmiendo en placares, ferias y depósitos, mientras se sigue fabricando más. Contame una prenda que vos despertarías de ese sueño.",
    sub: "Real o imaginada. De tu casa, de una feria, de una herencia. Esa prenda ya te está esperando.",
    type: "text",
    placeholder: "Ej.: la campera de cuero negra de mi tío, que ya nadie usa pero sigue perfecta…",
  },
  {
    id: "tabu",
    says: "Decime algo que «no se hace» en el vestir… y que vos tenés ganas de hacer igual.",
    sub: "¿Quién dijo que no se hace? ¿Y por qué le seguimos obedeciendo a alguien que ni conocemos?",
    type: "text",
    placeholder: "Ej.: brillos un lunes a la mañana, un jumpsuit en un casamiento, falda con borceguíes al trabajo…",
  },
  {
    id: "firma",
    says: "Un día alguien va a copiar tu estilo. Va a pasar. ¿Qué es exactamente lo que van a querer copiarte?",
    sub: "Que copien tranquilos: el original va a llevar tu firma. Y lo que es tuyo, se puede probar.",
    type: "choice",
    options: [
      { key: "metal", title: "Herrajes y metal", desc: "Cierres a la vista, argollas, hebillas: la joyería de lo que trabaja." },
      { key: "bordado", title: "Bordado a mano", desc: "Horas de aguja que ninguna máquina puede apurar." },
      { key: "parches", title: "Parches y retazos", desc: "Pedazos de vidas distintas conviviendo en una sola prenda." },
      { key: "cortes", title: "Cortes asimétricos", desc: "Nada termina donde «debería». Eso es exactamente el punto." },
    ],
  },
];

/* ---------------- PERFIL ---------------- */

const ARQUETIPOS = {
  armadura: { nombre: "Guardián", ruta: "Diseñás desde la protección: siluetas fuertes, estructura, presencia. Tu ruta natural arranca en LAST LEATHER JACKET." },
  lienzo: { nombre: "Poeta", ruta: "Diseñás desde la expresión: superficie, color, textura como lenguaje. Los PRESIADOS y el bordado son tu territorio." },
  manifiesto: { nombre: "Manifiesto", ruta: "Diseñás desde la idea: cada prenda es una postura. La colección de temporada de la DAO te va a quedar corta — vas a querer proponer el próximo concepto." },
  juego: { nombre: "Alquimista", ruta: "Diseñás desde el juego: mezcla, prueba y error, humor. Los JUMPSUITS —una sola prenda, mil lecturas— son tu cancha." },
};

const PALETAS = {
  noche: { nombre: "Noche", colores: ["#0d0d0f", "#2b2b31", "#4a4a52", "#c9c2b4"], prompt: "deep black and charcoal palette with minimal ivory highlights" },
  tierra: { nombre: "Tierra", colores: ["#3d2b1f", "#7a4f2a", "#a97b50", "#d9c3a3"], prompt: "earthy palette of ochre, rust, tan leather and sand tones" },
  fuego: { nombre: "Fuego", colores: ["#5c1a12", "#a3341f", "#d96c2b", "#e8b04b"], prompt: "burnt orange, deep red and amber fire palette" },
  agua: { nombre: "Agua", colores: ["#0f2830", "#14434c", "#1f6f6b", "#8fb8ad"], prompt: "deep petrol blue and dark teal water palette" },
};

const MATERIALES = {
  cuero: { nombre: "Cuero recuperado", prompt: "reworked vintage leather with patina", taller: "Base: camperas/abrigos de cuero de 2ª mano en buen estado. Desarmar por paneles, conservar herrajes originales." },
  denim: { nombre: "Denim", prompt: "upcycled washed denim patchwork", taller: "Base: jeans y camisas de denim gastado. Aprovechar costuras, bolsillos y desgastes como diseño." },
  saten: { nombre: "Satén y seda", prompt: "vintage satin and silk with fluid drape", taller: "Base: camisería y forrería vintage. Cuidar caída; combinar brillos con opacos." },
  punto: { nombre: "Tejidos de punto", prompt: "deconstructed knitwear, reassembled knits", taller: "Base: sweaters de buena lana para destejer o recortar. Rematar bordes para evitar que corra el punto." },
};

const FIRMAS = {
  metal: { nombre: "Herrajes y metal", prompt: "exposed metal hardware, recycled zippers and rings as ornament" },
  bordado: { nombre: "Bordado a mano", prompt: "hand embroidery details, visible artisanal stitching" },
  parches: { nombre: "Parches y retazos", prompt: "patchwork of contrasting reclaimed fabric fragments" },
  cortes: { nombre: "Cortes asimétricos", prompt: "asymmetric cuts, raw unexpected hemlines, deconstructed silhouette" },
};

/* Los tres caminos del diseño textil, dicho simple:
   la tela se puede diseñar desde su cuerpo, desde su piel o desde su poder. */
const TELAS = {
  trama: {
    nombre: "La trama",
    simple: "Diseñar la tela desde su cuerpo: cómo se cruzan los hilos, qué textura tiene, de qué fibras nace.",
    prompt: "focus on fabric construction: visible weave, knitted texture, raw natural fibers as the design",
    taller: "El diseño vive en la construcción de la tela: entrelazados, texturas y fibras a la vista.",
  },
  piel: {
    nombre: "La piel",
    simple: "Dibujar sobre la tela: motivos, colores y patrones que se estampan encima y le dan carácter.",
    prompt: "focus on printed surface design: bold graphic patterns, motifs and color printed on the fabric",
    taller: "El diseño vive en la superficie: estampas, motivos y color aplicados sobre la tela.",
  },
  poder: {
    nombre: "El poder",
    simple: "Darle un don a la tela: que abrigue más, que no deje pasar el agua, que aguante el fuego o el movimiento.",
    prompt: "focus on technical performance fabric: functional details, waterproof or thermal utility construction",
    taller: "El diseño vive en la función: la tela hace algo — abriga, protege, resiste, acompaña el movimiento.",
  },
};

const LINEAS = [
  {
    key: "llj", num: "LÍNEA 01", nombre: "Last Leather Jacket",
    desc: "La última campera de cuero que va a hacer falta fabricar. Todo lo demás ya existe: se recupera y se transforma.",
    tag: "NFT PFP", garment: "one-of-a-kind upcycled leather jacket, reworked vintage biker silhouette",
  },
  {
    key: "jump", num: "LÍNEA 02", nombre: "Jumpsuit Presents",
    desc: "Una sola prenda, todas las identidades. El jumpsuit como uniforme de quienes hacen, no de quienes miran.",
    tag: "NFT PFP", garment: "one-of-a-kind upcycled jumpsuit, utilitarian couture overall",
  },
  {
    key: "pres", num: "LÍNEA 03", nombre: "Presiados",
    desc: "Accesorios preciados hechos de lo que sobró: lo pequeño que completa y transforma cualquier look.",
    tag: "NFT PFP", garment: "one-of-a-kind upcycled fashion accessory, statement bag or headpiece crafted from reclaimed garments",
  },
  {
    key: "dao", num: "TEMPORADA", nombre: "Colección RAÍCES FUTURAS",
    desc: "El concepto de esta temporada, votado por la comunidad: lo ancestral y lo tecnológico en una misma prenda. (Demo de gobernanza DAO.)",
    tag: "CONCEPTO DAO", garment: "avant-garde upcycled garment blending ancestral craft with futuristic techwear, seasonal capsule concept 'future roots'",
  },
];

function buildProfile() {
  const a = state.answers;
  const arquetipo =
    a.busqueda === "otro"
      ? {
          nombre: "Inclasificable",
          ruta: `Tu respuesta no entró en ninguna caja, y eso ya es un estilo: “${a.busquedaOtro}”. Diseñás desde un lugar que todavía no tiene nombre — recorré las tres líneas hasta que ese lugar tenga prenda.`,
        }
      : ARQUETIPOS[a.busqueda];
  const paleta =
    a.paleta === "otro"
      ? {
          nombre: "Propia",
          colores: ["#4a4a52", "#8a7136", "#c8a24b", "#f2ead9"],
          prompt: `custom color mood described by the designer: ${a.paletaOtro}`,
          otro: a.paletaOtro,
        }
      : PALETAS[a.paleta];
  const material =
    a.material === "otro"
      ? {
          nombre: a.materialOtro,
          prompt: `upcycled reclaimed material chosen by the designer: ${a.materialOtro}`,
          taller: `Base elegida por el/la diseñador/a: “${a.materialOtro}”. Buscarla entre prendas de 2ª mano de buena calidad o sobrantes de producción.`,
        }
      : MATERIALES[a.material];
  return {
    arquetipo,
    paleta,
    material,
    firma: FIRMAS[a.firma],
    rescate: a.rescate,
    tabu: a.tabu,
  };
}

/* ---------------- IA DE IMÁGENES (Pollinations / FLUX, sin API key) ---------------- */

function buildPrompt(variation) {
  const p = state.profile;
  const line = state.line;
  const parts = [
    "digital fashion couture, single garment product showcase, floating ghost mannequin display, displayed as two views side by side: front view and back view of the same garment, both views complete and fully visible",
    line.garment,
    p.material.prompt,
    p.paleta.prompt,
    p.firma.prompt,
    state.tela ? TELAS[state.tela].prompt : "",
    state.desc ? `design intent: ${state.desc}` : "",
    variation || "",
    "dark editorial studio backdrop, dramatic soft lighting, hyper detailed textile texture, 3d fashion render style, high fashion photography",
  ];
  return parts.filter(Boolean).join(", ");
}

function imgUrl(prompt, seed) {
  // cuadrado: cada imagen lleva frente y espalda de la prenda, lado a lado
  return `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1024&height=1024&seed=${seed}&nologo=true&model=flux`;
}

/* La IA gratuita atiende de a una imagen por vez: encolamos los pedidos
   y reintentamos solos si el servicio está saturado. */
const imgQueue = [];
let imgBusy = false;

function mountImg(cell, url, alt, delayMs = 0) {
  imgQueue.push({ cell, url, alt });
  setTimeout(processQueue, delayMs);
}

function processQueue() {
  if (imgBusy || imgQueue.length === 0) return;
  const job = imgQueue.shift();
  if (!document.body.contains(job.cell)) { processQueue(); return; }
  imgBusy = true;
  loadWithRetry(job, 0);
}

function loadWithRetry(job, attempt) {
  const { cell, url, alt } = job;
  const img = new Image();
  img.alt = alt;
  const done = () => { imgBusy = false; processQueue(); };
  img.onload = () => {
    const spin = cell.querySelector(".spin");
    if (spin) spin.remove();
    cell.querySelectorAll("img").forEach((o) => o.remove());
    img.classList.add("loaded");
    cell.appendChild(img);
    done();
  };
  img.onerror = () => {
    if (attempt < 3 && document.body.contains(cell)) {
      const spin = cell.querySelector(".spin span");
      if (spin) spin.innerHTML = `LA IA ESTÁ OCUPADA…<br>REINTENTO ${attempt + 1}/3`;
      setTimeout(() => loadWithRetry({ cell, url: url + "&r=" + Date.now(), alt }, attempt + 1), 4000 * (attempt + 1));
    } else {
      const spin = cell.querySelector(".spin");
      if (spin) spin.innerHTML = "<span>La IA no respondió.<br>Tocá para reintentar.</span>";
      cell.addEventListener("click", () => mountImg(cell, url + "&r=" + Date.now(), alt), { once: true });
      done();
    }
  };
  img.src = url;
}

/* Dictado por voz: si el navegador escucha, la respuesta también se puede decir. */
function attachMic(btn, ta, onInput) {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) {
    btn.style.display = "none";
    return;
  }
  let rec = null;
  btn.onclick = () => {
    if (rec) {
      rec.stop();
      return;
    }
    rec = new SR();
    rec.lang = "es-AR";
    rec.interimResults = false;
    btn.textContent = "● Escuchando… (tocá para frenar)";
    rec.onresult = (e) => {
      const t = Array.from(e.results).map((r) => r[0].transcript).join(" ").trim();
      if (t) ta.value = (ta.value ? ta.value.trim() + " " : "") + t;
      if (onInput) onInput();
    };
    rec.onend = () => {
      btn.textContent = "🎙 Dictar";
      rec = null;
      if (onInput) onInput();
    };
    rec.onerror = () => {};
    rec.start();
  };
}

/* ---------------- PANTALLAS ---------------- */

function render(html) {
  app.innerHTML = `<div class="fade-in">${html}</div>`;
  window.scrollTo({ top: 0 });
}

/* El figurín de la portada: croquis de moda clásico — cabeza sin rostro con su
   línea de guía, mano en la cadera, peso en una pierna — sin ropa todavía.
   Línea marfil como lápiz; la estrella-brújula del logo late donde va el corazón. */
const FIGURIN_SVG = `
<svg viewBox="0 0 220 480" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Figurín de moda esperando un diseño">
  <line x1="110" y1="6" x2="110" y2="472" stroke="#a9b0bc" stroke-width="0.5" stroke-dasharray="3 6" opacity="0.3"/>
  <g fill="none" stroke="#f2ead9" stroke-width="1.3" stroke-linecap="round">
    <ellipse cx="110" cy="34" rx="13" ry="19"/>
    <line x1="98" y1="36" x2="122" y2="36" stroke-width="0.7" opacity="0.7"/>
    <line x1="110" y1="15" x2="110" y2="53" stroke-width="0.7" opacity="0.7"/>
    <path d="M104,52 C104,58 103,62 102,66"/>
    <path d="M116,52 C116,58 117,62 118,66"/>
    <path d="M102,66 Q88,72 76,84"/>
    <path d="M118,66 Q132,70 144,80"/>
    <path d="M76,84 C80,110 90,132 92,158 C93,175 86,190 84,208"/>
    <path d="M144,80 C140,108 130,132 128,158 C127,175 136,190 138,206"/>
    <path d="M84,208 Q111,224 138,206"/>
    <path d="M144,80 C154,100 160,120 158,142 C155,164 146,182 139,196"/>
    <path d="M139,196 C141,199 140,203 137,204 C134,206 131,204 131,201"/>
    <path d="M76,84 C68,108 63,134 62,158 C61,180 59,200 58,220"/>
    <path d="M58,220 C56,228 55,234 57,240 C59,243 62,241 62,236 C62,230 61,226 60,221"/>
    <path d="M84,208 C86,260 92,320 96,370 C98,400 99,416 100,436"/>
    <path d="M108,226 C105,270 102,330 103,380 C103,406 104,422 104,436"/>
    <path d="M138,206 C136,255 128,310 122,360 C118,395 116,418 114,438"/>
    <path d="M114,226 C117,268 118,315 115,362 C113,396 112,418 111,438"/>
    <path d="M100,436 C97,444 92,450 92,453 L110,449 L104,436"/>
    <path d="M114,438 C117,446 121,452 121,455 L103,451 L111,438"/>
  </g>
  <g>
    <circle cx="110" cy="122" r="12" fill="none" stroke="#c8a24b" stroke-width="0.8" opacity="0.7"/>
    <path d="M110,108 L113.5,118.5 L124,122 L113.5,125.5 L110,136 L106.5,125.5 L96,122 L106.5,118.5 Z" fill="#c8a24b"/>
  </g>
</svg>`;

function screenLanding() {
  render(`
    <section class="landing">
      <div class="landing-grid">
        <div class="landing-copy">
          <div class="kicker">PRESENTES</div>
          <h1 class="display">Lo que buscás<br>ya vive adentro.</h1>
          <p class="lead">
            Acá no venís a comprar moda: venís a encontrarla adentro tuyo.
            La neuro-action es el primer paso del pase de upcycling: seis preguntas
            que despiertan al diseñador que ya sos. Después creás tu prenda única
            — desde tus palabras, desde tu propio boceto, o las dos cosas — y aprendés
            cómo su versión NFT puede financiar la confección real, upcycling,
            en un taller con trabajo digno.
          </p>
        </div>
        <figure class="figurin">
          ${FIGURIN_SVG}
          <figcaption>El figurín está en blanco.<br>Tu diseño lo viste.</figcaption>
        </figure>
      </div>
      <div class="doors">
        <div class="door" id="doorStart">
          <span class="door-k">Empezar</span>
          <h3>Despertar al diseñador que llevás adentro</h3>
          <p>Seis preguntas de neuro-action. Después, tu idea rectora y tu primera ficha NFT + UPCYCLING.</p>
        </div>
        <div class="door" id="doorArchivo">
          <span class="door-k">La muestra que no cierra</span>
          <h3>El archivo vivo</h3>
          <p>La colección de prendas únicas nacidas en los talleres: cada una con su historia, su boceto y su idea rectora. Siempre online.</p>
        </div>
        <div class="door" id="doorAbout">
          <span class="door-k">¿Qué es esto?</span>
          <h3>PRESENTES · NFT + UPCYCLING</h3>
          <p>Un ecosistema sin fines de lucro: tu diseño digital financia una prenda física hecha con ropa recuperada. 40% diseñador · 40% tallerista · 20% DAO.</p>
        </div>
      </div>
    </section>
  `);
  document.getElementById("doorStart").onclick = () => screenMentora(0);
  document.getElementById("doorArchivo").onclick = screenArchivo;
  document.getElementById("doorAbout").onclick = screenAbout;
}

function screenAbout() {
  render(`
    <div class="mentora-wrap">
      <div class="kicker">PRESENTES · NFT + UPCYCLING</div>
      <h1 class="display" style="font-size:clamp(28px,4.5vw,44px)">Diseñamos lo que no encontramos allá afuera.</h1>
      <p class="lead" style="margin-bottom:22px">
        Se fabrica ropa nueva como si faltara, mientras sobra ropa buena esperando otra vida.
        Y las plataformas se quedan con el valor de tu creatividad.
        PRESENTES no es un negocio: es otro lugar, donde el que siempre fue entusiasta de la moda
        por fin diseña. Así funciona:
      </p>
      <div class="ficha">
        <div class="f-block"><h4>1 · Diseñás</h4><p>Con la IA creás una prenda digital única, en una de las 3 líneas PFP o en la colección de temporada votada por la DAO.</p></div>
        <div class="f-block"><h4>2 · Minteás</h4><p>Tu diseño se convierte en NFT: un certificado digital de que ese diseño es tuyo. (En esta demo, el mint es simulado y educativo.)</p></div>
        <div class="f-block"><h4>3 · Vendés o donás</h4><p>Si tu NFT se vende, el contrato inteligente reparte automáticamente: <b>40% para vos · 40% para el tallerista que confecciona la prenda real · 20% para la tesorería DAO</b>.</p></div>
        <div class="f-block"><h4>4 · Se materializa</h4><p>Un taller la confecciona con ropa de segunda mano de buena calidad. Upcycling: nada nuevo se fabrica, todo se transforma.</p></div>
      </div>
      <div class="nav-row">
        <button class="btn ghost" id="back">Volver</button>
        <button class="btn primary" id="go">Empezar</button>
      </div>
    </div>
  `);
  document.getElementById("back").onclick = screenLanding;
  document.getElementById("go").onclick = () => screenMentora(0);
}

function screenMentora(i) {
  const q = QUESTIONS[i];
  const bars = QUESTIONS.map((_, k) => `<span class="${k <= i ? "on" : ""}"></span>`).join("");
  const body =
    q.type === "choice"
      ? `<div class="choices">${q.options
          .map(
            (o) => `
        <div class="choice" data-key="${o.key}">
          <div class="c-title">${o.title}</div>
          <div class="c-desc">${o.desc}</div>
        </div>`
          )
          .join("")}
        ${
          q.other
            ? `<div class="choice" data-key="otro">
          <div class="c-title">Otro</div>
          <div class="c-desc">Ninguna de estas. Lo digo con mis palabras — escribiendo o dictando.</div>
        </div>`
            : ""
        }</div>
        ${
          q.other
            ? `<div id="otroBlock" style="display:none;margin-top:18px">
          <textarea class="free" id="otroText" placeholder="Contalo como te salga…"></textarea>
          <div class="nav-row" style="margin-top:14px">
            <button class="btn ghost" id="otroMic">🎙 Dictar</button>
            <button class="btn primary" id="otroGo" disabled>Seguir</button>
          </div>
        </div>`
            : ""
        }`
      : `<textarea class="free" id="freeText" placeholder="${q.placeholder}"></textarea>`;

  render(`
    <div class="mentora-wrap">
      <div class="progress">${bars}</div>
      <div class="mentora-label">Neuro-action · ${i + 1} de ${QUESTIONS.length}</div>
      <div class="mentora-says">${q.says}</div>
      <div class="mentora-sub">${q.sub}</div>
      ${body}
      <div class="nav-row">
        <button class="btn ghost" id="back">${i === 0 ? "Inicio" : "Anterior"}</button>
        ${
          q.type === "text"
            ? `<div class="up-actions"><button class="btn ghost" id="micBtn">🎙 Dictar</button><button class="btn primary" id="next" disabled>Seguir</button></div>`
            : `<span></span>`
        }
      </div>
    </div>
  `);

  document.getElementById("back").onclick = () => (i === 0 ? screenLanding() : screenMentora(i - 1));

  const advance = () => { save(); i + 1 < QUESTIONS.length ? screenMentora(i + 1) : screenPerfil(); };

  if (q.type === "choice") {
    const otroBlock = document.getElementById("otroBlock");
    const otroText = document.getElementById("otroText");
    const otroGo = document.getElementById("otroGo");
    app.querySelectorAll(".choice").forEach((el) => {
      el.onclick = () => {
        app.querySelectorAll(".choice").forEach((o) => o.classList.remove("sel"));
        el.classList.add("sel");
        if (el.dataset.key === "otro") {
          otroBlock.style.display = "block";
          otroText.focus();
          return;
        }
        if (otroBlock) otroBlock.style.display = "none";
        state.answers[q.id] = el.dataset.key;
        setTimeout(advance, 220);
      };
    });
    if (q.other) {
      if (state.answers[q.id] === "otro" && state.answers[q.id + "Otro"]) {
        otroText.value = state.answers[q.id + "Otro"];
        otroBlock.style.display = "block";
        app.querySelector('.choice[data-key="otro"]').classList.add("sel");
      }
      const check = () => (otroGo.disabled = otroText.value.trim().length < 3);
      otroText.oninput = check;
      check();
      attachMic(document.getElementById("otroMic"), otroText, check);
      otroGo.onclick = () => {
        state.answers[q.id] = "otro";
        state.answers[q.id + "Otro"] = otroText.value.trim();
        advance();
      };
    }
  } else {
    const ta = document.getElementById("freeText");
    const next = document.getElementById("next");
    if (state.answers[q.id]) ta.value = state.answers[q.id];
    const check = () => (next.disabled = ta.value.trim().length < 3);
    ta.oninput = check;
    check();
    attachMic(document.getElementById("micBtn"), ta, check);
    next.onclick = () => {
      state.answers[q.id] = ta.value.trim();
      advance();
    };
  }
}

function screenPerfil() {
  state.profile = buildProfile();
  const p = state.profile;
  const gano = earnPress(10, "perfil");
  render(`
    <div class="perfil-card">
      <div class="kicker">La neuro-action te devuelve el espejo</div>
      ${gano ? `<div class="press-earn">⬢ +10 ES · tu neuro-action ya vale</div>` : ""}
      <div class="arquetipo">${p.arquetipo.nombre}</div>
      <p class="lead" style="max-width:100%">${p.arquetipo.ruta}</p>
      <div class="perfil-grid">
        <div>
          <div class="pg-k">Tu paleta · ${p.paleta.nombre}</div>
          <div class="swatches">${p.paleta.colores.map((c) => `<i style="background:${c}"></i>`).join("")}</div>
          ${p.paleta.otro ? `<div class="pg-v" style="margin-top:8px">“${p.paleta.otro}”</div>` : ""}
        </div>
        <div><div class="pg-k">Tu material</div><div class="pg-v">${p.material.nombre}</div></div>
        <div><div class="pg-k">Tu firma</div><div class="pg-v">${p.firma.nombre}</div></div>
        <div><div class="pg-k">Tu rescate</div><div class="pg-v">“${p.rescate}”</div></div>
        <div style="grid-column:1/-1"><div class="pg-k">El tabú que venís a romper</div><div class="pg-v">“${p.tabu}”</div></div>
      </div>
      <div class="nav-row">
        <button class="btn ghost" id="back">Revisar respuestas</button>
        <button class="btn primary" id="go">Diseñar mi primera prenda</button>
      </div>
    </div>
  `);
  document.getElementById("back").onclick = () => screenMentora(0);
  document.getElementById("go").onclick = screenLineas;
}

function screenLineas() {
  render(`
    <div>
      <div class="kicker">Elegí tu territorio</div>
      <h1 class="display" style="font-size:clamp(28px,4.5vw,44px)">Tres líneas fijas.<br>Un concepto de temporada.</h1>
      <p class="lead">Las líneas PFP son permanentes: tu prenda puede volverse tu foto de perfil, tu identidad. La colección de temporada la vota la comunidad DAO y cambia como toda colección de moda.</p>
      <div class="lineas-grid">
        ${LINEAS.map(
          (l) => `
          <div class="linea ${l.key === "dao" ? "dao" : ""}" data-key="${l.key}">
            <div class="l-num">${l.num}</div>
            <h3>${l.nombre}</h3>
            <p>${l.desc}</p>
            <span class="l-tag">${l.tag}</span>
          </div>`
        ).join("")}
      </div>
      <div class="nav-row"><button class="btn ghost" id="back">Volver a mi perfil</button><span></span></div>
    </div>
  `);
  document.getElementById("back").onclick = screenPerfil;
  app.querySelectorAll(".linea").forEach((el) => {
    el.onclick = () => {
      state.line = LINEAS.find((l) => l.key === el.dataset.key);
      save();
      screenDescribe();
    };
  });
}

function screenDescribe() {
  const p = state.profile;
  render(`
    <div class="mentora-wrap">
      <div class="mentora-label">Neuro-action</div>
      <div class="mentora-says">Mostrá la prenda que ves cuando cerrás los ojos.</div>
      <div class="mentora-sub">
        Estás diseñando en <b style="color:var(--gold)">${state.line.nombre}</b>, con tu paleta ${p.paleta.nombre.toLowerCase()},
        tu ${p.material.nombre.toLowerCase()} y tu firma de ${p.firma.nombre.toLowerCase()}.
        Podés contarla con palabras, subir tu propio boceto, o las dos cosas.
      </div>
      <div class="mentora-label">Con palabras · escritas o dictadas · la IA la materializa</div>
      <textarea class="free" id="desc" placeholder="Ej.: una campera con el cuello desmontable, bordada con flores nativas, que se pueda usar de día y de noche…">${state.desc || ""}</textarea>
      <div class="up-actions" style="margin-top:10px"><button class="btn ghost" id="descMic">🎙 Dictar</button></div>
      <div class="mentora-label" style="margin-top:30px">Con tu boceto o una foto · tu trazo también diseña</div>
      <div class="upload-box">
        ${
          state.sketch
            ? `<img src="${state.sketch}" alt="Tu boceto" />`
            : `<span>Dibujalo en un papel y sacale una foto. Garabatealo con el dedo en el celular.
               Recortá y pegá. Está hecho con tu mano, y eso ya lo hace único.
               <b>No hace falta ser gran dibujante: si transmite lo que imaginás, sirve.</b></span>`
        }
        <input type="file" id="upInput" accept="image/*" hidden />
        <div class="up-actions">
          <button class="btn ghost" id="upBtn">${state.sketch ? "Cambiar" : "Subir boceto o imagen"}</button>
          ${state.sketch ? `<button class="btn ghost" id="upDel">Quitar</button>` : ""}
        </div>
      </div>
      <div class="mentora-label" style="margin-top:30px">¿Desde dónde nace tu tela? · elegí un camino (opcional)</div>
      <div class="choices" style="grid-template-columns:repeat(auto-fit,minmax(200px,1fr))">
        ${Object.entries(TELAS)
          .map(
            ([k, t]) => `
          <div class="choice tela ${state.tela === k ? "sel" : ""}" data-key="${k}">
            <div class="c-title">${t.nombre}</div>
            <div class="c-desc">${t.simple}</div>
          </div>`
          )
          .join("")}
      </div>
      <div class="nav-row">
        <button class="btn ghost" id="back">Cambiar de línea</button>
        <button class="btn primary" id="go" disabled>Ver las visiones</button>
      </div>
    </div>
  `);
  const ta = document.getElementById("desc");
  const go = document.getElementById("go");
  const check = () => (go.disabled = ta.value.trim().length < 5 && !state.sketch);
  ta.oninput = check;
  check();
  attachMic(document.getElementById("descMic"), ta, check);

  const upInput = document.getElementById("upInput");
  document.getElementById("upBtn").onclick = () => upInput.click();
  upInput.onchange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const img = new Image();
    img.onload = () => {
      const max = 900;
      const k = Math.min(1, max / Math.max(img.width, img.height));
      const cv = document.createElement("canvas");
      cv.width = Math.round(img.width * k);
      cv.height = Math.round(img.height * k);
      cv.getContext("2d").drawImage(img, 0, 0, cv.width, cv.height);
      state.sketch = cv.toDataURL("image/jpeg", 0.85);
      state.desc = ta.value.trim();
      save();
      screenDescribe();
    };
    img.src = URL.createObjectURL(file);
  };
  const upDel = document.getElementById("upDel");
  if (upDel)
    upDel.onclick = () => {
      state.sketch = null;
      state.desc = ta.value.trim();
      save();
      screenDescribe();
    };

  app.querySelectorAll(".choice.tela").forEach((el) => {
    el.onclick = () => {
      state.tela = state.tela === el.dataset.key ? null : el.dataset.key;
      app.querySelectorAll(".choice.tela").forEach((o) => o.classList.toggle("sel", o.dataset.key === state.tela));
    };
  });
  document.getElementById("back").onclick = screenLineas;
  go.onclick = () => {
    state.desc = ta.value.trim();
    state.seeds = Array.from({ length: 4 }, () => Math.floor(Math.random() * 999999));
    state.chosen = null;
    save();
    screenOpciones();
  };
}

const VARIATIONS = [
  "classic faithful interpretation",
  "avant-garde bold interpretation",
  "refined minimal interpretation",
  "richly detailed maximal interpretation",
];

function screenOpciones() {
  const conBoceto = !!state.sketch;
  render(`
    <div>
      <div class="kicker">Elegí tu idea rectora</div>
      <h1 class="display" style="font-size:clamp(26px,4vw,40px)">${conBoceto ? "Tu boceto y cuatro visiones." : "Cuatro visiones de tu prenda."}</h1>
      <p class="lead">Cada visión muestra tu prenda de frente y de espalda.
      La idea rectora es la que le da coherencia a todo: de ella nace tu capsule collection.
      ${conBoceto ? "Tu boceto compite de igual a igual con la IA — y puede ganar." : "Elegí la que te reconozca."}</p>
      <div class="gen-grid" id="grid">
        ${
          conBoceto
            ? `<div class="gen-cell" data-i="-1">
                 <span class="cell-tag">TU BOCETO</span>
                 <img src="${state.sketch}" class="loaded" alt="Tu boceto" />
               </div>`
            : ""
        }
        ${state.seeds
          .map(
            (s, i) => `
          <div class="gen-cell" data-i="${i}">
            <div class="spin"><div class="loader"></div><span>TEJIENDO ${i + 1}/4…</span></div>
          </div>`
          )
          .join("")}
      </div>
      <div class="nav-row">
        <button class="btn ghost" id="back">Volver al diseño</button>
        <button class="btn" id="regen">Regenerar las 4 de IA</button>
      </div>
    </div>
  `);
  document.getElementById("back").onclick = screenDescribe;
  document.getElementById("regen").onclick = () => {
    state.seeds = Array.from({ length: 4 }, () => Math.floor(Math.random() * 999999));
    screenOpciones();
  };
  const elegir = (i) => {
    state.chosen = i;
    state.minted = false;
    state.tokenId = null;
    state.capsuleSeeds = Array.from({ length: 3 }, () => Math.floor(Math.random() * 999999));
    earnPress(15, "rector");
    save();
    screenAtelier("nft");
  };
  app.querySelectorAll(".gen-cell").forEach((cell) => {
    const i = Number(cell.dataset.i);
    if (i === -1) {
      cell.addEventListener("click", () => elegir(-1));
      return;
    }
    mountImg(cell, imgUrl(buildPrompt(VARIATIONS[i]), state.seeds[i]), `Visión ${i + 1}`);
    cell.addEventListener("click", () => {
      if (!cell.querySelector("img.loaded")) return;
      elegir(i);
    });
  });
}

/* ---------------- ARCHIVO VIVO ----------------
   La muestra que nunca cierra: la colección oficial vive en archivo.json
   (siempre online, en el repo) y el archivo personal en este dispositivo.
   Los diseños locales se exportan en .json para sumarse a la colección oficial. */

function archivoLocal() {
  try { return JSON.parse(localStorage.getItem("presentes-archivo") || "[]"); } catch (_) { return []; }
}
function archivoGuardar(list) {
  try { localStorage.setItem("presentes-archivo", JSON.stringify(list)); } catch (_) {}
}

function entradaActual() {
  const p = state.profile;
  return {
    nombre: pieceName(),
    linea: state.line.nombre,
    arquetipo: p.arquetipo.nombre,
    narrativa: pieceStory(),
    imagen: state.chosen === -1 ? state.sketch : imgUrl(buildPrompt(VARIATIONS[state.chosen]), state.seeds[state.chosen]),
    origen: state.chosen === -1 ? "Boceto a mano del diseñador/a" : "IA desde las palabras del diseñador/a",
    fecha: new Date().toISOString().slice(0, 10),
  };
}

function cardArchivo(e) {
  return `
    <figure title="${(e.narrativa || "").replace(/"/g, "&quot;")}">
      <div class="gen-cell" style="cursor:default"><div class="spin"><div class="loader"></div></div></div>
      <figcaption>${e.nombre} · ${e.linea}<br>
        <span style="color:var(--gold)">${e.arquetipo}</span> · ${e.fecha}<br>${e.origen || ""}</figcaption>
    </figure>`;
}

function montarCards(cont, entradas) {
  cont.innerHTML = entradas.map(cardArchivo).join("");
  cont.querySelectorAll(".gen-cell").forEach((cell, i) => mountImg(cell, entradas[i].imagen, entradas[i].nombre));
}

async function screenArchivo() {
  render(`
    <div>
      <div class="kicker">El archivo vivo · siempre online</div>
      <h1 class="display" style="font-size:clamp(28px,4.5vw,44px)">Nada acá se fabricó nuevo.<br>Todo acá es único.</h1>
      <p class="lead">
        Cada prenda de este archivo nació de una neuro-action, una prenda rescatada y una idea rectora.
        La colección crece con cada taller — y no cierra nunca.
      </p>
      <div class="mentora-label" style="margin-top:34px">Colección oficial</div>
      <div class="capsula-grid" id="gOficial"><p style="color:var(--ivory-dim);font-size:13px">Abriendo el archivo…</p></div>
      <div class="mentora-label" style="margin-top:38px">Tu archivo en este dispositivo</div>
      <div class="capsula-grid" id="gLocal"></div>
      <div class="nav-row">
        <button class="btn ghost" id="back">Inicio</button>
        <button class="btn ghost" id="dlArchivo">Descargar mi archivo (.json)</button>
      </div>
      <p class="mentora-sub" style="margin-top:14px">
        ¿Querés que tus diseños entren a la colección oficial? Descargá tu archivo y mandáselo
        a la curaduría del taller: cada temporada se suman nuevas prendas.
      </p>
    </div>
  `);
  document.getElementById("back").onclick = screenLanding;

  const locals = archivoLocal();
  const gLocal = document.getElementById("gLocal");
  if (locals.length) montarCards(gLocal, locals);
  else gLocal.innerHTML = `<p style="color:var(--ivory-dim);font-size:13px;grid-column:1/-1">Todavía no sumaste diseños desde este dispositivo. Diseñá tu prenda y tocá “Sumar al archivo vivo”.</p>`;

  document.getElementById("dlArchivo").onclick = () => {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([JSON.stringify(locals, null, 2)], { type: "application/json" }));
    a.download = "mi_archivo_presentes.json";
    a.click();
    URL.revokeObjectURL(a.href);
  };

  try {
    const res = await fetch("archivo.json", { cache: "no-store" });
    const oficial = await res.json();
    montarCards(document.getElementById("gOficial"), oficial);
  } catch (_) {
    document.getElementById("gOficial").innerHTML = `<p style="color:var(--ivory-dim);font-size:13px;grid-column:1/-1">La colección oficial no se pudo abrir ahora. Probá de nuevo en un rato.</p>`;
  }
}

/* ---------------- EL PERCHERO ----------------
   El mercado de PRESENTES: acá solo se cuelga indumentaria NFT — nada más entra.
   No aparece al principio: se descubre después del diseño, y colgar es opcional.
   Los diseños flotan de sus perchas, fuera del mercado común y corriente.
   Cada adopción reparte 40% diseñador · 40% tallerista · 20% DAO y
   financia la confección IRL. Acá, versión educativa con tokens ES. */

const PERCHA_SVG = `<svg class="percha-svg" viewBox="0 0 64 26" aria-hidden="true">
  <path d="M32 2 a3.2 3.2 0 1 1 -3.2 3.2 M32 8.5 v4 L7 22 h50 L32 12.5"
        fill="none" stroke="#c8a24b" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

function percheroLocal() {
  try { return JSON.parse(localStorage.getItem("presentes-perchero") || "[]"); } catch (_) { return []; }
}
function percheroGuardar(list) {
  try { localStorage.setItem("presentes-perchero", JSON.stringify(list)); } catch (_) {}
}
function adoptados() {
  try { return JSON.parse(localStorage.getItem("presentes-adoptados") || "[]"); } catch (_) { return []; }
}
function marcarAdoptado(nombre) {
  const l = adoptados();
  if (!l.includes(nombre)) l.push(nombre);
  try { localStorage.setItem("presentes-adoptados", JSON.stringify(l)); } catch (_) {}
}

function cardPerchero(item, idx, esMio) {
  const adoptado = adoptados().includes(item.nombre);
  const precioChip = item.donacion
    ? `<span class="precio-chip donacion">DONACIÓN</span>`
    : `<span class="precio-chip">⬢ ${item.precio} ES</span>`;
  return `
    <div class="colgado" style="animation-delay:${(idx % 5) * -1.3}s" title="${(item.narrativa || "").replace(/"/g, "&quot;")}">
      ${PERCHA_SVG}
      <div class="colgado-cuerpo">
        <div class="gen-cell" style="cursor:default"><div class="spin"><div class="loader"></div></div></div>
        <div class="colgado-info">
          <div class="c-title" style="font-size:17px">${item.nombre}</div>
          <div class="c-desc">${item.linea} · ${item.arquetipo} · 1/1</div>
          <div class="colgado-acciones">
            ${precioChip}
            ${
              esMio
                ? `<span class="cell-tag" style="position:static">TU DISEÑO</span>`
                : adoptado
                ? `<span class="mint-done" style="font-size:10px">✦ ADOPTADO</span>`
                : `<button class="btn adoptar-btn" data-idx="${idx}" data-mio="${esMio}">Adoptar</button>`
            }
          </div>
          <div class="adoptar-msg" id="msg-${idx}"></div>
        </div>
      </div>
    </div>`;
}

function montarPerchero(cont, items, esMio) {
  cont.innerHTML = items.map((it, i) => cardPerchero(it, i, esMio)).join("");
  cont.querySelectorAll(".gen-cell").forEach((cell, i) => mountImg(cell, items[i].imagen, items[i].nombre));
  cont.querySelectorAll(".adoptar-btn").forEach((b) => {
    b.onclick = () => {
      const item = items[Number(b.dataset.idx)];
      const msg = cont.querySelector(`#msg-${b.dataset.idx}`);
      const precio = item.donacion ? 0 : item.precio;
      if (state.press < precio) {
        msg.innerHTML = `Te faltan <b style="color:var(--gold)">⬢ ${precio - state.press} ES</b>. Se ganan creando: diseñá, minteá, sumá al archivo.`;
        return;
      }
      state.press -= precio;
      save();
      updatePressChip(true);
      marcarAdoptado(item.nombre);
      b.remove();
      msg.innerHTML = `<span class="mint-done">✦ Diseño adoptado.</span><br>
        El contrato repartió: <b>40% diseñador · 40% tallerista · 20% DAO</b>.<br>
        La prenda IRL entra en cola de confección upcycling. Regalía del diseñador en cada reventa.`;
    };
  });
}

async function screenPerchero() {
  render(`
    <div>
      <div class="kicker">El Perchero · un mercado flotando fuera del mercado</div>
      <h1 class="display" style="font-size:clamp(28px,4.5vw,44px)">Acá no se compra ropa.<br>Se adopta un diseño.</h1>
      <p class="lead">
        En El Perchero solo se cuelga <b>indumentaria NFT</b> — nada más entra, por definición de percha.
        Cada pieza es única (1/1), se paga en tokens ES, y cada adopción financia la confección real
        de la prenda por un tallerista. Los diseños se mecen solos: no hay góndolas, no hay temporada de liquidación,
        no hay talle único. Hay perchas.
      </p>
      <div class="mentora-label" style="margin-top:34px">Colgados por la comunidad</div>
      <div class="perchero-grid" id="pOficial"><p style="color:var(--ivory-dim);font-size:13px">Acomodando las perchas…</p></div>
      <div class="mentora-label" style="margin-top:38px">Tus diseños colgados</div>
      <div class="perchero-grid" id="pMios"></div>
      <div class="nav-row">
        <button class="btn ghost" id="back">Inicio</button>
        <span class="press-earn" style="margin:0">⬢ Tu saldo: ${state.press} ES</span>
      </div>
    </div>
  `);
  document.getElementById("back").onclick = screenLanding;

  const mios = percheroLocal();
  const pMios = document.getElementById("pMios");
  if (mios.length) montarPerchero(pMios, mios, true);
  else pMios.innerHTML = `<p style="color:var(--ivory-dim);font-size:13px;grid-column:1/-1">Todavía no colgaste ningún diseño. Es opcional, siempre: tu NFT puede quedarse solo tuyo.</p>`;

  try {
    const res = await fetch("perchero.json", { cache: "no-store" });
    const oficial = await res.json();
    montarPerchero(document.getElementById("pOficial"), oficial, false);
  } catch (_) {
    document.getElementById("pOficial").innerHTML = `<p style="color:var(--ivory-dim);font-size:13px;grid-column:1/-1">El Perchero no se pudo abrir ahora. Probá en un rato.</p>`;
  }
}

/* ---------------- MOLDERÍA BASE ----------------
   Trazado geométrico simplificado a partir de medidas del cuerpo.
   Los SVG llevan unidades reales en cm: impresos al 100%, son moldes de verdad.
   Cada hoja incluye un cuadrado de control de 5 cm para verificar la escala. */

const MEDIDAS_DEF = { busto: 92, cintura: 76, cadera: 98, espalda: 36, talle: 42, manga: 58, cuello: 37 };

const MEDIDAS_CAMPOS = [
  ["busto", "Contorno de busto/pecho"],
  ["cintura", "Contorno de cintura"],
  ["cadera", "Contorno de cadera"],
  ["espalda", "Ancho de espalda"],
  ["talle", "Largo de talle"],
  ["manga", "Largo de manga"],
  ["cuello", "Contorno de cuello"],
];

function moldeSVG(nombre, w, h, inner) {
  // hoja: margen 1.5cm + 3cm arriba para título; cuadrado de control de 5cm
  const W = w + 3, H = h + 6;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}cm" height="${H}cm" viewBox="0 0 ${W} ${H}">
  <rect x="0" y="0" width="${W}" height="${H}" fill="#faf6ec"/>
  <text x="1.5" y="1.6" font-size="1.1" font-family="sans-serif" fill="#222" letter-spacing="0.1">PRESENTES · ${nombre}</text>
  <g transform="translate(1.5,3)">${inner}</g>
  <g transform="translate(${W - 6.5},${H - 6.5})">
    <rect width="5" height="5" fill="none" stroke="#222" stroke-width="0.05"/>
    <text x="2.5" y="2.8" font-size="0.7" font-family="sans-serif" fill="#222" text-anchor="middle">5 cm</text>
  </g>
</svg>`;
  return { nombre, svg };
}

function hilo(x, y1, y2) {
  return `<line x1="${x}" y1="${y1}" x2="${x}" y2="${y2}" stroke="#222" stroke-width="0.05"/>
  <path d="M ${x - 0.4} ${y1 + 0.8} L ${x} ${y1} L ${x + 0.4} ${y1 + 0.8}" fill="none" stroke="#222" stroke-width="0.05"/>
  <text x="${x + 0.4}" y="${(y1 + y2) / 2}" font-size="0.7" font-family="sans-serif" fill="#222" transform="rotate(90 ${x + 0.4} ${(y1 + y2) / 2})">HILO</text>`;
}

function bloqueEspalda(m) {
  const w = m.busto / 4 + 2, h = m.talle;
  const sisa = m.busto / 6 + 5, eW = m.cuello / 6 + 0.5, drop = 4, hom = m.espalda / 2;
  const inner = `
  <path d="M 0 ${h} L 0 1.5 Q ${eW * 0.4} 0.2 ${eW} 0 L ${hom} ${drop} Q ${hom + 0.6} ${sisa * 0.8} ${w} ${sisa} L ${w} ${h} Z"
        fill="none" stroke="#222" stroke-width="0.08"/>
  ${hilo(w * 0.55, sisa + 2, h - 2)}
  <text x="${w * 0.18}" y="${h * 0.6}" font-size="0.9" font-family="sans-serif" fill="#222">ESPALDA</text>
  <text x="${w * 0.18}" y="${h * 0.6 + 1.4}" font-size="0.7" font-family="sans-serif" fill="#555">corte 1 · al doblez (centro espalda)</text>`;
  return moldeSVG("ESPALDA BASE", w, h, inner);
}

function bloqueDelantero(m) {
  const w = m.busto / 4 + 3, h = m.talle + 1;
  const sisa = m.busto / 6 + 5, eW = m.cuello / 6 + 1, eD = m.cuello / 6 + 2, drop = 4.5, hom = m.espalda / 2;
  const inner = `
  <path d="M 0 ${h} L 0 ${eD} Q ${eW * 0.15} ${eD * 0.25} ${eW} 0 L ${hom} ${drop} Q ${hom + 0.6} ${sisa * 0.8} ${w} ${sisa} L ${w} ${h} Z"
        fill="none" stroke="#222" stroke-width="0.08"/>
  ${hilo(w * 0.55, sisa + 2, h - 2)}
  <text x="${w * 0.18}" y="${h * 0.6}" font-size="0.9" font-family="sans-serif" fill="#222">DELANTERO</text>
  <text x="${w * 0.18}" y="${h * 0.6 + 1.4}" font-size="0.7" font-family="sans-serif" fill="#555">corte 1 · al doblez (centro delantero)</text>`;
  return moldeSVG("DELANTERO BASE", w, h, inner);
}

function bloqueManga(m) {
  const largo = m.manga, ancho = m.busto / 3 + 4;
  const cabeza = (m.busto / 6 + 5) * 0.75, punio = ancho * 0.65;
  const px1 = (ancho - punio) / 2, px2 = ancho - px1, cx = ancho / 2;
  const inner = `
  <path d="M ${cx} 0 Q ${ancho * 0.85} ${cabeza * 0.25} ${ancho} ${cabeza} L ${px2} ${largo} L ${px1} ${largo} L 0 ${cabeza} Q ${ancho * 0.15} ${cabeza * 0.25} ${cx} 0 Z"
        fill="none" stroke="#222" stroke-width="0.08"/>
  ${hilo(cx, cabeza + 2, largo - 2)}
  <text x="${cx - 2.5}" y="${largo * 0.55}" font-size="0.9" font-family="sans-serif" fill="#222">MANGA</text>
  <text x="${cx - 2.5}" y="${largo * 0.55 + 1.4}" font-size="0.7" font-family="sans-serif" fill="#555">corte 2</text>`;
  return moldeSVG("MANGA BASE", ancho, largo, inner);
}

function bloqueBolso() {
  const w = 35, h = 40;
  const inner = `
  <rect x="0" y="0" width="${w}" height="${h}" fill="none" stroke="#222" stroke-width="0.08"/>
  ${hilo(w * 0.5, 3, h - 3)}
  <text x="3" y="${h * 0.5}" font-size="0.9" font-family="sans-serif" fill="#222">CUERPO DEL BOLSO · corte 2</text>
  <rect x="0" y="${h + 2}" width="${w * 0.86}" height="8" fill="none" stroke="#222" stroke-width="0.08"/>
  <text x="3" y="${h + 6.8}" font-size="0.9" font-family="sans-serif" fill="#222">MANIJA · corte 2 (doblar a lo largo)</text>`;
  return moldeSVG("BOLSO BASE (PRESIADO)", w, h + 10, inner);
}

function trazarMoldes(m, lineKey) {
  if (lineKey === "pres") return [bloqueBolso()];
  return [bloqueEspalda(m), bloqueDelantero(m), bloqueManga(m)];
}

function dlSVG(nombre, svg) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
  a.download = "PRESENTES_" + nombre.replace(/[^A-Za-z0-9]+/g, "_") + ".svg";
  a.click();
  URL.revokeObjectURL(a.href);
}

/* ---------------- ATELIER FINAL ---------------- */

function pieceName() {
  const p = state.profile;
  const nucleos = { llj: "JACKET", jump: "JUMPSUIT", pres: "PRESIADO", dao: "RAÍZ" };
  const seed = state.chosen === -1 ? state.seeds[0] || 111 : state.seeds[state.chosen];
  return `${nucleos[state.line.key]} ${p.paleta.nombre.toUpperCase()} Nº ${String(seed).slice(0, 3)}`;
}

function pieceStory() {
  const p = state.profile;
  const origen = state.chosen === -1 ? "Nacida de un boceto a mano alzada" : "Nacida de la neuro-action";
  return `${origen} de un ${p.arquetipo.nombre}, esta prenda rompe un tabú: “${p.tabu}”. ` +
    `Lleva la memoria de un rescate —“${p.rescate}”— y la firma de ${p.firma.nombre.toLowerCase()}. ` +
    `Su versión física espera ser confeccionada en ${p.material.nombre.toLowerCase()}, con ropa que ya existía. One of a kind.`;
}

function screenAtelier(tab) {
  const rectorUrl =
    state.chosen === -1 ? state.sketch : imgUrl(buildPrompt(VARIATIONS[state.chosen]), state.seeds[state.chosen]);
  const tabs = [
    ["nft", "Ficha NFT"],
    ["mint", "Mint + Reparto"],
    ["capsula", "Cápsula"],
    ["taller", "Ficha de taller"],
    ["perfil", "Mi perfil"],
  ];
  render(`
    <div>
      <div class="kicker">Tu atelier · ${state.line.nombre}</div>
      <h1 class="display" style="font-size:clamp(26px,4vw,40px)">${pieceName()}</h1>
      <div class="tabs">
        ${tabs.map(([k, t]) => `<button class="tab ${k === tab ? "on" : ""}" data-tab="${k}">${t}</button>`).join("")}
      </div>
      <div id="tabBody"></div>
      <div class="print-row">
        <button class="btn ghost" id="back">Elegir otra visión</button>
        <button class="btn ghost" id="printBtn">Imprimir / guardar PDF</button>
        <button class="btn" id="archBtn">Sumar al archivo vivo</button>
        <button class="btn ghost" id="verArchivo">Ver el archivo</button>
        <button class="btn" id="restart">Nueva sesión</button>
      </div>
    </div>
  `);
  app.querySelectorAll(".tab").forEach((b) => (b.onclick = () => screenAtelier(b.dataset.tab)));
  document.getElementById("back").onclick = screenOpciones;
  document.getElementById("printBtn").onclick = () => window.print();
  document.getElementById("verArchivo").onclick = screenArchivo;
  const archBtn = document.getElementById("archBtn");
  const yaEnArchivo = archivoLocal().some((e) => e.nombre === pieceName());
  if (yaEnArchivo) {
    archBtn.textContent = "✓ En tu archivo";
    archBtn.disabled = true;
  }
  archBtn.onclick = () => {
    const list = archivoLocal();
    if (!list.some((e) => e.nombre === pieceName())) {
      list.unshift(entradaActual());
      archivoGuardar(list);
      earnPress(5, "archivo");
    }
    archBtn.textContent = "✓ En tu archivo";
    archBtn.disabled = true;
  };
  document.getElementById("restart").onclick = () => {
    Object.assign(state, { answers: {}, profile: null, line: null, tela: null, sketch: null, desc: "", seeds: [], chosen: null, minted: false, tokenId: null, capsuleSeeds: [], medidas: null, press: 0, pressHitos: { perfil: false, rector: false, mint: false, archivo: false, percha: false } });
    updatePressChip();
    try { sessionStorage.removeItem("presentes-estudio"); } catch (_) {}
    screenLanding();
  };

  const body = document.getElementById("tabBody");
  const p = state.profile;

  if (tab === "nft") {
    body.innerHTML = `
      <div class="nft-layout fade-in">
        <div class="nft-frame gen-cell" style="aspect-ratio:1/1;cursor:default">
          <div class="spin"><div class="loader"></div></div>
        </div>
        <div class="nft-meta">
          <div class="n-name">${pieceName()}</div>
          <div class="n-line">${state.line.nombre} · ${state.line.tag}</div>
          <p class="n-story">${pieceStory()}</p>
          <div class="meta-rows">
            <div class="meta-row"><span class="k">Diseñador/a</span><span class="v">${p.arquetipo.nombre} (vos)</span></div>
            <div class="meta-row"><span class="k">Origen</span><span class="v">${state.chosen === -1 ? "Boceto a mano del diseñador/a" : "Generada con IA desde tus palabras"}</span></div>
            <div class="meta-row"><span class="k">Edición</span><span class="v">1 de 1 · One of a Kind</span></div>
            <div class="meta-row"><span class="k">Estado</span><span class="v">${state.minted ? "Minteado (simulado)" : "Listo para mint"}</span></div>
            <div class="meta-row"><span class="k">Destino físico</span><span class="v">Confección upcycling en taller aliado</span></div>
          </div>
          <div class="up-actions" style="margin-top:22px">
            <button class="btn ghost" id="dlBtn">Descargar imagen</button>
            <button class="btn" id="verMolde">La moldería de tu diseño →</button>
          </div>
        </div>
      </div>`;
    mountImg(body.querySelector(".nft-frame"), rectorUrl, pieceName());
    document.getElementById("verMolde").onclick = () => screenAtelier("taller");
    document.getElementById("dlBtn").onclick = async () => {
      const nombre = pieceName().replace(/\s+/g, "_").replace(/[ºª]/g, "") + ".jpg";
      try {
        const res = await fetch(rectorUrl);
        const blob = await res.blob();
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = nombre;
        a.click();
        URL.revokeObjectURL(a.href);
      } catch (_) {
        window.open(rectorUrl, "_blank");
      }
    };
  }

  if (tab === "mint") {
    body.innerHTML = `
      <div class="fade-in" style="max-width:720px">
        <p class="lead" style="margin-bottom:8px">
          Mintear es certificar en blockchain que este diseño es tuyo. Cuando tu NFT se vende,
          un contrato inteligente reparte el valor automáticamente, sin intermediarios:
        </p>
        <div class="split-bars">
          <div class="sp-d" style="width:40%">40% VOS</div>
          <div class="sp-t" style="width:40%">40% TALLERISTA</div>
          <div class="sp-dao" style="width:20%">20% DAO</div>
        </div>
        <div class="split-legend">
          <span><b>40% diseñador/a</b> — tu creatividad vale.</span>
          <span><b>40% tallerista</b> — financia la confección real, con trabajo digno.</span>
          <span><b>20% tesorería DAO</b> — sostiene la plataforma y futuros talleres.</span>
        </div>
        <div class="mint-box" id="mintBox">
          ${
            state.minted
              ? mintReceipt()
              : `<p style="margin-bottom:14px">Esta demo es <b>educativa</b>: el mint no toca ninguna blockchain real, pero el proceso es idéntico al verdadero.</p>
                 <button class="btn primary" id="mintBtn">Mintear NFT (simulado)</button>`
          }
        </div>
        ${
          state.minted
            ? `<div class="f-block" style="margin-top:26px;border:1px dashed var(--gold-soft);padding:22px 24px;background:var(--bg-soft)">
          <h4 style="font-size:11px;letter-spacing:0.26em;text-transform:uppercase;color:var(--gold);margin-bottom:12px">El Perchero · opcional, siempre</h4>
          <div id="colgarBox">
          ${
            percheroLocal().some((e) => e.nombre === pieceName())
              ? `<p style="font-size:14px;line-height:1.7"><span class="mint-done">✦ Tu diseño está colgado.</span> Se mece en El Perchero esperando ser adoptado.</p>`
              : `<p style="font-size:14px;line-height:1.7;margin-bottom:14px">
              Si querés, colgá tu NFT en <b>El Perchero</b>: el mercado de PRESENTES donde solo
              se cuelga indumentaria, se paga en ES y cada adopción financia la prenda real.
              Tu diseño puede también quedarse solo tuyo — colgarlo es una elección, no un destino.</p>
            <div class="up-actions" style="align-items:center">
              <input type="number" id="precioES" value="100" min="0" max="9999" style="width:110px;background:var(--bg);border:1px solid var(--line);color:var(--ivory);padding:12px;font-family:var(--sans);font-size:15px" /> <span style="font-size:12px;color:var(--ivory-dim)">ES</span>
              <button class="btn primary" id="colgarVenta">Colgar a la venta</button>
              <button class="btn ghost" id="colgarDon">Colgar en donación</button>
            </div>`
          }
          </div>
          <div class="up-actions" style="margin-top:14px"><button class="btn ghost" id="irPerchero">Entrar a El Perchero →</button></div>
        </div>`
            : ""
        }
        <div class="f-block" style="margin-top:26px;border:1px solid var(--line);padding:22px 24px;background:var(--bg-soft)">
          <h4 style="font-size:11px;letter-spacing:0.26em;text-transform:uppercase;color:var(--gold);margin-bottom:12px">⬢ Token ES · tu saldo: ${state.press}</h4>
          <p style="font-size:14px;line-height:1.7">
            ES es la moneda de PRESENTES. En el campo argentino ya existen tokens que valen granos de verdad:
            cada token, un grano guardado en un silo real. ES funciona igual, pero su respaldo es otro:
            <b>trabajo real de upcycling</b> — prendas confeccionadas, horas de taller, diseños que se materializan.
            Hoy es una prueba: lo ganás usando la app. Mañana, cuando tu NFT se venda, tu 40% llega en ES
            — y con ES votás qué hace la comunidad después.
          </p>
        </div>
      </div>`;
    const btn = document.getElementById("mintBtn");
    if (btn)
      btn.onclick = () => {
        btn.disabled = true;
        btn.textContent = "Firmando en la red…";
        setTimeout(() => {
          state.minted = true;
          state.tokenId = "PRES-" + Math.random().toString(16).slice(2, 10).toUpperCase();
          earnPress(25, "mint");
          save();
          screenAtelier("mint");
        }, 1600);
      };
    const irPerchero = document.getElementById("irPerchero");
    if (irPerchero) irPerchero.onclick = screenPerchero;
    const colgar = (donacion) => {
      const precio = donacion ? 0 : Math.max(0, parseInt(document.getElementById("precioES").value, 10) || 0);
      const list = percheroLocal();
      if (!list.some((e) => e.nombre === pieceName())) {
        list.unshift({ ...entradaActual(), precio, donacion });
        percheroGuardar(list);
        earnPress(10, "percha");
      }
      document.getElementById("colgarBox").innerHTML = `<p style="font-size:14px;line-height:1.7"><span class="mint-done">✦ Colgado.</span> ⬢ +10 ES — tu diseño ya se mece en El Perchero, esperando ser adoptado.</p>`;
    };
    const cv = document.getElementById("colgarVenta");
    if (cv) cv.onclick = () => colgar(false);
    const cd = document.getElementById("colgarDon");
    if (cd) cd.onclick = () => colgar(true);
  }

  if (tab === "capsula") {
    const capVars = [
      "matching capsule piece: complementary top or shirt, same design language",
      "matching capsule piece: accessory derived from the main garment",
      "matching capsule piece: alternative colorway variation",
    ];
    body.innerHTML = `
      <div class="fade-in">
        <p class="lead" style="margin-bottom:26px">
          De la idea rectora nace una <b>capsule collection</b>: prendas que comparten su ADN.
          En el taller escolar, cada estudiante puede desarrollar su cápsula a partir de su idea rectora.
        </p>
        <div class="capsula-grid">
          ${state.capsuleSeeds
            .map(
              (s, i) => `
            <figure>
              <div class="gen-cell" style="aspect-ratio:1/1;cursor:default"><div class="spin"><div class="loader"></div><span>DERIVANDO…</span></div></div>
              <figcaption>Derivada ${String(i + 1).padStart(2, "0")} · de la idea rectora ${pieceName()}</figcaption>
            </figure>`
            )
            .join("")}
        </div>
      </div>`;
    body.querySelectorAll(".gen-cell").forEach((cell, i) => {
      mountImg(cell, imgUrl(buildPrompt(capVars[i]), state.capsuleSeeds[i]), `Derivada ${i + 1}`);
    });
  }

  if (tab === "taller") {
    body.innerHTML = `
      <div class="ficha fade-in">
        <p class="lead" style="margin-bottom:22px">
          Esta ficha viaja con el NFT: es la guía para que el/la tallerista materialice tu diseño con prendas recuperadas.
        </p>
        <div class="f-block"><h4>Prenda</h4><p>${pieceName()} — ${state.line.nombre}. Edición única (1/1).</p></div>
        <div class="f-block"><h4>Materia prima sugerida</h4><p>${p.material.taller}</p>
          <p style="margin-top:8px;color:var(--ivory-dim)">Punto de partida emocional del diseño: “${p.rescate}”.</p></div>
        <div class="f-block"><h4>Paleta ${p.paleta.nombre}</h4>
          <div class="swatches">${p.paleta.colores.map((c) => `<i style="background:${c}"></i>`).join("")}</div></div>
        <div class="f-block"><h4>Intervenciones</h4>
          <ul>
            <li>Firma del diseñador/a: <b>${p.firma.nombre.toLowerCase()}</b> — presente y visible en la prenda.</li>
            ${state.tela ? `<li>Camino textil elegido — <b>${TELAS[state.tela].nombre.toLowerCase()}</b>: ${TELAS[state.tela].taller}</li>` : ""}
            <li>Intención declarada: “${state.desc}”.</li>
            <li>Criterio upcycling: no comprar material textil nuevo; todo componente sale de prendas de 2ª mano de buena calidad o sobrantes de producción.</li>
          </ul></div>
        ${
          state.sketch
            ? `<div class="f-block"><h4>Boceto original</h4>
                 <img src="${state.sketch}" alt="Boceto" style="max-width:220px;border:1px solid var(--line);display:block;margin-bottom:10px" />
                 <p>Trazado por el/la diseñador/a. Vale como intención, no como plano: el taller interpreta.</p></div>`
            : ""
        }
        <div class="f-block"><h4>Trazabilidad</h4><p>Registrar fotos del antes/después y origen de las prendas base. En la versión real, esta trazabilidad se ancla al NFT (IPFS) y la audita la DAO.</p></div>
        <div class="f-block" style="border-color:var(--gold-soft)">
          <h4>Esta es la moldería de tu diseño</h4>
          <p style="margin-bottom:18px">
            Todo diseño termina acá: en los moldes que el taller apoya sobre la tela.
            Ajustá las medidas si hace falta — descargados e impresos al 100%, son moldes de verdad
            (el cuadrado de control debe medir exactamente 5 cm).
          </p>
          <div class="medidas-grid">
            ${MEDIDAS_CAMPOS.map(
              ([k, label]) => `
              <div>
                <label for="med-${k}">${label} (cm)</label>
                <input type="number" id="med-${k}" value="${(state.medidas || MEDIDAS_DEF)[k]}" min="10" max="200" step="0.5" />
              </div>`
            ).join("")}
          </div>
          <div class="up-actions" style="margin:18px 0 8px">
            <button class="btn" id="trazarBtn">Retrazar con estas medidas</button>
          </div>
          <div id="moldes"></div>
          <p style="margin-top:14px;color:var(--ivory-dim);font-size:13px">
            Molde base educativo, sistema simplificado: verificá sobre el cuerpo antes de cortar.
            Agregá 1 cm de costura y 4 cm de dobladillo. Próxima etapa: export DXF para abrirlos directo en Clo 3D.
          </p>
        </div>
      </div>`;
    const trazar = () => {
      const med = {};
      MEDIDAS_CAMPOS.forEach(([k]) => {
        med[k] = parseFloat(document.getElementById("med-" + k).value) || MEDIDAS_DEF[k];
      });
      state.medidas = med;
      save();
      const moldes = trazarMoldes(med, state.line.key);
      document.getElementById("moldes").innerHTML = moldes
        .map(
          (mo, i) => `
        <div class="molde-sheet">
          ${mo.svg}
          <div class="up-actions" style="padding:10px 0 2px">
            <button class="btn ghost molde-dl" data-i="${i}">Descargar ${mo.nombre} (SVG escala real)</button>
          </div>
        </div>`
        )
        .join("");
      document.querySelectorAll(".molde-dl").forEach((b) => {
        b.onclick = () => dlSVG(moldes[b.dataset.i].nombre, moldes[b.dataset.i].svg);
      });
    };
    document.getElementById("trazarBtn").onclick = trazar;
    trazar();
  }

  if (tab === "perfil") {
    body.innerHTML = `
      <div class="perfil-card fade-in" style="margin:0">
        <div class="kicker">Tu perfil de diseñador/a</div>
        <div class="arquetipo">${p.arquetipo.nombre}</div>
        <p class="lead" style="max-width:100%">${p.arquetipo.ruta}</p>
        <div class="perfil-grid">
          <div><div class="pg-k">Paleta · ${p.paleta.nombre}</div>
            <div class="swatches">${p.paleta.colores.map((c) => `<i style="background:${c}"></i>`).join("")}</div>
            ${p.paleta.otro ? `<div class="pg-v" style="margin-top:8px">“${p.paleta.otro}”</div>` : ""}</div>
          <div><div class="pg-k">Material</div><div class="pg-v">${p.material.nombre}</div></div>
          <div><div class="pg-k">Firma</div><div class="pg-v">${p.firma.nombre}</div></div>
          <div><div class="pg-k">Prendas diseñadas</div><div class="pg-v">1 idea rectora + 3 derivadas de cápsula</div></div>
          <div><div class="pg-k">Token ES</div><div class="pg-v">⬢ ${state.press} ganados en esta sesión</div></div>
          <div style="grid-column:1/-1"><div class="pg-k">Próximo paso sugerido</div>
            <div class="pg-v">Diseñá en otra línea PFP para expandir tu identidad, o proponé un concepto para la próxima votación de temporada de la DAO.</div></div>
        </div>
      </div>`;
  }
}

function mintReceipt() {
  return `
    <p class="mint-done">✦ NFT minteado (simulación educativa)</p>
    <p style="margin-top:6px;color:var(--gold)">⬢ +25 ES por mintear tu diseño</p>
    <p style="margin-top:10px">Token ID: <code>${state.tokenId}</code></p>
    <p>Contrato: <code>SIM.presentes.dao</code> · Metadata: <code>ipfs://simulado/${state.tokenId?.toLowerCase()}</code></p>
    <p style="margin-top:10px;color:var(--ivory-dim)">
      En la versión real, este paso ocurre en una blockchain de bajo costo (mint sin gas para el usuario)
      y tu diseño queda certificado como tuyo para siempre, con regalías en cada reventa.</p>`;
}

/* ---------------- init ---------------- */
if (!restore()) screenLanding();
