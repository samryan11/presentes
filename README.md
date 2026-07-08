# PRESENTES · NFT + UPCYCLING

Prototipo web del ecosistema PRESENTES (NFT + UPCYCLING)
Digital Fashion con el espíritu de culturizar el upcycling. Inspira desde la disrupción de buscar el fashion designer que llevas dentro como una analogía de la búsqueda interior. Moda conceptual y producible. Muy artístico. Muy técnico. 

> "To See The Soul In The Material"

## Qué hace

1. **Neuro-action**: la acción con la que arranca el pase de upcycling. Seis preguntas que te devuelven tu **perfil de diseñador/a**: arquetipo, paleta, material, firma.
2. Elegís territorio: las 3 líneas PFP fijas — **Last Leather Jacket**, **Jumpsuit Presents**, **Presiados** — o la **colección de temporada** votada por la DAO (demo).
3. Mostrás tu prenda como quieras: **con palabras** (la IA genera 4 visiones reales — Pollinations / FLUX, sin API key), **con tu propio boceto o una foto** (no hace falta ser gran dibujante), o las dos cosas. También elegís desde dónde nace tu tela (su cuerpo, su piel o su poder — los tres caminos del diseño textil). Elegís tu **idea rectora**: puede ser una visión de la IA o tu boceto tal cual.
4. Te llevás todo:
   - **Ficha NFT** con nombre y narrativa de la prenda (1/1, one of a kind)
   - **Mint simulado** con el split explicado: 40% diseñador · 40% tallerista · 20% DAO
   - **Token ES** (simulado): la moneda de PRESENTES, respaldada por trabajo real de upcycling — como los tokens del agro argentino que valen granos reales. Se gana por hitos: +10 neuro-action, +15 idea rectora, +25 mint
   - **Cápsula**: 3 prendas derivadas de la idea rectora
   - **Ficha de taller**: guía de upcycling para materializar la prenda IRL, con la moldería de tu diseño al final (moldes base SVG a escala real)
   - **Tu perfil de diseñador/a** con ruta sugerida
5. **El archivo vivo**: la muestra que no cierra. La colección oficial vive en `archivo.json` (siempre online); cada diseñador suma sus diseños a su archivo local y puede exportarlos en .json para que la curaduría los incorpore a la colección.
6. **El Perchero**: el mercado de PRESENTES — no se ve al principio, se descubre después del diseño, y colgar es siempre opcional. Solo se cuelga indumentaria NFT (nada más entra, por definición de percha), se paga en ES, cada pieza es 1/1 con regalía al diseñador en cada reventa, y cada adopción financia la confección IRL con el reparto 40/40/20. Las prendas se mecen colgadas de sus perchas doradas, flotando fuera del mercado común. Listados oficiales en `perchero.json` + los tuyos en tu dispositivo.

Todo es **simulado y educativo** en esta versión: no toca ninguna blockchain real. Pensado para talleres en escuelas secundarias y demos ante incubadoras.

## Cómo correrlo

Necesita un servidor estático cualquiera:

```
python -m http.server 4173 --directory presentes-estudio
```

y abrir http://localhost:4173/

Las imágenes requieren conexión a internet (se generan en image.pollinations.ai).

## Estructura

- `index.html` — página única
- `style.css` — estética couture digital (Cormorant Garamond + Space Grotesk, negro/marfil/oro)
- `app.js` — flujo completo: neuro-action → perfil → líneas → tela → generación → ficha NFT. Estado persistido en sessionStorage.

## Próximos pasos posibles

- Neuro-action conversacional real (API de Claude) en lugar de preguntas guiadas
- Mint real en testnet (Stellar/Soroban) con trazabilidad IPFS
- Galería/archivo compartido por aula (el "archivo vivo" del piloto escolar)
- Votación DAO simulada del concepto de temporada
