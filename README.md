# DrumHub

La biblioteca de grooves para bateristas. Explorá, practicá y compartí patrones de batería desde el navegador.

![DrumHub screenshot](https://via.placeholder.com/1200x600/080807/e8ff00?text=DrumHub)

## Qué es

DrumHub es una SPA (single page application) en JavaScript vanilla que reproduce patrones de batería de 16 pasos en el browser usando Web Audio API. Los usuarios pueden:

- Explorar grooves filtrando por género, dificultad, BPM o tags
- Reproducir cada patrón con 4 kits distintos (Pearl Master Studio, TR-909, LinnDrum LM-2, CR-78)
- Subir sus propios grooves desde un editor visual con grilla de 16 pasos
- Guardar favoritos, comentar, seguir bateristas
- Comparar grooves lado a lado, ver preview de audio al hacer hover
- Cambiar el kit al instante y escuchar el mismo patrón con sonidos distintos

**Estado actual**: MVP frontend, sin backend. Todos los datos viven en `localStorage` del navegador. Próximo paso: migrar a Supabase.

## Cómo correrlo local

Es 100% estático, así que cualquier server HTTP funciona.

```bash
# Con npm
npx http-server . -p 3000

# Con Python 3
python -m http.server 3000

# O abrir directo
# index.html en el navegador (algunas funciones pueden no andar por restricciones de CORS)
```

Después, abrí http://127.0.0.1:3000 en el navegador.

## Stack

- HTML / CSS / JS vanilla (sin frameworks, sin build step)
- Web Audio API para síntesis y reproducción de samples
- localStorage para persistencia
- Google Fonts (Bebas Neue, Barlow, DM Mono)

## Estructura

```
drumhub-frontend/
  index.html              Shell HTML
  css/main.css            Todos los estilos
  js/
    data.js               Mock data (grooves, drummers, géneros)
    store.js              localStorage helpers
    audio.js              Audio engine multi-kit (Web Audio API + samples + synth fallback)
    player.js             Sequencer reusable (grilla 16 pasos)
    router.js             Hash router
    ui.js                 Nav, modal, footer, cards comunes
    compare.js            Compare grooves side-by-side
    notifications.js      Sistema de notificaciones
    shortcuts.js          Keyboard shortcuts globales
    pages/                Una página por archivo
    app.js                Bootstrap
  audio/                  Samples por kit (pearl, tr909, lm2, cr78) — OGG
  imagenes/               Logo + galería de 24 avatares pre-generados
  vercel.json             Config de deploy con cache headers
```

## Atajos de teclado

- `/` enfocar buscador
- `←` `→` paginar en /search
- `g` luego `h` / `s` / `u` / `g` — go to home / search / upload / genres
- `p` detener preview de audio
- `?` mostrar/ocultar ayuda
- `Esc` cerrar modal / preview / overlay

## Créditos

### Samples de audio
- **Pearl Master Studio Pack 1** by [enoe](https://oramics.github.io/sampled/DRUMS/pearl-master-studio/) — [CC-BY 3.0](https://creativecommons.org/licenses/by/3.0/)
- **TR-909 Detroit** · **LinnDrum LM-2** · **CR-78** — Public Domain, vía [oramics.github.io/sampled](https://oramics.github.io/sampled/)

### Avatares
- Generados con [DiceBear](https://www.dicebear.com/) estilo `notionists` ([CC0](https://www.dicebear.com/licenses/))

### Tipografías
- [Bebas Neue](https://fonts.google.com/specimen/Bebas+Neue), [Barlow](https://fonts.google.com/specimen/Barlow), [DM Mono](https://fonts.google.com/specimen/DM+Mono) — Google Fonts

## Licencia

MIT — usalo, forkealo, mejoralo.

---

Hecho para bateristas 🥁
