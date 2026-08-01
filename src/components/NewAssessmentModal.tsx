/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { 
  X, 
  Upload, 
  Camera, 
  Image as ImageIcon, 
  Sparkles, 
  RefreshCw, 
  Scan,
  Database,
  ShieldCheck,
  Trash2,
  AlertTriangle
} from 'lucide-react';
import { OTHER_SAMPLE_IMAGES } from '../data/samples';
import { CattleRecord } from '../types';
import CameraTourGuideModal from './CameraTourGuideModal';

interface NewAssessmentModalProps {
  onClose: () => void;
  onAnalysisComplete: (newRecord: CattleRecord) => void;
  vetEmail?: string;
  language?: string;
}

export default function NewAssessmentModal({ onClose, onAnalysisComplete, vetEmail, language }: NewAssessmentModalProps) {
  const [earTag, setEarTag] = useState('');

  const getLocalFormattedDate = (): string => {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const month = months[now.getMonth()];
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${day} ${month} ${now.getFullYear()}, ${hours}:${minutes}`;
  };
  const [imageInputState, setImageInputState] = useState<'upload' | 'preset' | 'camera'>('upload');
  const [showTour, setShowTour] = useState(false);
  
  // Preset list state
  const [presets, setPresets] = useState(() => {
    const stored = localStorage.getItem('bovinovision_presets');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {
        console.error('Error parsing stored presets', e);
      }
    }
    return OTHER_SAMPLE_IMAGES;
  });
  
  // Image state
  const [selectedPresetUrl, setSelectedPresetUrl] = useState(() => {
    const stored = localStorage.getItem('bovinovision_presets');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        return parsed[0]?.url || '';
      } catch (e) {}
    }
    return OTHER_SAMPLE_IMAGES[0]?.url || '';
  });
  const [uploadedBase64, setUploadedBase64] = useState<string | null>(null);

  const handleRemovePreset = (urlToRemove: string) => {
    const updated = presets.filter(p => p.url !== urlToRemove);
    setPresets(updated);
    localStorage.setItem('bovinovision_presets', JSON.stringify(updated));
    
    if (selectedPresetUrl === urlToRemove) {
      if (updated.length > 0) {
        setSelectedPresetUrl(updated[0].url);
      } else {
        setSelectedPresetUrl('');
      }
    }
  };
  
  // Camera states
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [isStartingCamera, setIsStartingCamera] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Loading states
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const startCamera = async (forceFacingMode?: 'environment' | 'user') => {
    const activeFacingMode = forceFacingMode || facingMode;
    setIsStartingCamera(true);
    setErrorMessage('');
    
    // Clean up older streams
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
    }

    try {
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: activeFacingMode },
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      };
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setCameraStream(stream);
      setCameraActive(true);
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play().catch(e => console.error("Video play failed:", e));
        };
      }
    } catch (err: any) {
      console.warn('Camera facingMode constraints failed, falling back...', err);
      try {
        const fallbackStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        setCameraStream(fallbackStream);
        setCameraActive(true);
        if (videoRef.current) {
          videoRef.current.srcObject = fallbackStream;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current?.play().catch(e => console.error("Video playback failure on fallback stream:", e));
          };
        }
      } catch (fallbackErr) {
        console.error('All video stream sources rejected:', fallbackErr);
        setErrorMessage('Não foi possível ativar sua webcam ou câmera integrada automaticamente. Certifique-se de liberar as permissões nas configurações do seu navegador ou utilize a opção "Câmera Nativa do Celular" abaixo.');
        setCameraActive(false);
      }
    } finally {
      setIsStartingCamera(false);
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setCameraActive(false);
    setIsStartingCamera(false);
  };

  const toggleFacingMode = () => {
    const nextMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextMode);
    startCamera(nextMode);
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const origWidth = videoRef.current.videoWidth || 640;
      const origHeight = videoRef.current.videoHeight || 480;
      
      const maxWidth = 400;
      const maxHeight = 300;
      let width = origWidth;
      let height = origHeight;
      if (width > height) {
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = "#000";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Mirror horizontally if user-facing (selfie)
        if (facingMode === 'user') {
          ctx.translate(canvas.width, 0);
          ctx.scale(-1, 1);
        }
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        const base64 = canvas.toDataURL('image/jpeg', 0.7);
        setUploadedBase64(base64);
        setErrorMessage('');
        stopCamera();
      }
    }
  };

  // Manage camera streaming automatically during tab lifecycle changes
  useEffect(() => {
    if (imageInputState === 'camera' && !uploadedBase64) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [imageInputState, uploadedBase64]);

  // Helper to compress base64 images using HTML Canvas before setting/sending
  const compressBase64Image = (base64Str: string, maxWidth = 400, maxHeight = 300, quality = 0.7): Promise<string> => {
    return new Promise((resolve) => {
      if (!base64Str || !base64Str.startsWith('data:image')) {
        resolve(base64Str);
        return;
      }
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, width, height);
          ctx.drawImage(img, 0, 0, width, height);
          try {
            const compressed = canvas.toDataURL('image/jpeg', quality);
            resolve(compressed);
          } catch (e) {
            console.error('[Compression] failed to export:', e);
            resolve(base64Str);
          }
        } else {
          resolve(base64Str);
        }
      };
      img.onerror = () => {
        resolve(base64Str);
      };
      img.src = base64Str;
    });
  };

  const handleNativeCameraCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMessage('Por favor, carregue exclusivamente arquivos de imagem (JPEG, PNG).');
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      const base64Str = reader.result as string;
      const compressed = await compressBase64Image(base64Str);
      setUploadedBase64(compressed);
      setErrorMessage('');
      stopCamera();
    };
    reader.readAsDataURL(file);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMessage('Por favor, carregue exclusivamente arquivos de imagem (JPEG, PNG).');
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      const base64Str = reader.result as string;
      const compressed = await compressBase64Image(base64Str);
      setUploadedBase64(compressed);
      setErrorMessage('');
    };
    reader.readAsDataURL(file);
  };

  const triggerAnalysis = async () => {
    if (!earTag.trim()) {
      setErrorMessage('Informe o número do brinco antes de prosseguir com a pesagem.');
      return;
    }

    setIsAnalyzing(true);
    setErrorMessage('');
    
    // Choose which image source base64 to leverage
    let finalImageBase64 = '';
    
    if (imageInputState === 'preset') {
      finalImageBase64 = selectedPresetUrl;
    } else {
      if (!uploadedBase64) {
        setErrorMessage('Nenhuma imagem carregada ou capturada.');
        setIsAnalyzing(false);
        return;
      }
      finalImageBase64 = uploadedBase64;
    }

    // Ensure the final image is fully compressed to stay under Firestore 1MB document payload rules
    if (finalImageBase64 && finalImageBase64.startsWith('data:image')) {
      try {
        finalImageBase64 = await compressBase64Image(finalImageBase64, 400, 300, 0.7);
      } catch (comprErr) {
        console.warn("Pre-analysis image compression failed:", comprErr);
      }
    }

    // Modern analysis scanning logs
    const progressLogs = [
      'Iniciando conexão com o serviço de visão computacional...',
      'Localizando o animal na imagem (segmentação)...',
      'Recortando a região de interesse...',
      'Estimando o peso a partir da imagem recortada...',
      'Finalizando análise...'
    ];

    let i = 0;
    const interval = setInterval(() => {
      if (i < progressLogs.length) {
        setAnalysisProgress(progressLogs[i]);
        i++;
      }
    }, 1200);

    try {
      setAnalysisProgress(progressLogs[0]);
      
      const clientDate = getLocalFormattedDate();

      let customSmtpData = undefined;
      try {
        const storedProfile = localStorage.getItem('bovinovision_profile');
        if (storedProfile) {
          const profile = JSON.parse(storedProfile);
          if (profile?.smtpConfig) {
            customSmtpData = profile.smtpConfig;
          }
        }
      } catch (e) {
        console.error('Error fetching custom SMTP settings for analysis:', e);
      }

      const payload = {
        imageBase64: finalImageBase64,
        earTag: earTag.trim(),
        clientDate: clientDate,
        vetEmail: vetEmail,
        customSmtp: customSmtpData
      };

      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const contentType = res.headers.get('content-type') || '';
      let analyzedRecord: CattleRecord;

      if (!contentType.includes('application/json')) {
        const textResponse = await res.text();
        console.error('Non-JSON response received from /api/analyze:', textResponse.slice(0, 300));
        throw new Error('Servidor enviou uma resposta incompatível. Tente novamente em instantes.');
      } else {
        const responseData = await res.json();
        if (!res.ok) {
          throw new Error(responseData.error || responseData.message || 'Falha no processador de Visão de IA dos servidores Rayvora Vision Pro.');
        }
        analyzedRecord = responseData;
      }

      if ((analyzedRecord as any).animalDetected === false || (analyzedRecord as any).isRearView === false) {
        clearInterval(interval);
        setIsAnalyzing(false);
        setErrorMessage((analyzedRecord as any).message || 'Aviso: Imagem recusada. O sistema permite exclusivamente a parte traseira (garupa e posterior) do bovino.');
        return;
      }

      // Complete!
      clearInterval(interval);
      onAnalysisComplete(analyzedRecord);
    } catch (err: any) {
      console.error('Analysis error:', err);
      if (err instanceof TypeError && err.message === 'Failed to fetch') {
        setErrorMessage('Não foi possível conectar ao servidor de análise. Verifique se o servidor local (npm run dev) está rodando e tente novamente.');
      } else {
        setErrorMessage(err.message || 'Erro ao processar a imagem. Verifique sua conexão e tente novamente.');
      }
      setIsAnalyzing(false);
    } finally {
      clearInterval(interval);
    }
  };

  const currentActiveImagePreview = () => {
    if (imageInputState === 'preset') return selectedPresetUrl;
    if (uploadedBase64) return uploadedBase64;
    return null;
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      {/* Container Box */}
      <div className="relative w-full max-w-2xl bg-white dark:bg-[#111827] rounded-lg border border-gray-200 dark:border-gray-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header bar matching CattleGuard pro formatting */}
        <div className="bg-[#0f2d5c] dark:bg-blue-950 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Scan className="h-5 w-5 text-sky-300 animate-pulse" />
            <h2 className="text-base font-bold tracking-tight font-sans">
              Nova Avaliação
            </h2>
          </div>
          <button
            onClick={() => { onClose(); }}
            disabled={isAnalyzing}
            className="p-1.5 rounded-full hover:bg-white/10 text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-left">
          {errorMessage && (
            <div className="p-4 bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 text-xs font-sans rounded-lg border border-amber-300 dark:border-amber-700/60 shadow-md flex items-start gap-3 animate-fade-in">
              <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="font-bold block text-sm text-amber-950 dark:text-amber-100">
                  Aviso de Validação do Animal
                </span>
                <p className="leading-relaxed text-amber-900 dark:text-amber-200">{errorMessage}</p>
              </div>
            </div>
          )}

          {/* Identificação do animal via brinco */}
          <div className="flex flex-col">
            <label className="text-[10px] font-mono font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1">
              Número do Brinco *
            </label>
            <input
              type="text"
              value={earTag}
              onChange={(e) => setEarTag(e.target.value)}
              disabled={isAnalyzing}
              placeholder="Ex: 4521"
              className="w-full h-11 px-3 border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 rounded text-sm placeholder-gray-400 dark:placeholder-gray-600 focus:outline-[#1e3a8a] dark:focus:outline-sky-500"
            />
            <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1">
              Identificador único do animal — obrigatório antes de prosseguir para a avaliação.
            </p>
          </div>

          {/* Info Banner sobre enquadramento da foto */}
          <div className="p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/40 rounded flex items-start gap-2.5 text-left">
            <span className="p-1 rounded bg-blue-500/10 text-blue-700 dark:text-sky-400 mt-0.5 shrink-0">
              <Scan className="h-4 w-4 animate-pulse" />
            </span>
            <div className="flex-1">
              <h4 className="text-xs font-bold text-blue-900 dark:text-sky-300 tracking-tight font-sans">
                Apenas a Parte Traseira (Garupa) é Permitida
              </h4>
              <p className="text-[11px] text-blue-800 dark:text-gray-350 leading-relaxed font-sans">
                O sistema aceita <strong>exclusivamente fotos da região traseira (garupa e posterior)</strong> do bovino. Imagens com outras partes do corpo (cabeça, peito, perfil lateral) serão <strong>automaticamente recusadas</strong> com um aviso de restrição.
              </p>
              <button
                type="button"
                onClick={() => setShowTour(true)}
                className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white dark:bg-sky-500/10 dark:hover:bg-sky-500/20 dark:text-sky-300 text-[10px] font-sans font-bold rounded shadow-sm border border-blue-500/20 dark:border-sky-400/20 cursor-pointer transition-colors"
              >
                <span>Guia de Posicionamento de Câmera</span>
              </button>
            </div>
          </div>

          {/* Tabs for choosing Input Mechanism */}
          {!isAnalyzing && (
            <div className="flex border-b border-gray-150 dark:border-gray-800 text-xs font-mono font-bold">
              <button
                onClick={() => { setImageInputState('upload'); }}
                className={`py-2 px-4 border-b-2 transition-all ${
                  imageInputState === 'upload' ? 'border-[#1e3a8a] text-[#1e3a8a] dark:border-sky-300 dark:text-sky-300' : 'border-transparent text-gray-400 dark:text-gray-500'
                }`}
              >
                Fazer Upload Manual (JPEG / PNG)
              </button>
              <button
                onClick={() => { setImageInputState('camera'); }}
                className={`py-2 px-4 border-b-2 transition-all ${
                  imageInputState === 'camera' ? 'border-[#1e3a8a] text-[#1e3a8a] dark:border-sky-300 dark:text-sky-300' : 'border-transparent text-gray-400 dark:text-gray-500'
                }`}
              >
                Câmera do Dispositivo (Captura)
              </button>
            </div>
          )}

          {/* Tab 2: Standard Drag and drop Upload */}
          {imageInputState === 'upload' && !isAnalyzing && (
            <div className="space-y-4">
              {uploadedBase64 ? (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border border-blue-100 dark:border-blue-950/40 bg-[#f8f9fa] dark:bg-gray-900 rounded-lg p-3">
                  <div className="flex items-center gap-3 w-full">
                    <img src={uploadedBase64} alt="Pre-upload" className="h-12 w-16 object-cover rounded-md border dark:border-gray-850" />
                    <div className="text-left">
                      <span className="font-sans font-bold text-xs text-gray-800 dark:text-gray-200">Fotografia Customizada Carregada</span>
                      <p className="text-[10px] font-mono text-blue-600 dark:text-sky-400 block">Status: Pronto para Análise</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setUploadedBase64(null)}
                    className="flex items-center justify-center gap-1.5 h-8 w-full sm:w-auto shrink-0 rounded-md bg-rose-600/10 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/50 text-xs font-bold px-3"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Remover</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <label className="h-40 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-800 hover:border-blue-700 dark:hover:border-sky-500 bg-[#f8f9fa] dark:bg-gray-900/40 cursor-pointer flex flex-col items-center justify-center text-center p-4 gap-2 transition-colors">
                    <Upload className="h-7 w-7 text-gray-400 animate-bounce" />
                    <span className="text-xs font-bold text-gray-800 dark:text-gray-200">
                      Carregar Foto da Região Traseira
                    </span>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 max-w-md leading-relaxed">
                      Selecione uma foto focada na garupa/posterior do bovino para estimativa de peso.
                    </p>
                    <span className="px-2 py-0.5 rounded bg-gray-150 dark:bg-gray-800 text-[10px] font-mono font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Suporta JPG ou PNG
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              )}
            </div>
          )}

          {/* Tab 3: Camera Capture */}
          {imageInputState === 'camera' && !isAnalyzing && (
            <div className="space-y-4">
              {/* Info banner explaining sandbox restrictions */}
              <div className="p-3.5 rounded bg-[#f8f9fa] dark:bg-gray-900/40 border border-gray-150 dark:border-gray-800 text-[11px] text-gray-600 dark:text-gray-300 space-y-2 text-left">
                <div className="flex items-center gap-1.5 font-bold text-xs text-gray-850 dark:text-sky-300">
                  <RefreshCw className="h-3.5 w-3.5 text-blue-600 dark:text-sky-400 animate-spin" />
                  <span>Por que a Câmera pode Falhar na Visualização?</span>
                </div>
                <p className="leading-relaxed">
                  Para sua segurança pessoal, os navegadores modernos <strong>bloqueiam o canal direto de vídeo (WebRTC)</strong> quando uma aplicação web roda empacotada dentro de uma moldura de teste isolada (Sandbox/iframe) como esta do painel de desenvolvimento.
                </p>
                <div className="pt-1 select-none space-y-1 text-[10px] font-mono leading-normal text-gray-500 dark:text-gray-400">
                  <div className="flex items-start gap-1">
                    <span className="font-bold text-blue-600 dark:text-sky-305">OPÇÃO 1:</span>
                    <span>Clique em <strong>"Abrir em nova aba"</strong> no topo direito do visualizador para acessar a câmera de forma direta.</span>
                  </div>
                  <div className="flex items-start gap-1">
                    <span className="font-bold text-blue-600 dark:text-sky-305">OPÇÃO 2:</span>
                    <span>Use o botão <strong>"Tirar Foto com Câmera Nativa"</strong> abaixo que aciona a câmera oficial do seu celular de forma garantida.</span>
                  </div>
                </div>
              </div>

              {uploadedBase64 ? (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border border-blue-100 dark:border-blue-950/40 bg-[#f8f9fa] dark:bg-gray-900 rounded-lg p-3">
                  <div className="flex items-center gap-3 w-full">
                    <img src={uploadedBase64} alt="Pre-upload" className="h-12 w-16 object-cover rounded-md border dark:border-gray-850" />
                    <div className="text-left">
                      <span className="font-sans font-bold text-xs text-gray-800 dark:text-gray-200">Foto Capturada com Sucesso</span>
                      <p className="text-[10px] font-mono text-blue-600 dark:text-sky-450 block">Status: Pronto para Análise</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setUploadedBase64(null)}
                    className="flex items-center justify-center gap-1.5 h-8 w-full sm:w-auto shrink-0 rounded-md bg-rose-600/10 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/50 text-xs font-bold px-3"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Remover e Tirar Outra</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Aspect Box for Video view / fallback view */}
                  <div className="relative rounded-lg border border-gray-200 dark:border-gray-800 bg-black overflow-hidden aspect-[4/3] max-w-sm mx-auto shadow-inner flex flex-col items-center justify-center">
                    
                    {isStartingCamera && (
                      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center p-4 bg-black/85 text-center text-white gap-3">
                        <RefreshCw className="h-8 w-8 text-sky-450 animate-spin" />
                        <span className="text-[11px] font-mono font-bold tracking-wider uppercase text-sky-350">Ativando Lente da Câmera...</span>
                        <p className="text-[10px] text-gray-400 max-w-xs">Aguardando autorização dos sensores do seu celular ou PC pelo navegador.</p>
                      </div>
                    )}

                    {cameraActive ? (
                      <>
                        <video 
                          ref={videoRef} 
                          className={`w-full h-full object-cover ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
                          playsInline 
                          muted 
                          autoPlay 
                        />
                        
                        {/* Camera type HUD indicator badge */}
                        <div className="absolute top-3 left-3 px-2 py-0.5 rounded bg-black/60 text-[9px] font-mono font-bold text-sky-400 uppercase tracking-widest backdrop-blur-sm border border-blue-550/20">
                          {facingMode === 'environment' ? 'Lente Traseira' : 'Lente de Selfie'}
                        </div>

                        {/* Centering targeting scope graphical overlay */}
                        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                          {/* Symmetrical cropping brackets/corners for bovine rump focusing */}
                          <div className="relative w-64 h-48 border border-white/10 rounded-lg flex items-center justify-center">
                            {/* Top-left corner */}
                            <div className="absolute top-0 left-0 w-4 h-4 border-t border-l border-white/60 rounded-tl" />
                            {/* Top-right corner */}
                            <div className="absolute top-0 right-0 w-4 h-4 border-t border-r border-white/60 rounded-tr" />
                            {/* Bottom-left corner */}
                            <div className="absolute bottom-0 left-0 w-4 h-4 border-b border-l border-white/60 rounded-bl" />
                            {/* Bottom-right corner */}
                            <div className="absolute bottom-0 right-0 w-4 h-4 border-b border-r border-white/60 rounded-br" />
                          </div>
                          
                          {/* Clear Instructions */}
                          <div className="absolute bottom-3 bg-black/60 px-3 py-1 rounded text-[9px] font-sans text-white/90 tracking-wide backdrop-blur-sm border border-white/10 uppercase font-medium">
                            {language === 'es' ? 'Encuadre la grupa del bovino' : language === 'en' ? 'Frame the bovine rump' : 'Enquadre a garupa do bovino'}
                          </div>
                        </div>
                      </>
                    ) : !isStartingCamera ? (
                      /* Fallback UI when live stream/WebRTC isn't authorized or fails to start */
                      <div className="absolute inset-0 flex flex-col items-center justify-center p-6 bg-gray-50 dark:bg-gray-900 text-center space-y-3.5">
                        <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-full text-blue-600 dark:text-sky-305">
                          <Camera className="h-8 w-8 text-blue-600 dark:text-sky-300" />
                        </div>
                        <div className="space-y-1">
                          <h4 className="text-xs font-bold text-gray-800 dark:text-gray-200">Acesso via Iframe do Navegador Amortecido</h4>
                          <p className="text-[10px] text-gray-400 dark:text-gray-500 max-w-sm leading-normal">
                            As permissões de câmera Web estão temporariamente indisponíveis devido ao sandbox de visualização. Clique no botão abaixo para tirar foto usando a câmera nativa do seu celular!
                          </p>
                        </div>
                        <label className="inline-flex h-11 px-6 rounded-full bg-blue-600 hover:bg-blue-700 dark:bg-[#1e3a8a] dark:hover:bg-[#172554] text-white font-mono font-bold text-xs uppercase items-center justify-center gap-2 cursor-pointer shadow-md transition-all active:scale-95">
                          <Camera className="h-4 w-4 text-sky-200" />
                          <span>Tirar Foto com Câmera Nativa</span>
                          <input
                            type="file"
                            accept="image/*"
                            capture="environment"
                            onChange={handleNativeCameraCapture}
                            className="hidden"
                          />
                        </label>
                      </div>
                    ) : null}
                  </div>

                  {/* Actions Bar for Camera */}
                  {cameraActive && (
                    <div className="flex flex-col items-center gap-3">
                      <div className="flex items-center justify-center gap-3">
                        <button
                          type="button"
                          onClick={capturePhoto}
                          className="h-11 px-6 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-mono font-bold text-xs uppercase flex items-center gap-2 shadow-lg transition-all active:scale-95 cursor-pointer"
                        >
                          <Camera className="h-4 w-4" />
                          <span>Capturar Foto</span>
                        </button>

                        <button
                          type="button"
                          onClick={toggleFacingMode}
                          className="h-11 px-4 rounded-full bg-gray-150 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-mono font-bold text-xs uppercase flex items-center gap-2 transition-colors cursor-pointer"
                          title="Inverter Câmeras"
                        >
                          <RefreshCw className="h-4 w-4" />
                          <span>Alternar Lente</span>
                        </button>
                      </div>

                      {/* Native camera optional handle as a secondary option for phones */}
                      <div className="flex flex-col items-center pt-1.5">
                        <span className="text-[9px] font-mono font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Qualidade insatisfatória?</span>
                        <label className="text-[10.5px] font-mono text-blue-600 dark:text-sky-300 hover:underline cursor-pointer flex items-center gap-1.5">
                          <span>Acessar Câmera Nativa de Alta Resolução</span>
                          <input
                            type="file"
                            accept="image/*"
                            capture="environment"
                            onChange={handleNativeCameraCapture}
                            className="hidden"
                          />
                        </label>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Scanner loading progress animation and details */}
          {isAnalyzing && (
            <div className="py-8 flex flex-col items-center justify-center text-center gap-4">
              <div className="relative h-16 w-16 flex items-center justify-center">
                {/* Spinning loader */}
                <RefreshCw className="h-10 w-10 text-[#1e3a8a] dark:text-sky-400 animate-spin absolute" />
                <Scan className="h-16 w-16 text-blue-450 dark:text-sky-400 opacity-20 animate-pulse absolute" />
              </div>
              <div className="space-y-1.5 max-w-sm">
                <span className="font-sans font-extrabold text-[#1e3a8a] dark:text-sky-450 text-sm tracking-tight block">
                  Visão Computacional do Rebanho Ativa
                </span>
                <p className="text-xs font-mono text-gray-500 dark:text-gray-400 animate-pulse">
                  {analysisProgress}
                </p>
              </div>

              {/* Graphical loading frame */}
              <div className="w-64 max-w-xs h-2 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-850 relative mt-2">
                <div className="h-full bg-blue-600 absolute animate-shimmer w-1/3 rounded-full" style={{ left: '10%' }} />
              </div>
            </div>
          )}

          {/* Current Selection Visual Preview Cards */}
          {!isAnalyzing && currentActiveImagePreview() && (
            <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg flex items-center gap-4 border border-gray-150 dark:border-gray-800">
              <img src={currentActiveImagePreview()!} alt="Selected Preview" className="h-16 w-24 object-cover border dark:border-gray-800 rounded-md" />
              <div className="text-left space-y-0.5">
                <span className="text-[10px] uppercase font-mono tracking-wider font-bold text-gray-400 dark:text-gray-500 block">Fotografia Ativa</span>
                <h4 className="font-sans font-bold text-xs text-gray-900 dark:text-gray-100">
                  Brinco: {earTag || '—'}
                </h4>
                <div className="flex items-center gap-1 text-[10px] font-mono text-blue-600 dark:text-sky-305">
                  <ShieldCheck className="h-3 w-3" />
                  <span>Análise focada no terço posterior / região traseira do bovino</span>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* ModalFooter Action trigger */}
        <div className="p-5 border-t border-gray-150 dark:border-gray-800 bg-gray-50 dark:bg-[#111827] flex justify-end gap-3 print:hidden">
          <button
            onClick={() => { onClose(); }}
            disabled={isAnalyzing}
            className="h-11 px-4 text-xs font-mono font-bold uppercase rounded border border-gray-200 dark:border-gray-800 text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-850 hover:text-gray-900 dark:hover:text-gray-200 transition-colors disabled:opacity-55"
          >
            {language === 'es' ? 'Cancelar' : language === 'en' ? 'Cancel' : 'Cancelar'}
          </button>
          
          <button
            id="modal-btn-trigger-analysis"
            onClick={triggerAnalysis}
            disabled={isAnalyzing || !earTag.trim() || (imageInputState === 'preset' && !selectedPresetUrl) || (imageInputState !== 'preset' && !uploadedBase64)}
            className="h-11 px-6 bg-[#1e3a8a] hover:bg-blue-900 dark:bg-blue-800 dark:hover:bg-blue-950 disabled:bg-gray-200 dark:disabled:bg-gray-800 disabled:text-gray-400 dark:disabled:text-gray-600 text-sky-200 hover:text-white font-mono font-bold text-xs uppercase tracking-wider rounded transition-all flex items-center justify-center shadow-md font-bold"
          >
            <span>{language === 'es' ? 'Procesar' : language === 'en' ? 'Process' : 'Processar'}</span>
          </button>
        </div>

      </div>

      <CameraTourGuideModal isOpen={showTour} onClose={() => setShowTour(false)} language={(language as any) || 'pt'} />
    </div>
  );
}