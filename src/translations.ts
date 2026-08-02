/**
 * Translation Dictionary for Rayvora Vision Pro
 * Supports Portuguese (pt), Spanish (es), and English (en)
 */

export type Language = 'pt' | 'es' | 'en';

export const translations = {
  pt: {
    // Header & Brand
    appSub: 'Sistema de estimativa de peso e acompanhamento de bovinos com visão computacional',
    serverAiOnline: 'IA Servidor Online',
    localAiActive: 'IA Local Ativa',
    notifTitle: 'Central de Alertas',
    markRead: 'Marcar lidas',
    closePanel: 'Fechar Painel',
    vetSpecialty: 'Veterinário Chefe',
    
    // Tabs & Navigation
    dashboard: 'Painel',
    assessments: 'Avaliações',
    history: 'Histórico',
    reports: 'Registros',
    sideOverview: 'Visão Geral',
    sideHealth: 'Acompanhamento',
    sideAnalytics: 'Histórico',
    sideTechnical: 'Suporte Técnico',
    sideMyAccount: 'Minha Conta',
    sideLogout: 'Sair (Logout)',
    newAssessment: 'Nova Avaliação',
    mobileMenuLabel: 'Menu Lateral',
    modulesLabel: 'Módulos Rayvora',
    mainNavigation: 'Navegação Principal',

    // Settings Modal
    settingsTitle: 'Configurações de Parâmetros',
    cameraCalib: 'Calibração Óptica e Alinhamento',
    cameraCalibSub: 'Autocompensar distorção analítica de lente e luz campestre',
    minConfidence: 'Mapeamento de Precisão Biométrica',
    minConfidenceSub: 'Descartar diagnósticos abaixo deste valor',
    minPct: '% MÍN.',
    criticalEcc: 'Alertas de Peso',
      criticalEccSub: 'Enviar alertas automáticos para o celular do manejador',
    standardWeight: 'Unidade de Peso Padrão',
    weightKg: 'Quilos (kg)',
    weightArroba: 'Arroba (@)',
    cancel: 'Cancelar',
    saveSettings: 'Salvar Ajustes',
    saved: 'Salvo!',

    // Language Selector
    langSelectTitle: 'Idioma do Sistema',
    langPt: 'Português',
    langEs: 'Espanhol',
    langEn: 'Inglês',
    langSelectLabel: 'Selecionar Idioma',

    // Offline / Status
    offlineMode: 'Modo Offline (Simulação)',
    onlineMode: 'IA Real Ativa',

    // Dashboard View
    herdSummary: 'Resumo do Rebanho',
    herdSummarySub: 'Monitoramento de registros e estimativas de peso por animal',
    syncTelemetry: 'Sincronizar Telemetria',
    syncing: 'Sincronizando...',
    totalAnimals: 'Total de Animais',
    readySlaughter: 'Registros em Análise',
    bcsAverage: 'Peso Médio do Lote',
    newThisWeek: 'novos esta semana',
    idealCarcass: 'animais com peso dentro da faixa esperada',
    optimalBcs: 'faixa de peso adequada',
    recentAssessments: 'Últimas Avaliações',
    viewFullHistory: 'Visualizar Todo Histórico',
    lotTag: 'Lote / Brinco',
      finalBcs: 'Peso Estimado',
    aiDiag: 'Diagnóstico IA',
    status: 'Status',
    predictiveAi: 'Resumo de IA Local',
    recommendedInsights: 'Sugestões recomendadas por Rayvora Vision Pro',
    generateReportCsv: 'Exportar CSV',
  },
  es: {
    // Header & Brand
    appSub: 'Sistema de estimación de peso y seguimiento de bovinos con visión computacional',
    serverAiOnline: 'IA de Servidor Online',
    localAiActive: 'IA Local Activa',
    notifTitle: 'Centro de Alertas',
    markRead: 'Marcar como leídas',
    closePanel: 'Cerrar Panel',
    vetSpecialty: 'Veterinario Jefe',

    // Tabs & Navigation
    dashboard: 'Tablero',
    assessments: 'Evaluaciones',
    history: 'Historial',
    reports: 'Registros',
    sideOverview: 'Vista General',
    sideHealth: 'Seguimiento',
    sideAnalytics: 'Historial',
    sideTechnical: 'Soporte Técnico',
    sideMyAccount: 'Mi Cuenta',
    sideLogout: 'Salir (Cerrar Sesión)',
    newAssessment: 'Nueva Evaluación',
    mobileMenuLabel: 'Menú Lateral',
    modulesLabel: 'Módulos Rayvora',
    mainNavigation: 'Navegación Principal',

    // Settings Modal
    settingsTitle: 'Configuración del Sistema',
    cameraCalib: 'Calibración Óptica y Alineación',
    cameraCalibSub: 'Autocompensar distorsión analítica de lente y luz campestre',
    minConfidence: 'Mapeo de Precisión Biométrica',
    minConfidenceSub: 'Descartar diagnósticos por debajo de este valor',
    minPct: '% MÍN.',
    criticalEcc: 'Alertas de Peso',
    criticalEccSub: 'Enviar alertas automáticas al celular del encargado',
    standardWeight: 'Unidad de Peso Estándar',
    weightKg: 'Kilos (kg)',
    weightArroba: 'Arroba (@)',
    cancel: 'Cancelar',
    saveSettings: 'Guardar Ajustes',
    saved: '¡Guardado!',

    // Language Selector
    langSelectTitle: 'Idioma del Sistema',
    langPt: 'Portugués',
    langEs: 'Español',
    langEn: 'Inglés',
    langSelectLabel: 'Seleccionar Idioma',

    // Offline / Status
    offlineMode: 'Modo Offline (Simulación)',
    onlineMode: 'IA Real Activa',

    // Dashboard View
    herdSummary: 'Resumen del Rebaño',
    herdSummarySub: 'Monitoreo de registros y estimaciones de peso por animal',
    syncTelemetry: 'Sincronizar Telemetría',
    syncing: 'Sincronizando...',
    totalAnimals: 'Total de Animales',
    readySlaughter: 'Registros en Análisis',
    bcsAverage: 'Peso Promedio del Lote',
    newThisWeek: 'nuevos esta semana',
    idealCarcass: 'animales con peso dentro del rango esperado',
    optimalBcs: 'rango de peso adecuado',
    recentAssessments: 'Últimas Evaluaciones',
    viewFullHistory: 'Ver Todo el Historial',
    lotTag: 'Lote / Arete',
    finalBcs: 'Peso Estimado',
    aiDiag: 'Diagnóstico IA',
    status: 'Estado',
    predictiveAi: 'Resumen de IA Local',
    recommendedInsights: 'Sugerencias recomendadas por Rayvora Vision Pro',
    generateReportCsv: 'Generar Reporte CSV',
  },
  en: {
    // Header & Brand
    appSub: 'Bovine weight estimation and tracking system using computer vision',
    serverAiOnline: 'Server AI Online',
    localAiActive: 'Local AI Active',
    notifTitle: 'Alerts Center',
    markRead: 'Mark as read',
    closePanel: 'Close Panel',
    vetSpecialty: 'Chief Veterinarian',

    // Tabs & Navigation
    dashboard: 'Dashboard',
    assessments: 'Assessments',
    history: 'History',
    reports: 'Records',
    sideOverview: 'Overview',
    sideHealth: 'Monitoring',
    sideAnalytics: 'History',
    sideTechnical: 'Technical Support',
    sideMyAccount: 'My Account',
    sideLogout: 'Logout',
    newAssessment: 'New Assessment',
    mobileMenuLabel: 'Side Menu',
    modulesLabel: 'Rayvora Modules',
    mainNavigation: 'Main Navigation',

    // Settings Modal
    settingsTitle: 'System Settings',
    cameraCalib: 'Optical Lens Calibration',
    cameraCalibSub: 'Auto-compensate analytic lens and field lighting distortion',
    minConfidence: 'Biometric Analysis Precision',
    minConfidenceSub: 'Discard diagnostics below this value',
    minPct: '% MIN.',
    criticalEcc: 'Weight Alerts',
    criticalEccSub: 'Send automatic alerts to the handler\'s mobile phone',
    standardWeight: 'Standard Weight Unit',
    weightKg: 'Kilograms (kg)',
    weightArroba: 'Arroba (@)',
    cancel: 'Cancel',
    saveSettings: 'Save Settings',
    saved: 'Saved!',

    // Language Selector
    langSelectTitle: 'System Language',
    langPt: 'Portuguese',
    langEs: 'Spanish',
    langEn: 'English',
    langSelectLabel: 'Select Language',

    // Offline / Status
    offlineMode: 'Offline Mode (Simulation)',
    onlineMode: 'Real AI Active',

    // Dashboard View
    herdSummary: 'Herd Summary',
    herdSummarySub: 'Monitoring of records and estimated weight by animal',
    syncTelemetry: 'Synchronize Telemetry',
    syncing: 'Synchronizing...',
    totalAnimals: 'Total Animals',
    readySlaughter: 'Records in Review',
    bcsAverage: 'Average Lot Weight',
    newThisWeek: 'new this week',
    idealCarcass: 'animals within the expected weight range',
    optimalBcs: 'appropriate weight range',
    recentAssessments: 'Recent Assessments',
    viewFullHistory: 'View Full History',
    lotTag: 'Lot / Tag',
    finalBcs: 'Estimated Weight',
    aiDiag: 'AI Diagnostic',
    status: 'Status',
    predictiveAi: 'Local AI Summary',
    recommendedInsights: 'Suggestions recommended by Rayvora Vision Pro',
    generateReportCsv: 'Generate CSV Report',
  }
};
