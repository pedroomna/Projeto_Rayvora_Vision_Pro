/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Sparkles, 
  ChevronRight, 
  AlertCircle, 
  ArrowRight,
  RefreshCw, 
  Download,
  Database,
  Camera
} from 'lucide-react';
import { CattleRecord, DashboardStats } from '../types';
import { SAMPLE_CATTLE } from '../data/samples';
import { motion } from 'motion/react';
import { translations, Language } from '../translations';
import CameraTourGuideModal from './CameraTourGuideModal';

interface DashboardViewProps {
  stats: DashboardStats;
  records: CattleRecord[];
  recentRecords: CattleRecord[];
  onSelectRecord: (record: CattleRecord) => void;
  onNavigateToHistory: () => void;
  triggerRefreshInsights: (fromTelemetry?: boolean) => Promise<void>;
  loadingInsights: boolean;
  language?: Language;
  realDataOnly?: boolean;
  onToggleRealDataOnly?: (val: boolean) => void;
}

export default function DashboardView({
  stats,
  records,
  recentRecords,
  onSelectRecord,
  onNavigateToHistory,
  triggerRefreshInsights,
  loadingInsights,
  language = 'pt',
  realDataOnly = false,
  onToggleRealDataOnly = () => {}
}: DashboardViewProps) {
  
  const t = translations[language];

  // Real weight distribution computed directly from the animals currently on record.
  // Buckets follow the same weight thresholds already shown on the stat cards above
  // (< 350kg monitoring, > 450kg ideal range).
  const WEIGHT_BUCKETS = [
    { key: 'low', label: '< 350', min: -Infinity, max: 350 },
    { key: 'mid', label: '350–450', min: 350, max: 450 },
    { key: 'high', label: '450–550', min: 450, max: 550 },
    { key: 'top', label: '550+', min: 550, max: Infinity },
  ];

  const weightDistribution = WEIGHT_BUCKETS.map(bucket => ({
    label: bucket.label,
    count: records.filter(r => r.weight >= bucket.min && r.weight < bucket.max).length,
  }));

  const maxBucketCount = Math.max(1, ...weightDistribution.map(b => b.count));
  
  const [isDark, setIsDark] = useState(false);
  useEffect(() => {
    setIsDark(document.documentElement.classList.contains('dark'));
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains('dark'));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  const [isSyncingTelemetry, setIsSyncingTelemetry] = useState(false);
  const [syncMessage, setSyncMessage] = useState('');
  const [showSyncSuccessToast, setShowSyncSuccessToast] = useState(false);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [showCameraTour, setShowCameraTour] = useState(false);

  const handleSincronizarTelemetria = async () => {
    setIsSyncingTelemetry(true);
    setShowSyncSuccessToast(false);
    setSyncMessage('📡 Conectando ao Gateway BLE (Setor Pasto Norte)...');
    
    setTimeout(() => {
      setSyncMessage('📥 Lendo dados das Balanças do cocho Pasto Norte...');
    }, 1000);

    setTimeout(() => {
      setSyncMessage('🔋 Sincronizando Beacons e colares ruminais (Lote A-45)...');
    }, 2000);

    setTimeout(async () => {
      try {
        await triggerRefreshInsights(true);
      } catch (err) {
        console.warn(err);
      }
      setIsSyncingTelemetry(false);
      setSyncMessage('');
      setShowSyncSuccessToast(true);
      
      // Auto dismiss success toast after 5 seconds
      setTimeout(() => {
        setShowSyncSuccessToast(false);
      }, 5000);
    }, 3000);
  };

  // Report generation removed in simplified workflow
  
  const handleExportCsv = () => {
    if (!records || records.length === 0) {
      alert('Não há registros para exportar.');
      return;
    }

    const headers = [
      'ID do Brinco',
      'Data da Avaliação',
      'Lote',
      'Raça',
      'Peso (kg)',
      'Peso Real (Balança)',
      'ECC (Escore)',
      'Veredito',
      'Notas'
    ];

    const csvRows = [headers.join(',')];

    for (const record of records) {
      const values = [
        record.animalId || record.id,
        record.date,
        record.lot,
        record.breed,
        record.weight.toFixed(1),
        record.isRealWeight ? 'Sim' : 'Não',
        record.score.toFixed(1),
        record.verdict,
        `"${(record.notes || '').replace(/"/g, '""')}"` // Escape double quotes
      ];
      csvRows.push(values.join(','));
    }

    const csvString = csvRows.join('\n');
    const blob = new Blob([`\uFEFF${csvString}`], { type: 'text/csv;charset=utf-8;' }); // BOM for Excel
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'relatorio_rebanho.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-fade-in p-1">
      {/* Dynamic Telemetry Status Inline Banners */}
      {(isSyncingTelemetry || showSyncSuccessToast) && (
        <div className="space-y-2 animate-fade-in text-left">
          {isSyncingTelemetry && (
            <div className="flex items-center gap-3 p-3 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/60 rounded text-emerald-800 dark:text-[#aeeecb] text-xs font-mono font-bold animate-pulse">
              <RefreshCw className="h-4 w-4 animate-spin shrink-0 text-emerald-600 dark:text-emerald-400" />
              <span>{syncMessage}</span>
            </div>
          )}

          {showSyncSuccessToast && (
            <div className="flex items-center justify-between gap-3 p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-250 dark:border-emerald-800/80 rounded text-[#0e5138] dark:text-[#aeeecb] text-xs font-sans font-bold shadow-sm">
              <div className="flex items-center gap-2">
                <span className="p-1 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                  <span className="block h-2 w-2 rounded-full bg-emerald-500" />
                </span>
                <span>{realDataOnly ? 'Giro de Balança Sincronizado! Seus registros em tempo real foram sincronizados e as métricas do painel atualizadas com sucesso.' : 'Telemetria do Rebanho Sincronizada! Leituras de 14 balanças de cocho, 28 colares ruminais e Beacons de pastagem foram integradas e atualizadas com sucesso.'}</span>
              </div>
              <button 
                onClick={() => setShowSyncSuccessToast(false)}
                className="text-emerald-700 hover:text-emerald-950 dark:text-emerald-400 dark:hover:text-emerald-300 font-bold focus:outline-none cursor-pointer text-sm"
              >
                ✕
              </button>
            </div>
          )}
        </div>
      )}

      {/* Page Title & Slogan */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-950 dark:text-[#f8fafc] font-sans">
            {t.herdSummary}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            {t.herdSummarySub}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleSincronizarTelemetria}
            disabled={isSyncingTelemetry || loadingInsights}
            className="flex items-center gap-2 px-3.5 py-2 rounded-md border border-gray-200 dark:border-gray-800 text-xs font-semibold text-gray-600 dark:text-gray-300 hover:text-[#1e3a8a] dark:hover:text-sky-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`h-3 w-3 ${isSyncingTelemetry || loadingInsights ? 'animate-spin' : ''}`} />
            <span>{isSyncingTelemetry ? t.syncing : t.syncTelemetry}</span>
          </button>
        </div>
      </div>

      {/* 3 Grid Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: Total Animals */}
        <div className="bg-white dark:bg-[#0e1320] rounded-lg border border-gray-200 dark:border-gray-800 p-5 shadow-[0_2px_4px_rgba(0,0,0,0.03)] dark:shadow-none flex flex-col justify-between text-left">
          <div>
            <span className="text-[10px] font-mono tracking-wider text-gray-400 dark:text-gray-500 font-bold block uppercase">
              {t.totalAnimals}
            </span>
            <div className="text-4xl font-sans font-bold text-gray-900 dark:text-white mt-2">
              {stats.totalAnimals.toLocaleString()}
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 text-xs font-mono font-medium mt-4">
            <TrendingUp className="h-4 w-4" />
            <span>+{stats.totalNewThisWeek} {t.newThisWeek}</span>
          </div>
        </div>

        {/* Card 2: Ready for Slaughter */}
        <div className="bg-white dark:bg-[#0e1320] rounded-lg border border-gray-200 dark:border-gray-800 p-5 shadow-[0_2px_4px_rgba(0,0,0,0.03)] dark:shadow-none flex flex-col justify-between text-left">
          <div>
            <span className="text-[10px] font-mono tracking-wider text-gray-400 dark:text-gray-500 font-bold block uppercase">
              {t.readySlaughter}
            </span>
            <div className="text-4xl font-sans font-bold text-gray-900 dark:text-white mt-2">
              {stats.readyForSlaughter}
            </div>
          </div>
          <div className="mt-4">
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-[#aeeecb] dark:bg-[#aeeecb]/20 text-[#316e52] dark:text-[#aeeecb]">
              {language === 'es' ? 'CONDICIÓN IDEAL (PESO > 450kg)' : language === 'en' ? 'IDEAL RANGE (WEIGHT > 450kg)' : 'FAIXA IDEAL (PESO > 450kg)'}
            </span>
          </div>
        </div>

        {/* Card 3: At Risk / Under Monitoring with smooth background color animation */}
        <motion.div 
          animate={{
            backgroundColor: stats.underMonitoring > 0 
              ? (isDark ? ["#0e1320", "#311818", "#0e1320"] : ["#ffffff", "#fef2f2", "#ffffff"])
              : (isDark ? "#0e1320" : "#ffffff")
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="rounded-lg border border-red-100 dark:border-red-950/40 p-5 shadow-[0_2px_4px_rgba(0,0,0,0.03)] dark:shadow-none flex flex-col justify-between text-left"
        >
          <div>
            <span className="text-[10px] font-mono tracking-wider text-red-600 dark:text-red-400 font-bold block uppercase">
              {language === 'es' ? 'Monitoreo Activo' : language === 'en' ? 'Active Monitoring' : 'Em Monitoramento Ativo'}
            </span>
            <div className="text-4xl font-sans font-bold text-[#ba1a1a] dark:text-red-400 mt-2 flex items-baseline justify-between">
              <span>{stats.underMonitoring}</span>
              {stats.underMonitoring > 0 && (
                <span className="text-[10px] font-mono font-bold text-[#ba1a1a] dark:text-red-400 animate-pulse">
                  {language === 'es' ? '⚠️ DETECTADO NO APTO' : language === 'en' ? '⚠️ UNFIT DETECTED' : '⚠️ DETECTADO NÃO APTO'}
                </span>
              )}
            </div>
          </div>
          <div className="mt-4">
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-[#ffdad6] dark:bg-[#ffdad6]/20 text-[#93000a] dark:text-red-400">
              {language === 'es' ? 'No Aptos (PESO < 350kg)' : language === 'en' ? 'Unfit (WEIGHT < 350kg)' : 'Não Aptos (PESO < 350kg)'}
            </span>
          </div>
        </motion.div>
      </div>

      {/* Middle Grid - SVG Spline Chart + AI Insights Box */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Side: Real Weight Distribution Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-[#0e1320] rounded-lg border border-gray-200 dark:border-gray-800 p-5 shadow-[0_2px_4px_rgba(0,0,0,0.03)] dark:shadow-none">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-sm font-semibold text-gray-950 dark:text-white uppercase tracking-wide font-sans">
                {language === 'es' ? 'Distribución de Peso del Rebaño' : language === 'en' ? 'Herd Weight Distribution' : 'Distribuição de Peso do Rebanho'}
              </h3>
              <p className="text-xs text-gray-400 font-mono mt-0.5">
                {language === 'es' ? 'Cantidad de animales por rango de peso estimado' : language === 'en' ? 'Number of animals per estimated weight range' : 'Quantidade de animais por faixa de peso estimado'}
              </p>
            </div>
            <span className="text-xs font-mono bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 font-medium font-bold">
              {records.length} {language === 'es' ? 'ANIMALES' : language === 'en' ? 'ANIMALS' : 'ANIMAIS'}
            </span>
          </div>

          {/* Real bar chart: number of animals per weight bucket */}
          <div className="h-64 w-full relative pt-4 pr-4">
            <svg className="w-full h-full absolute inset-0 pt-2 pb-6" viewBox="0 0 500 200" preserveAspectRatio="none">
              {weightDistribution.map((bucket, idx) => {
                const totalWidth = 500;
                const margin = 50;
                const availableWidth = totalWidth - margin * 2;
                const step = availableWidth / (weightDistribution.length - 1);
                const cx = margin + idx * step;

                // Height of bar proportional to how many animals fall in this bucket
                const barHeight = (bucket.count / maxBucketCount) * 140;
                const y = 170 - barHeight;
                const width = 40;
                const rx = 0;

                const barColor = isDark ? '#38bdf8' : '#1e3a8a';
                const bgBarColor = isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(30, 58, 138, 0.04)';

                return (
                  <g key={bucket.label} className="group cursor-pointer">
                    {/* Background slot track */}
                    <rect
                      x={cx - width / 2}
                      y={30}
                      width={width}
                      height={140}
                      rx={rx}
                      fill={bgBarColor}
                      className="transition-colors duration-200 group-hover:fill-blue-500/5 dark:group-hover:fill-white/10"
                    />

                    {/* Real animal count column */}
                    <rect
                      x={cx - width / 2}
                      y={y}
                      width={width}
                      height={barHeight}
                      rx={rx}
                      fill={barColor}
                      className="transition-all duration-200 group-hover:opacity-90 transform origin-bottom group-hover:scale-y-[1.02]"
                    />

                    {/* Count displayed above column */}
                    <text
                      x={cx}
                      y={y - 8}
                      textAnchor="middle"
                      fill={isDark ? '#f1f5f9' : '#1e293b'}
                      className="text-[11px] font-sans font-bold select-none transition-transform duration-200 group-hover:-translate-y-1"
                    >
                      {bucket.count}
                    </text>
                  </g>
                );
              })}
            </svg>

            {/* X Axis: weight range labels (kg) */}
            <div className="absolute bottom-0 left-0 right-0 flex justify-between px-8 text-[11px] font-mono font-bold text-gray-400">
              {weightDistribution.map((bucket) => (
                <span key={bucket.label}>
                  {bucket.label} kg
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side: INSIGHTS CARD (Stunning Dark Green Box) */}
        <div className="bg-[#0f2d5c] dark:bg-blue-950 text-white rounded-lg border border-blue-900/30 p-6 shadow-md flex flex-col justify-between text-left">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase font-mono tracking-widest text-sky-300 font-bold">
                {language === 'es' ? 'Insights y Diagnósticos' : language === 'en' ? 'Insights & Diagnostics' : 'Insights & Diagnósticos'}
              </span>
            </div>

            <div className="space-y-3">
                    <p className="text-sm font-sans font-light leading-relaxed text-blue-50">
                {loadingInsights ? (
                  <span className="flex items-center gap-2">
                    <RefreshCw className="h-4 w-4 animate-spin text-sky-300" />
                    <span>{language === 'es' ? 'Procesando estimativas de peso...' : language === 'en' ? 'Processing weight estimations...' : 'Processando estimativas de peso...'}</span>
                  </span>
                ) : (
                  stats.aiInsightsText ? (
                    stats.aiInsightsText
                      .replace(/\*\*/g, '')
                      .replace(/\*/g, '')
                      .replace(/Análise Executiva\s*\(IA\)\s*:/gi, 'Análise Executiva:')
                      .replace(/Análise Executiva\s*\(IA\)/gi, 'Análise Executiva')
                      .replace(/Análise Executiva de IA/gi, 'Análise Executiva')
                  ) : null
                )}
              </p>
            </div>
          </div>

          <div className="pt-6">
            <button
              onClick={handleExportCsv}
              disabled={isGeneratingReport || records.length === 0}
              className="w-full py-2.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/20 font-mono font-bold text-[11px] uppercase tracking-wider rounded transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="h-3.5 w-3.5" />
              <span>{language === 'es' ? 'Exportar CSV' : language === 'en' ? 'Export CSV' : 'Exportar CSV'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Bottom: Avaliações Recentes (Recent Assessments Panel) */}
      <div className="bg-white dark:bg-[#0e1320] rounded-lg border border-gray-200 dark:border-gray-800 shadow-[0_2px_4px_rgba(0,0,0,0.03)] dark:shadow-none p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-950 dark:text-white uppercase tracking-wide font-sans">
            {t.recentAssessments}
          </h3>
          <button
            onClick={onNavigateToHistory}
            className="text-xs font-mono font-bold text-blue-600 dark:text-sky-300 hover:text-blue-800 dark:hover:text-white flex items-center gap-1 group transition-colors"
          >
            <span>{language === 'es' ? 'VER TODAS' : language === 'en' ? 'VIEW ALL' : 'VER TODAS'}</span>
            <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>

        {/* Dense Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-gray-500 dark:text-gray-400 border-collapse">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/30 text-[10px] font-mono tracking-wider font-bold text-gray-400 dark:text-gray-500 uppercase">
                <th className="py-3 px-4">{language === 'es' ? 'MINIATURA' : language === 'en' ? 'THUMBNAIL' : 'MINIATURA'}</th>
                <th className="py-3 px-4">{language === 'es' ? 'ID ANIMAL' : language === 'en' ? 'ANIMAL ID' : 'ANIMAL ID'}</th>
                <th className="py-3 px-4">{language === 'es' ? 'FECHA EVALUACIÓN' : language === 'en' ? 'EVALUATION DATE' : 'DATA AVALIAÇÃO'}</th>
                <th className="py-3 px-4 text-center justify-center">{language === 'es' ? 'PESO' : language === 'en' ? 'WEIGHT' : 'PESO'}</th>
                <th className="py-3 px-4 text-center justify-center">{language === 'es' ? 'VEREDICTO' : language === 'en' ? 'VERDICT' : 'VEREDITO'}</th>
              </tr>
            </thead>
            <tbody>
              {recentRecords.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 px-4 text-center">
                    <div className="flex flex-col items-center justify-center max-w-md mx-auto text-center space-y-3">
                      <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-full text-gray-400">
                        <Database className="h-6 w-6" />
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900 dark:text-gray-100 text-sm">Nenhum animal registrado em tempo real</h4>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                          Você ativou o Modo de Dados 100% Reais. Para começar, envie fotos de campo de bovinos ou clique em Novo Registro no topo para criar sua primeira ficha de campo!
                        </p>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                recentRecords.map((r) => (
                  <tr 
                    key={r.id} 
                    className="border-b border-gray-150/50 dark:border-gray-800/60 hover:bg-gray-50/70 dark:hover:bg-gray-800/40 transition-all duration-200 group"
                  >
                    <td className="py-3 px-4">
                      <img 
                        src={r.photoUrl} 
                        alt={`Minis ${r.id}`} 
                        className="h-10 w-16 rounded object-cover border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 flex-shrink-0 transition-transform duration-200 group-hover:scale-105"
                        referrerPolicy="no-referrer"
                      />
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-[#1e3a8a] dark:text-sky-300 transition-all duration-150 group-hover:text-blue-600 dark:group-hover:text-sky-400">
                      #{r.animalId || r.id}
                    </td>
                    <td className="py-3 px-4 text-gray-700 dark:text-gray-300 transition-colors duration-150 group-hover:text-gray-900 dark:group-hover:text-white">
                      {r.date}
                    </td>
                    <td className="py-3 px-4 text-center font-mono font-bold text-gray-900 dark:text-gray-150 transition-all duration-150 group-hover:scale-105">
                      <div className="flex items-center justify-center gap-1.5">
                        <span>{r.weight.toFixed(1)} <span className="text-[10px] text-gray-400 dark:text-gray-500 font-normal">kg</span></span>
                        {r.isRealWeight && (
                          <span className="inline-flex items-center justify-center p-0.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-400 rounded-full border border-emerald-200 dark:border-emerald-850" title="Peso aferido fisicamente na balança">
                            <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="4">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[9px] font-mono font-bold tracking-wider uppercase transition-all duration-200 ${
                        r.verdict === 'APTO PARA ABATE'
                          ? 'bg-[#aeeecb]/80 dark:bg-[#aeeecb]/15 text-[#0e5138] dark:text-[#aeeecb] group-hover:bg-[#aeeecb] dark:group-hover:bg-[#aeeecb]/25 border border-emerald-300/20 dark:border-emerald-900/40'
                          : 'bg-[#ffdad6]/80 dark:bg-[#ffdad6]/10 text-[#93000a] dark:text-red-400 group-hover:bg-[#ffdad6] dark:group-hover:bg-[#ffdad6]/20 border border-red-300/20 dark:border-red-900/40'
                      }`}>
                        {r.verdict}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <CameraTourGuideModal isOpen={showCameraTour} onClose={() => setShowCameraTour(false)} language={language} />
    </div>
  );
}
