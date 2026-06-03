// DrumHub mock data — single source of truth for the frontend prototype.
window.DH = window.DH || {};

DH.ROWS = [
  { id: 'china',      name: 'China',       color: 'china'      },
  { id: 'crash',      name: 'Crash',       color: 'crash'      },
  { id: 'splash',     name: 'Splash',      color: 'splash'     },
  { id: 'ride',       name: 'Ride',        color: 'ride'       },
  { id: 'ride_bell',  name: 'Ride campana', color: 'ride_bell'  },
  { id: 'hihat',      name: 'Hi-Hat',      color: 'hihat'      },
  { id: 'hihat_open', name: 'Hi-Hat open', color: 'hihat_open' },
  { id: 'snare',      name: 'Redoblante',  color: 'snare'      },
  { id: 'tom1',       name: 'Tom 12"',     color: 'tom1'       },
  { id: 'tom2',       name: 'Tom 13"',     color: 'tom2'       },
  { id: 'tom3',       name: 'Chancha 16"', color: 'tom3'       },
  { id: 'kick',       name: 'Bombo',       color: 'kick'       }
];

DH.STEPS = 16;
DH.TIME_SIGS = [
  { id: '2/4', label: '2/4', stepsPerBeat: 4, stepsPerBar:  8 },
  { id: '4/4', label: '4/4', stepsPerBeat: 4, stepsPerBar: 16 },
  { id: '3/4', label: '3/4', stepsPerBeat: 4, stepsPerBar: 12 },
  { id: '5/4', label: '5/4', stepsPerBeat: 4, stepsPerBar: 20 },
  { id: '6/8', label: '6/8', stepsPerBeat: 2, stepsPerBar: 12 },
  { id: '7/8', label: '7/8', stepsPerBeat: 2, stepsPerBar: 14 },
];
DH.MAX_STEPS = 64;
DH.DEFAULT_VOLS = { china: 0.5, crash: 0.55, splash: 0.5, ride: 0.5, ride_bell: 0.55, hihat: 0.45, hihat_open: 0.5, snare: 0.85, tom1: 0.75, tom2: 0.8, tom3: 0.85, kick: 1.0, clap: 0.7, stick: 0.6, cowbell: 0.55, cabasa: 0.45, tamb: 0.5, conga: 0.7 };

DH.LEVELS = ['Básico', 'Intermedio', 'Avanzado'];
DH.GENRES_LIST = ['Rock', 'Funk', 'Jazz', 'Metal', 'Latin', 'Reggae', 'Blues', 'Pop', 'Soul', 'R&B', 'Hip-Hop', 'Bossa'];

// Seeds para la galería de avatares pre-generados (DiceBear notionists).
// Solo guardamos el seed (string corto) en el user → ideal para mover a Supabase sin storage de imágenes.
// La URL se reconstruye en runtime con DH.avatarUrl(seed).
DH.AVATAR_SEEDS = [
  'bonham',  'purdie',  'cobham',  'porcaro',
  'gadd',    'weckl',   'erskine', 'colaiuta',
  'wackerman','smith',  'chambers','vinnie',
  'questlove','clyde',  'modeliste','garibaldi',
  'baker',   'rich',    'krupa',   'roach',
  'paice',   'peart',   'moon',    'copeland'
];
// 24 SVGs pre-bajados a /imagenes/avatars/{seed}.svg (zero deps externas).
// Si llega un seed que no está en el set (usuario antiguo, fallback dinámico), cae a DiceBear API.
DH.avatarUrl = function (seed) {
  if (!seed) return '';
  if (seed.indexOf('http') === 0) return seed; // legacy: si vino URL completa, usarla tal cual
  if (DH.AVATAR_SEEDS && DH.AVATAR_SEEDS.indexOf(seed) !== -1) {
    return '/imagenes/avatars/' + encodeURIComponent(seed) + '.svg';
  }
  return 'https://api.dicebear.com/7.x/notionists/svg?seed=' + encodeURIComponent(seed) + '&backgroundColor=transparent';
};

DH.PRESETS = {
  rock: {
    title: 'Basic Rock', genre: 'Rock', level: 'Básico', bpm: 90,
    china: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    crash: [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    splash:[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    ride:  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    hihat: [1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0],
    snare: [0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0],
    tom1:  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    tom2:  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    kick:  [1,0,0,0,0,0,1,0,0,0,1,0,0,0,0,0]
  },
  funk: {
    title: 'Funk Groove', genre: 'Funk', level: 'Intermedio', bpm: 100,
    china: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    crash: [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    splash:[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    ride:  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    hihat: [1,1,0,1,1,0,1,0,1,1,0,1,1,0,1,0],
    snare: [0,0,0,0,1,0,0,1,0,0,0,0,1,0,0,0],
    tom1:  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    tom2:  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    kick:  [1,0,0,1,0,0,1,0,0,1,0,0,1,0,0,0]
  },
  reggae: {
    title: 'One Drop', genre: 'Reggae', level: 'Básico', bpm: 75,
    china: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    crash: [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    splash:[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    ride:  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    hihat: [1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0],
    snare: [0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0],
    tom1:  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    tom2:  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    kick:  [0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0]
  },
  bossa: {
    title: 'Bossa Nova', genre: 'Bossa', level: 'Intermedio', bpm: 85,
    china: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    crash: [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    splash:[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    ride:  [1,0,0,1,0,1,0,0,1,0,0,1,0,1,0,0],
    hihat: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    snare: [0,0,1,0,0,0,1,0,0,0,1,0,0,0,0,0],
    tom1:  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    tom2:  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    kick:  [1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0]
  },
  metal: {
    title: 'Double Bass', genre: 'Metal', level: 'Avanzado', bpm: 150,
    china: [1,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0],
    crash: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    splash:[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    ride:  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    hihat: [1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0],
    snare: [0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0],
    tom1:  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    tom2:  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    kick:  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
  },
  jazz: {
    title: 'Swing Ride', genre: 'Jazz', level: 'Intermedio', bpm: 120,
    china: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    crash: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    splash:[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    ride:  [1,0,0,1,0,1,1,0,1,0,0,1,0,1,1,0],
    hihat: [0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0],
    snare: [0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0],
    tom1:  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    tom2:  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    kick:  [1,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0]
  },
  hiphop: {
    title: 'Boom Bap', genre: 'Hip-Hop', level: 'Básico', bpm: 88,
    china: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    crash: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    splash:[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    ride:  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    hihat: [1,0,0,1,0,0,1,0,1,0,0,1,0,0,1,0],
    snare: [0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0],
    tom1:  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    tom2:  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    kick:  [1,0,0,0,0,0,1,0,0,1,0,0,0,0,0,0]
  },
  demo: {
    title: 'Demo Platos', genre: 'Demo', level: 'Básico', bpm: 80,
    china: [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    crash: [0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0],
    splash:[0,0,0,0,1,0,0,0,0,0,0,0,0,0,1,0],
    ride:  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    hihat: [1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0],
    snare: [0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0],
    tom1:  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    tom2:  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    kick:  [1,0,0,0,0,0,1,0,0,0,1,0,0,0,0,0]
  }
};

DH.EMPTY_PATTERN = function () {
  var p = {};
  DH.ROWS.forEach(function (r) { p[r.id] = new Array(DH.STEPS).fill(0); });
  return p;
};

function pat(presetKey, overrides) {
  var src = DH.PRESETS[presetKey];
  var p = DH.EMPTY_PATTERN();
  DH.ROWS.forEach(function (r) {
    p[r.id] = (src[r.id] || new Array(DH.STEPS).fill(0)).slice();
  });
  if (overrides) Object.keys(overrides).forEach(function (k) { p[k] = overrides[k]; });
  return p;
}

DH.GROOVES = [
  { id: 'g1', slug: 'purdie-shuffle', title: 'Purdie Shuffle', author: 'bernardp',
    genre: 'Funk', bpm: 98, level: 'Avanzado', likes: 487, plays: 3120, featured: true,
    tags: ['shuffle', 'ghost notes', 'independencia', 'steely dan'],
    desc: 'El shuffle de Bernard Purdie, usado en "Babylon Sisters" de Steely Dan. Uno de los grooves más copiados del funk. Requiere independencia entre las manos y control del ghost note en el redoblante.',
    pattern: {
      china: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
      crash: [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
      splash:[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
      ride:  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
      hihat: [1,0,1,1,1,0,1,1,1,0,1,1,1,0,1,1],
      snare: [0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0],
      tom1:  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
      tom2:  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
      kick:  [1,0,0,1,0,0,1,0,0,1,0,0,1,0,0,0]
    }
  },
  { id: 'g2', slug: 'basic-rock', title: 'Basic Rock', author: 'drummaster',
    genre: 'Rock', bpm: 90, level: 'Básico', likes: 247, plays: 1840,
    tags: ['back-beat', 'fundamentos', 'principiantes'],
    desc: 'El groove de rock más clásico. Bombo en 1 y 3, redoblante en 2 y 4, hi-hat en octavos. La base de millones de canciones.',
    pattern: pat('rock')
  },
  { id: 'g3', slug: 'clyde-steppin', title: "Clyde Steppin'", author: 'funkybones',
    genre: 'Funk', bpm: 105, level: 'Intermedio', likes: 189, plays: 1430,
    tags: ['ghost notes', 'sincopado', 'pocket'],
    desc: 'Inspirado en Clyde Stubblefield. Hi-hat con acentos en los ands, snare con ghost notes y un kick sincopado que empuja el groove.',
    pattern: pat('funk')
  },
  { id: 'g4', slug: 'double-bass-16', title: 'Double Bass 16th', author: 'blastking',
    genre: 'Metal', bpm: 160, level: 'Avanzado', likes: 421, plays: 2950,
    tags: ['double bass', 'resistencia', 'talón-punta'],
    desc: 'Bombo doble en 16th notes constante. Requiere resistencia, control de talón-punta y ride sólido.',
    pattern: pat('metal')
  },
  { id: 'g5', slug: 'one-drop', title: 'One Drop', author: 'roots_r',
    genre: 'Reggae', bpm: 75, level: 'Básico', likes: 312, plays: 1670,
    tags: ['one drop', 'roots', 'minimalista'],
    desc: 'El groove fundacional del reggae roots. Bombo y snare juntos en el 3, hi-hat marcando los pulsos.',
    pattern: pat('reggae')
  },
  { id: 'g6', slug: 'bossa-clasica', title: 'Bossa Clásica', author: 'samba_b',
    genre: 'Bossa', bpm: 85, level: 'Intermedio', likes: 203, plays: 980,
    tags: ['clave', 'sincopado', 'cross-stick'],
    desc: 'Patrón clásico de bossa nova. Mano izquierda con la clave en el aro, mano derecha en el ride siguiendo el patrón sincopado.',
    pattern: pat('bossa')
  },
  { id: 'g7', slug: 'boom-bap', title: 'Boom Bap', author: 'beatmaker',
    genre: 'Hip-Hop', bpm: 88, level: 'Básico', likes: 334, plays: 2210,
    tags: ['swing', '90s', 'j dilla'],
    desc: 'El groove fundacional del hip-hop noventero. Bombo grave, snare seco con cuerpo, hi-hat con swing leve.',
    pattern: pat('hiphop')
  },
  { id: 'g8', slug: 'bonham-groove', title: 'Bonham Groove', author: 'zep_fan',
    genre: 'Rock', bpm: 92, level: 'Intermedio', likes: 312, plays: 1980,
    tags: ['triplets', 'bonham', 'peso'],
    desc: 'Inspirado en John Bonham. Triplets en el bombo, snare con peso, hi-hat agresivo.',
    pattern: pat('rock', {
      kick: [1,0,0,0,1,0,0,1,0,0,1,0,0,0,0,0]
    })
  },
  { id: 'g9', slug: 'ride-swing', title: 'Ride Swing', author: 'jazzcat',
    genre: 'Jazz', bpm: 120, level: 'Intermedio', likes: 156, plays: 870,
    tags: ['swing', 'ride', 'independencia'],
    desc: 'El patrón clásico del jazz: el ride hace el "spang-a-lang", el hi-hat marca el 2 y el 4 con el pie.',
    pattern: pat('jazz')
  },
  { id: 'g10', slug: 'steppers', title: 'Steppers', author: 'roots_r',
    genre: 'Reggae', bpm: 78, level: 'Intermedio', likes: 201, plays: 1120,
    tags: ['steppers', 'roots', 'militante'],
    desc: 'Variante del reggae con el bombo en cada pulso (steppers). Más constante que el one drop, perfecto para roots militante.',
    pattern: pat('reggae', {
      kick: [1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0]
    })
  },
  { id: 'g11', slug: 'shuffle-blues', title: 'Shuffle Blues', author: 'drummaster',
    genre: 'Blues', bpm: 95, level: 'Intermedio', likes: 178, plays: 1340,
    tags: ['shuffle', 'triplets', 'back-beat'],
    desc: 'Shuffle clásico del blues, con el ride en triplets y el snare marcando el back-beat.',
    pattern: pat('rock', {
      hihat: [1,0,1,1,0,1,1,0,1,1,0,1,1,0,1,1]
    })
  },
  { id: 'g12', slug: 'blast-beat', title: 'Blast Beat', author: 'blastking',
    genre: 'Metal', bpm: 200, level: 'Avanzado', likes: 267, plays: 1890,
    tags: ['blast beat', 'extreme', 'velocidad'],
    desc: 'Blast beat tradicional: kick y snare alternando en 16th notes, hi-hat o ride encima. Para extreme metal.',
    pattern: {
      china: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
      crash: [1,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0],
      splash:[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
      ride:  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
      hihat: [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
      snare: [0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1],
      tom1:  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
      tom2:  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
      kick:  [1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0]
    }
  }
];

DH.DRUMMERS = [
  { user: 'bernardp',   name: 'Bernard P.',    bio: 'Funk drummer obsesionado con los ghost notes. Toco hace 22 años. Steely Dan fan.', grooves: 48, likes: 1240, color: '#ff4d00', init: 'B' },
  { user: 'funkybones', name: 'Funky Bones',   bio: 'Vivo en el pocket. Buscando el groove en cada hueco.',                                grooves: 31, likes: 890,  color: '#e8ff00', init: 'F' },
  { user: 'jazzcat',    name: 'Jazz Cat',      bio: 'Brushes, escobas, ride pattern. Standards y free playing.',                            grooves: 27, likes: 712,  color: '#00c9ff', init: 'J' },
  { user: 'blastking',  name: 'Blast King',    bio: 'Extreme metal, blast beats, double bass. 200 BPM is just the warm-up.',               grooves: 24, likes: 654,  color: '#a855f7', init: 'B' },
  { user: 'roots_r',    name: 'Roots R.',      bio: 'Reggae, dub y roots. One drop forever.',                                                grooves: 19, likes: 501,  color: '#22c55e', init: 'R' },
  { user: 'samba_b',    name: 'Samba B.',      bio: 'Brasil, samba, bossa, partido alto. Toco congas también.',                              grooves: 17, likes: 443,  color: '#f43f5e', init: 'S' },
  { user: 'drummaster', name: 'Drum Master',   bio: 'Profe de batería. Cubro de rock a blues. 30 años tocando.',                             grooves: 14, likes: 387,  color: '#ffaa00', init: 'D' },
  { user: 'beatmaker',  name: 'Beat Maker',    bio: 'Hip-hop, boom bap, J Dilla disciple.',                                                   grooves: 12, likes: 334,  color: '#6b6860', init: 'B' },
  { user: 'zep_fan',    name: 'Zep Fan',       bio: 'Bonham para siempre. Triplets y peso.',                                                  grooves: 11, likes: 298,  color: '#fb923c', init: 'Z' }
];

DH.GENRES = [
  { name: 'Rock',    icon: '🎸', count: 842 },
  { name: 'Funk',    icon: '🕺', count: 631 },
  { name: 'Jazz',    icon: '🎷', count: 519 },
  { name: 'Metal',   icon: '🤘', count: 487 },
  { name: 'Latin',   icon: '🥁', count: 374 },
  { name: 'Reggae',  icon: '🌿', count: 298 },
  { name: 'Blues',   icon: '🎵', count: 241 },
  { name: 'Hip-Hop', icon: '🎤', count: 215 },
  { name: 'Pop',     icon: '✨', count: 189 },
  { name: 'Soul',    icon: '🎺', count: 167 },
  { name: 'R&B',     icon: '🔥', count: 143 },
  { name: 'Bossa',   icon: '☀️', count: 98 }
];

// Metadata extendida por género — alimenta /genre/:slug
DH.GENRE_INFO = {
  Funk: {
    slug: 'funk', color: '#e8ff00',
    bpmMin: 80, bpmMax: 120, level: 'Intermedio', timeSig: '4/4',
    description: 'El funk nace a fines de los 60s con James Brown como padre fundador y se construye sobre tres pilares: el bombo en el down-beat (el legendario "on the one"), los ghost notes en el redoblante que dan el "pocket", y el hi-hat con acentos sincopados. La clave está en la independencia entre las manos y el groove relajado pero firme. Canciones icónicas: "Funky Drummer" (James Brown), "Babylon Sisters" (Steely Dan), "Cissy Strut" (The Meters).',
    subgenres: ['New Funk', 'P-Funk', 'Funk Rock', 'Soul Funk', 'Jazz Funk'],
    related: ['Soul', 'Jazz', 'R&B'],
    drummers: [
      { name: 'Clyde Stubblefield', role: 'The Funky Drummer · JBs',  init: 'C', color: '#e8ff00', grooves: 87 },
      { name: 'Bernard Purdie',     role: 'Pretty Purdie · Sessionist', init: 'B', color: '#ff4d00', grooves: 64 },
      { name: 'David Garibaldi',    role: 'Tower of Power',           init: 'D', color: '#00c9ff', grooves: 51 },
      { name: 'Zigaboo Modeliste',  role: 'The Meters',                init: 'Z', color: '#a855f7', grooves: 43 },
      { name: 'John "JR" Robinson', role: 'Rufus / Chaka Khan',       init: 'J', color: '#22c55e', grooves: 38 }
    ]
  },
  Rock: {
    slug: 'rock', color: '#ff4d00',
    bpmMin: 90, bpmMax: 150, level: 'Básico', timeSig: '4/4',
    description: 'El groove fundacional del rock: bombo en el 1 y el 3, redoblante en el 2 y el 4 (back-beat), hi-hat en corcheas. Sobre esa base se construyeron 60 años de música popular. La evolución va del rock clásico al hard rock, al metal, al grunge, al indie. Referentes esenciales: John Bonham (Led Zeppelin), Neil Peart (Rush), Keith Moon (The Who), Stewart Copeland (The Police).',
    subgenres: ['Classic Rock', 'Hard Rock', 'Indie', 'Grunge', 'Punk', 'Prog Rock'],
    related: ['Blues', 'Metal', 'Pop'],
    drummers: [
      { name: 'John Bonham',     role: 'Led Zeppelin',   init: 'J', color: '#ff4d00', grooves: 124 },
      { name: 'Neil Peart',      role: 'Rush',           init: 'N', color: '#e8ff00', grooves: 98 },
      { name: 'Keith Moon',      role: 'The Who',        init: 'K', color: '#00c9ff', grooves: 76 },
      { name: 'Stewart Copeland',role: 'The Police',     init: 'S', color: '#a855f7', grooves: 62 },
      { name: 'Dave Grohl',      role: 'Nirvana / Foo',  init: 'D', color: '#22c55e', grooves: 54 }
    ]
  },
  Jazz: {
    slug: 'jazz', color: '#00c9ff',
    bpmMin: 60, bpmMax: 240, level: 'Avanzado', timeSig: '4/4 · 3/4',
    description: 'El jazz pide independencia total entre las cuatro extremidades. La mano derecha lleva el "spang-a-lang" en el ride, el pie izquierdo marca el 2 y 4 en el hi-hat, mientras el snare y el bombo conversan con el solista (comping). Es el género más exigente técnicamente. Bebop, swing, fusion, free jazz: cada subgénero tiene su propio approach.',
    subgenres: ['Bebop', 'Swing', 'Fusion', 'Cool Jazz', 'Free Jazz', 'Latin Jazz'],
    related: ['Funk', 'Latin', 'Blues'],
    drummers: [
      { name: 'Elvin Jones',      role: 'John Coltrane Quartet', init: 'E', color: '#00c9ff', grooves: 89 },
      { name: 'Tony Williams',    role: 'Miles Davis',           init: 'T', color: '#e8ff00', grooves: 71 },
      { name: 'Buddy Rich',       role: 'Big Band',              init: 'B', color: '#ff4d00', grooves: 58 },
      { name: 'Jack DeJohnette',  role: 'Keith Jarrett Trio',    init: 'J', color: '#a855f7', grooves: 47 },
      { name: 'Brian Blade',      role: 'Wayne Shorter Quartet', init: 'B', color: '#22c55e', grooves: 36 }
    ]
  },
  Metal: {
    slug: 'metal', color: '#a855f7',
    bpmMin: 120, bpmMax: 240, level: 'Avanzado', timeSig: '4/4',
    description: 'El metal exige potencia, precisión y velocidad. Bombo doble en corcheas o semis, ride pesado, redoblante con back-beat firme y blast beats en los pasajes extremos. La técnica de talón-punta o doble pedal son obligatorias. Géneros que van del thrash al death al djent.',
    subgenres: ['Thrash', 'Death', 'Black', 'Djent', 'Progressive', 'Doom'],
    related: ['Rock', 'Punk'],
    drummers: [
      { name: 'Lars Ulrich',       role: 'Metallica',     init: 'L', color: '#a855f7', grooves: 92 },
      { name: 'Mike Portnoy',      role: 'Dream Theater', init: 'M', color: '#ff4d00', grooves: 78 },
      { name: 'Gene Hoglan',       role: 'Death/Strapping', init: 'G', color: '#e8ff00', grooves: 64 },
      { name: 'Danny Carey',       role: 'Tool',          init: 'D', color: '#00c9ff', grooves: 51 },
      { name: 'George Kollias',    role: 'Nile',          init: 'G', color: '#22c55e', grooves: 39 }
    ]
  },
  Reggae: {
    slug: 'reggae', color: '#ffaa00',
    bpmMin: 60, bpmMax: 90, level: 'Básico', timeSig: '4/4',
    description: 'El reggae es el groove de la calma. El "one drop" pone el bombo en el 3 (no en el 1), creando esa sensación flotante característica. El hi-hat marca los pulsos, el redoblante en el back-beat o como rim shot, y el cross-stick para textura. Variantes: steppers (bombo en cada pulso), rockers (bombo en 1 y 3).',
    subgenres: ['Roots', 'Dub', 'Dancehall', 'Steppers', 'Rockers', 'Ska'],
    related: ['Soul', 'R&B', 'Latin'],
    drummers: [
      { name: 'Carlton Barrett',  role: 'Bob Marley & The Wailers', init: 'C', color: '#22c55e', grooves: 76 },
      { name: 'Sly Dunbar',       role: 'Sly & Robbie',             init: 'S', color: '#e8ff00', grooves: 68 },
      { name: 'Style Scott',      role: 'Roots Radics',             init: 'S', color: '#ff4d00', grooves: 51 },
      { name: 'Horsemouth Wallace',role: 'Soul Syndicate',          init: 'H', color: '#a855f7', grooves: 42 }
    ]
  },
  Latin: {
    slug: 'latin', color: '#22c55e',
    bpmMin: 80, bpmMax: 200, level: 'Intermedio', timeSig: '4/4 · 6/8',
    description: 'Bajo "Latin" entran salsa, samba, bossa nova, mambo, son, partido alto. La clave rige todo: hay clave de son (3-2 o 2-3) y clave de rumba. Sobre eso se monta el patrón de tumbadoras, timbales, bongó. La batería traslada esa polirritmia a un set kit con campana, ride y cascos.',
    subgenres: ['Salsa', 'Bossa', 'Samba', 'Mambo', 'Cha-cha', 'Partido Alto'],
    related: ['Jazz', 'Funk', 'Reggae'],
    drummers: [
      { name: 'Tito Puente',     role: 'Rey del Timbal',       init: 'T', color: '#22c55e', grooves: 73 },
      { name: 'Horacio "El Negro" Hernández', role: 'Cubano · Universal', init: 'H', color: '#ff4d00', grooves: 65 },
      { name: 'Airto Moreira',   role: 'Brasileño · Fusion',   init: 'A', color: '#e8ff00', grooves: 54 },
      { name: 'Edu Ribeiro',     role: 'Samba contemporáneo',  init: 'E', color: '#a855f7', grooves: 38 }
    ]
  }
};

// SVG icons por género — pieza de batería característica de cada estilo.
// Se renderiza como <svg width=W height=H viewBox="0 0 40 40" stroke="<color>" stroke-width=1.5 fill=none>{shape}</svg>
DH.GENRE_ICONS = {
  'Rock':   '<circle cx="20" cy="20" r="16"/><circle cx="20" cy="20" r="8"/>',
  'Funk':   '<ellipse cx="20" cy="17" rx="14" ry="2.5"/><ellipse cx="20" cy="23" rx="14" ry="2.5"/>',
  'Jazz':   '<circle cx="20" cy="20" r="16"/><circle cx="20" cy="20" r="2.5" fill="currentColor"/>',
  'Metal':  '<circle cx="12" cy="20" r="9"/><circle cx="28" cy="20" r="9"/>',
  'Latin':  '<rect x="14" y="10" width="12" height="24" rx="1.5"/><ellipse cx="20" cy="10" rx="6" ry="2.5"/>',
  'Reggae': '<rect x="6" y="14" width="28" height="12"/><line x1="11" y1="10" x2="11" y2="14"/><line x1="17" y1="10" x2="17" y2="14"/><line x1="23" y1="10" x2="23" y2="14"/><line x1="29" y1="10" x2="29" y2="14"/><line x1="11" y1="26" x2="11" y2="30"/><line x1="17" y1="26" x2="17" y2="30"/><line x1="23" y1="26" x2="23" y2="30"/><line x1="29" y1="26" x2="29" y2="30"/>',
  'Blues':  '<ellipse cx="20" cy="12" rx="14" ry="2.5"/><ellipse cx="20" cy="26" rx="14" ry="2.5"/><line x1="20" y1="6" x2="20" y2="34"/>',
  'Pop':    '<ellipse cx="20" cy="16" rx="16" ry="4" transform="rotate(-15 20 16)"/><line x1="20" y1="18" x2="20" y2="36"/>',
  'Soul':   '<circle cx="20" cy="20" r="14"/><circle cx="20" cy="20" r="11"/>',
  'R&B':    '<circle cx="20" cy="20" r="15" stroke-width="3"/><circle cx="20" cy="20" r="9"/>'
};
DH.genreIconSvg = function (name, opts) {
  opts = opts || {};
  var size = opts.size || 40;
  var color = opts.color || 'currentColor';
  var strokeWidth = opts.strokeWidth || 1.5;
  var shape = DH.GENRE_ICONS[name] || '<circle cx="20" cy="20" r="14"/>';
  return '<svg width="' + size + '" height="' + size + '" viewBox="0 0 40 40" stroke="' + color + '" stroke-width="' + strokeWidth + '" fill="none">' + shape + '</svg>';
};

// Fallback genérico para géneros sin metadata explícita
DH.DEFAULT_GENRE_INFO = {
  bpmMin: 70, bpmMax: 160, level: 'Variable', timeSig: '4/4',
  description: 'Explorá los grooves de este género subidos por la comunidad. Filtrá por BPM o dificultad para encontrar el patrón que estás buscando.',
  subgenres: [],
  related: ['Rock', 'Funk', 'Pop'],
  drummers: []
};

DH.ACTIVITY = [
  { user: 'bernardp',   action: 'subió un nuevo groove', target: 'Purdie Shuffle',  targetSlug: 'purdie-shuffle', time: 'hace 12 min' },
  { user: 'jazzcat',    action: 'guardó en favoritos',   target: 'Bonham Groove',   targetSlug: 'bonham-groove',  time: 'hace 28 min' },
  { user: 'blastking',  action: 'subió un nuevo groove', target: 'Blast Beat',      targetSlug: 'blast-beat',     time: 'hace 1h' },
  { user: 'samba_b',    action: 'comentó en',            target: 'Bossa Clásica',   targetSlug: 'bossa-clasica',  time: 'hace 2h' },
  { user: 'drummaster', action: 'subió un nuevo groove', target: 'Shuffle Blues',   targetSlug: 'shuffle-blues',  time: 'hace 3h' }
];

DH.TICKER = [
  { text: 'bernardp subió',    groove: 'Purdie Shuffle' },
  { text: 'rockero99 subió',   groove: 'Basic Rock Variation' },
  { text: 'jazzcat guardó',    groove: 'Ride Swing' },
  { text: 'samba_b subió',     groove: 'Bossa Nova Clásica' },
  { text: 'blastking subió',   groove: 'Double Bass 16th' },
  { text: "funkybones guardó", groove: "Clyde Steppin'" },
  { text: 'roots_r subió',     groove: 'One Drop Roots' },
  { text: 'drumqueen guardó',  groove: 'Gospel Chop' },
  { text: 'beatmaker subió',   groove: 'Hip-Hop Boom Bap' },
  { text: 'latindrums subió',  groove: 'Clave Son' }
];

DH.COMMENTS = {
  'g1': [
    { user: 'funkybones', text: 'Para los que recién arrancan: empezar a 60bpm y subir de a 5. La independencia se gana.', time: 'hace 2 días' },
    { user: 'drummaster', text: 'Lo más complicado son los ghost notes. Hay que sentirlos, no contarlos.', time: 'hace 1 día' },
    { user: 'jazzcat',    text: 'Buen análisis. Tip: poné un metrónomo en el 2 y el 4, te abre la cabeza.', time: 'hace 14 hs' }
  ],
  'g2': [
    { user: 'drummaster', text: 'El groove que aprende todo baterista. Con esto ya tocás 80% del rock.', time: 'hace 4 días' }
  ],
  'g4': [
    { user: 'blastking', text: 'Para no destruir los talones, alternar talón-punta cuando bajás el tempo.', time: 'hace 6 días' }
  ]
};

DH.findGroove = function (idOrSlug) {
  return DH.GROOVES.find(function (g) { return g.id === idOrSlug || g.slug === idOrSlug; });
};

DH.findDrummer = function (user) {
  return DH.DRUMMERS.find(function (d) { return d.user === user; });
};
