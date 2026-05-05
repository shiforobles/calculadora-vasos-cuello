const TEMPLATES = [
  // ── Grupo 1: Sin patología ──────────────────────────────
  {
    "group": "Sin patología",
    "title": "Normal",
    "variables": [],
    "body": "ECODOPPLER DE VASOS DE CUELLO\n\nCalibres arteriales de las arterias carótidas bilaterales dentro de límites normales.\nParedes arteriales regulares, sin evidencia de engrosamientos parietales ni placas ateromatosas.\n\nLas velocidades de flujo se encuentran dentro de parámetros normales, con morfología espectral fisiológica y ausencia de aliasing en la señal color.\n\nNo se evidencian signos de estenosis ni alteraciones hemodinámicas en arterias carótidas comunes, internas ni externas.\n\nArterias vertebrales permeables, con flujo anterógrado y simétrico en segmento V2 bilateral.",
    "conclusion": "Sin enfermedad aterosclerótica carotídea. Estudio dentro de límites normales."
  },
  {
    "group": "Sin patología",
    "title": "Normal añoso (fibroesclerosis)",
    "variables": [],
    "body": "ECODOPPLER DE VASOS DE CUELLO\n\nCalibres arteriales conservados.\nParedes arteriales con aumento difuso de ecogenicidad (cambios fibroescleróticos), sin placas ateromatosas focales.\n\nFlujos con velocidades dentro de parámetros normales, sin aliasing ni turbulencia.\n\nArterias vertebrales permeables con flujo anterógrado bilateral.",
    "conclusion": "Cambios parietales involutivos sin estenosis significativa."
  },

  // ── Grupo 2: Aterosclerosis subclínica ─────────────────
  {
    "group": "Aterosclerosis subclínica",
    "title": "Engrosamiento IMT borderline (0.9–1.0 mm)",
    "variables": ["lado_bilateral"],
    "body": "ECODOPPLER DE VASOS DE CUELLO\n\nSe observa engrosamiento parietal leve a nivel de arteria carótida común del lado {{lado_bilateral}}, con GIM en rango borderline (0.9–1.0 mm), sin placas ateromatosas definidas.\n\nFlujos conservados sin signos de estenosis hemodinámicamente significativa.\n\nArterias vertebrales permeables con flujo anterógrado.",
    "body_ambas": "ECODOPPLER DE VASOS DE CUELLO\n\nSe observa engrosamiento parietal leve bilateral a nivel de arterias carótidas comunes, con GIM en rango borderline (0.9–1.0 mm) en ambos lados, sin placas ateromatosas definidas.\n\nFlujos conservados y simétricos sin signos de estenosis hemodinámicamente significativa.\n\nArterias vertebrales permeables con flujo anterógrado.",
    "conclusion": "Engrosamiento GIM borderline (0.9–1.0 mm). Sin estenosis carotídea."
  },
  {
    "group": "Aterosclerosis subclínica",
    "title": "Engrosamiento IMT significativo (>1.0 mm)",
    "variables": ["lado_bilateral"],
    "body": "ECODOPPLER DE VASOS DE CUELLO\n\nSe constata engrosamiento parietal difuso a nivel de arteria carótida común del lado {{lado_bilateral}}, con GIM mayor a 1.0 mm, sin configuración de placa ateromatosa definida.\n\nFlujos conservados sin alteraciones hemodinámicas.\n\nArterias vertebrales permeables con flujo anterógrado.",
    "body_ambas": "ECODOPPLER DE VASOS DE CUELLO\n\nSe constata engrosamiento parietal difuso bilateral a nivel de arterias carótidas comunes, con GIM mayor a 1.0 mm en ambos lados, sin configuración de placa ateromatosa definida.\n\nFlujos conservados y simétricos sin alteraciones hemodinámicas.\n\nArterias vertebrales permeables con flujo anterógrado.",
    "conclusion": "Engrosamiento GIM significativo (>1.0 mm). Aterosclerosis subclínica establecida. Sin estenosis."
  },
  {
    "group": "Aterosclerosis subclínica",
    "title": "Ateromatosis mínima",
    "variables": ["lado_bilateral"],
    "body": "ECODOPPLER DE VASOS DE CUELLO\n\nSe observa mínimo engrosamiento parietal focal a nivel del bulbo carotídeo {{lado_bilateral}}, sin formación de placa definida.\n\nFlujos conservados sin alteraciones hemodinámicas.\n\nArterias vertebrales permeables con flujo anterógrado.",
    "body_ambas": "ECODOPPLER DE VASOS DE CUELLO\n\nSe observa mínimo engrosamiento parietal focal bilateral a nivel de ambos bulbos carotídeos, sin formación de placa definida.\n\nFlujos conservados y simétricos sin alteraciones hemodinámicas.\n\nArterias vertebrales permeables con flujo anterógrado.",
    "conclusion": "Ateromatosis mínima sin repercusión hemodinámica."
  },

  // ── Grupo 3: Placa no obstructiva ──────────────────────
  {
    "group": "Placa no obstructiva",
    "title": "Placa focal no obstructiva",
    "variables": ["arteria", "tipo_placa"],
    "body": "ECODOPPLER DE VASOS DE CUELLO\n\nSe identifica placa {{tipo_placa}} en {{arteria}}, sin compromiso significativo de la luz vascular.\n\nVelocidades dentro de parámetros normales, sin aliasing ni turbulencia.\n\nArterias vertebrales permeables.",
    "conclusion": "Placa carotídea {{tipo_placa}} en {{arteria}}. Sin compromiso hemodinámico."
  },
  {
    "group": "Placa no obstructiva",
    "title": "Placas ipsilaterales no obstructivas",
    "variables": ["lado", "tipo_placa"],
    "body": "ECODOPPLER DE VASOS DE CUELLO\n\nSe identifican múltiples placas {{tipo_placa}} en la región carotídea {{lado}}, comprometiendo bulbo y segmentos adyacentes sin generar obstrucción luminal significativa.\n\nVelocidades conservadas, sin aliasing ni turbulencia.\n\nArterias vertebrales permeables.",
    "conclusion": "Ateromatosis carotídea {{tipo_placa}} con placas múltiples en región {{lado}}. Sin estenosis significativa."
  },
  {
    "group": "Placa no obstructiva",
    "title": "Placas bilaterales no significativas",
    "variables": ["tipo_placa"],
    "body": "ECODOPPLER DE VASOS DE CUELLO\n\nSe observan placas {{tipo_placa}} bilaterales a nivel de las bifurcaciones carotídeas, sin ulceraciones.\n\nNo generan compromiso significativo de la luz arterial.\n\nVelocidades dentro de parámetros normales.\n\nArterias vertebrales permeables con flujo anterógrado.",
    "conclusion": "Ateromatosis carotídea bilateral (placas {{tipo_placa}}). Sin estenosis significativa."
  },
  {
    "group": "Placa no obstructiva",
    "title": "Ateromatosis difusa sin repercusión",
    "variables": ["tipo_placa"],
    "body": "ECODOPPLER DE VASOS DE CUELLO\n\nSe evidencia ateromatosis parietal difusa bilateral con múltiples placas {{tipo_placa}} de pequeño tamaño, sin ulceraciones ni obstrucción luminal significativa.\n\nNo se observan alteraciones hemodinámicas significativas.\n\nFlujos conservados sin aliasing.\n\nArterias vertebrales permeables con flujo anterógrado.",
    "conclusion": "Ateromatosis carotídea difusa bilateral (placas {{tipo_placa}}). Sin compromiso hemodinámico."
  },

  // ── Grupo 4: Estenosis carotídea ACI ───────────────────
  {
    "group": "Estenosis carotídea ACI",
    "title": "Estenosis leve ACI (<50%)",
    "variables": ["lado"],
    "body": "ECODOPPLER DE VASOS DE CUELLO\n\nSe identifican placas ateromatosas a nivel del bulbo carotídeo {{lado}} con reducción luminal menor al 50%.\n\nVelocidades dentro de límites normales o levemente aumentadas sin criterios de estenosis significativa.\n\nArterias vertebrales permeables con flujo anterógrado.",
    "conclusion": "Estenosis carotídea leve (<50%). Manejo clínico y control evolutivo."
  },
  {
    "group": "Estenosis carotídea ACI",
    "title": "Estenosis moderada ACI (50–69%)",
    "variables": ["lado", "vps_acc", "vps", "vfd", "ratio"],
    "body": "ECODOPPLER DE VASOS DE CUELLO\n\nSe identifica placa ateromatosa a nivel del bulbo carotídeo y origen de arteria carótida interna {{lado}}, con reducción moderada de la luz vascular.\n\nSe registran velocidades moderadamente aumentadas: VPS ACC {{vps_acc}} cm/s, VPS ACI {{vps}} cm/s, VFD ACI {{vfd}} cm/s, relación ACI/ACC {{ratio}}, sin turbulencia franca.\n\nHallazgos compatibles con estenosis moderada (50–69%).\n\nArterias vertebrales permeables.",
    "conclusion": "Estenosis moderada de ACI {{lado}} (50–69%). Tratamiento médico óptimo y control evolutivo periódico."
  },
  {
    "group": "Estenosis carotídea ACI",
    "title": "Estenosis severa ACI (>70%)",
    "variables": ["lado", "vps_acc", "vps", "vfd", "ratio"],
    "body": "ECODOPPLER DE VASOS DE CUELLO\n\nSe identifica placa ateromatosa en el origen de la arteria carótida interna {{lado}} con reducción significativa de la luz.\n\nSe registran velocidades aumentadas: VPS ACC {{vps_acc}} cm/s, VPS ACI {{vps}} cm/s, VFD ACI {{vfd}} cm/s, relación ACI/ACC {{ratio}}, con aliasing y turbulencia espectral.\n\nHallazgos compatibles con estenosis severa (>70%).\n\nArterias vertebrales permeables.",
    "conclusion": "Estenosis severa de ACI {{lado}} (>70%). Derivación a cirugía vascular para evaluación de revascularización."
  },
  {
    "group": "Estenosis carotídea ACI",
    "title": "Suboclusión ACI (near-occlusion)",
    "variables": ["lado", "vps"],
    "body": "ECODOPPLER DE VASOS DE CUELLO\n\nSe identifica luz residual filiforme en arteria carótida interna {{lado}}, con señal Doppler color de bajo flujo (\"string sign\").\n\nVPS residual {{vps}} cm/s. Las velocidades pueden estar paradójicamente reducidas por colapso del lumen distal a la lesión crítica.\n\nHallazgos compatibles con suboclusión (near-occlusion) — lesión >99% con mínima luz residual.\n\nArterias vertebrales permeables.",
    "conclusion": "Suboclusión de ACI {{lado}} (near-occlusion). Derivación urgente a cirugía vascular."
  },
  {
    "group": "Estenosis carotídea ACI",
    "title": "Oclusión ACI",
    "variables": ["lado"],
    "body": "ECODOPPLER DE VASOS DE CUELLO\n\nNo se detecta flujo Doppler en la arteria carótida interna {{lado}}, compatible con oclusión total.\n\nSe observa material endoluminal ecogénico.\n\nCarótida externa ipsilateral con flujo conservado.\n\nArterias vertebrales permeables con flujo anterógrado.",
    "conclusion": "Oclusión total de ACI {{lado}}. Tratamiento médico y evaluación neurológica."
  },

  // ── Grupo 5: Otras patologías ───────────────────────────
  {
    "group": "Otras patologías",
    "title": "Estenosis carótida externa significativa",
    "variables": ["lado", "vps"],
    "body": "ECODOPPLER DE VASOS DE CUELLO\n\nSe identifica estenosis en arteria carótida externa {{lado}} con VPS de {{vps}} cm/s.\n\nFlujo distal presente con patrón de alta resistencia.\n\nResto de ejes carotídeos sin estenosis significativa.\n\nArterias vertebrales permeables.",
    "conclusion": "Estenosis significativa de carótida externa {{lado}}."
  }
];

// ─── Variable field definitions ───────────────────────────
const VAR_CONFIG = {
  lado: {
    type: 'select',
    label: 'Lado',
    options: [
      { value: 'derecha', label: 'Derecha' },
      { value: 'izquierda', label: 'Izquierda' }
    ]
  },
  lado_bilateral: {
    type: 'select',
    label: 'Lado',
    options: [
      { value: 'derecho', label: 'Derecho' },
      { value: 'izquierdo', label: 'Izquierdo' },
      { value: 'ambas', label: 'Ambos lados' }
    ]
  },
  arteria: {
    type: 'select',
    label: 'Arteria / Localización',
    options: [
      { value: 'el bulbo carotídeo derecho', label: 'Bulbo derecho' },
      { value: 'el bulbo carotídeo izquierdo', label: 'Bulbo izquierdo' },
      { value: 'ambos bulbos carotídeos', label: 'Bulbos bilaterales' },
      { value: 'la ACC distal derecha', label: 'ACC derecha' },
      { value: 'la ACC distal izquierda', label: 'ACC izquierda' },
      { value: 'el origen de ACI derecha', label: 'Origen ACI derecha' },
      { value: 'el origen de ACI izquierda', label: 'Origen ACI izquierda' },
      { value: 'la ACE derecha', label: 'ACE derecha' },
      { value: 'la ACE izquierda', label: 'ACE izquierda' }
    ]
  },
  tipo_placa: {
    type: 'select',
    label: 'Tipo de placa',
    options: [
      { value: 'fibrolipídica', label: 'Fibrolipídica' },
      { value: 'fibrocalcificada', label: 'Fibrocalcificada' },
      { value: 'heterogénea', label: 'Heterogénea' },
      { value: 'mixta', label: 'Mixta' }
    ]
  },
  vps_acc: {
    type: 'number',
    label: 'VPS ACC (cm/s)',
    placeholder: 'ej: 80',
    step: '1',
    min: '0'
  },
  vps: {
    type: 'number',
    label: 'VPS ACI (cm/s)',
    placeholder: 'ej: 260',
    step: '1',
    min: '0'
  },
  vfd: {
    type: 'number',
    label: 'VFD ACI (cm/s)',
    placeholder: 'ej: 110',
    step: '1',
    min: '0'
  },
  ratio: {
    type: 'number',
    label: 'Ratio ACI/ACC (auto)',
    placeholder: '—',
    step: '0.1',
    min: '0',
    readonly: true
  }
};

// ─── Smart suggestion rules ───────────────────────────────
const SUGGESTIONS = [
  {
    test: (vals) => {
      const vps = parseFloat(vals.vps);
      return !isNaN(vps) && vps > 230;
    },
    message: (vals) => `VPS ${vals.vps} cm/s detectada — criterios de <strong>estenosis severa (&gt;70%)</strong>.`,
    suggestTemplate: 'Estenosis severa ACI (>70%)'
  },
  {
    test: (vals) => {
      const vps = parseFloat(vals.vps);
      return !isNaN(vps) && vps >= 125 && vps <= 230;
    },
    message: (vals) => `VPS ${vals.vps} cm/s — compatible con <strong>estenosis moderada (50–69%)</strong>.`,
    suggestTemplate: 'Estenosis moderada ACI (50–69%)'
  }
];
