/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle,
  Copy,
  Download,
  ExternalLink,
  Eye,
  Mail,
  FileCheck,
  FileText,
  Info,
  Loader2,
  MessageSquare,
  Pencil,
  Printer,
  RotateCcw,
  Scale,
  Send,
  Share2,
  X,
} from 'lucide-react';
import { CattleRecord, UserProfile } from '../types';

interface AssessmentViewProps {
  record?: CattleRecord;
  onSaveToHistory: (record: CattleRecord) => void;
  onClose: () => void;
  isSavedInDb: boolean;
  userProfile?: UserProfile;
}

export default function AssessmentView({
  record,
  onSaveToHistory,
  onClose,
  isSavedInDb,
  userProfile,
}: AssessmentViewProps) {
  const [layersMode, setLayersMode] = useState<0 | 1 | 2>(2);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [showToastMessage, setShowToastMessage] = useState<string | null>(null);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [localWeight, setLocalWeight] = useState<number | null>(null);
  const [generatedPdfUrl, setGeneratedPdfUrl] = useState<string | null>(null);
  const [localIsRealWeight, setLocalIsRealWeight] = useState<boolean | null>(null);
  const [isEditingWeight, setIsEditingWeight] = useState(false);
  const [weightInputVal, setWeightInputVal] = useState('');

  useEffect(() => {
    setLocalWeight(null);
    setLocalIsRealWeight(null);
    setIsEditingWeight(false);
    setWeightInputVal('');
    setShowShareModal(false);
    setShowEmailModal(false);
    setShowPrintModal(false);
    setGeneratedPdfUrl(null);
  }, [record?.id]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowPrintModal(false);
        setShowShareModal(false);
        setShowEmailModal(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (!record) {
    return (
      <div className="flex min-h-[300px] flex-col items-center justify-center rounded-lg border border-gray-200 bg-white p-12 text-center font-sans">
        <AlertTriangle className="mb-4 h-12 w-12 text-amber-500" />
        <h3 className="mb-2 text-lg font-bold text-gray-900">Nenhum Bovino Selecionado</h3>
        <p className="mb-6 max-w-md text-sm text-gray-500">
          Selecione um registro para revisar o peso estimado e o veredito do animal.
        </p>
        <button
          onClick={onClose}
          className="h-10 rounded-md bg-[#1e3a8a] px-5 text-sm font-semibold text-white transition-colors hover:bg-blue-900"
        >
          Voltar ao Início
        </button>
      </div>
    );
  }

  const currentWeight = localWeight ?? record.weight;
  const currentIsRealWeight = localIsRealWeight ?? !!record.isRealWeight;
  const displayAnimalId = record.animalId || record.id;

  const verdictStyle = {
    'APTO PARA ABATE': {
      bg: 'border-blue-500 bg-blue-50 text-blue-800 dark:border-blue-800 dark:bg-blue-950/25 dark:text-blue-100',
      verdictText: 'APTO PARA ABATE',
      desc: 'Animal atinge o peso ideal (≥ 420 kg) e escore de acabamento (ECC ≥ 3.2) para abate.',
      circleTheme: 'bg-blue-50 text-blue-500 dark:bg-blue-950/40 dark:text-sky-300',
      textTitleColor: 'text-[#1e3a8a] dark:text-sky-300',
      textDescColor: 'text-gray-600 dark:text-sky-200',
      systemLabelColor: 'text-[#1e3a8a] dark:text-sky-450',
    },
    'NÃO APTO': {
      bg: 'border-red-500 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-950/20 dark:text-red-100',
      verdictText: 'NÃO APTO',
      desc: 'Animal com peso abaixo do limite mínimo (420 kg) ou gordura insuficiente (ECC < 3.2).',
      circleTheme: 'bg-red-50 text-red-500 dark:bg-red-950/40 dark:text-red-400',
      textTitleColor: 'text-red-950 dark:text-red-300',
      textDescColor: 'text-gray-600 dark:text-red-200',
      systemLabelColor: 'text-red-800 dark:text-red-400',
    },
  }[record.verdict as 'APTO PARA ABATE' | 'NÃO APTO'] || {
    bg: 'border-red-500 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-950/20 dark:text-red-100',
    verdictText: 'NÃO APTO',
    desc: 'Registro fora da faixa esperada.',
    circleTheme: 'bg-red-50 text-red-500 dark:bg-red-950/40 dark:text-red-400',
    textTitleColor: 'text-red-950 dark:text-red-300',
    textDescColor: 'text-gray-600 dark:text-red-200',
    systemLabelColor: 'text-red-800 dark:text-red-400',
  };

  const getWireframeLines = () => {
    if (!record.landmarkPoints || record.landmarkPoints.length < 2) return null;
    const sortedPoints = [...record.landmarkPoints].sort((a, b) => a.x - b.x);
    const elements: Array<React.JSX.Element> = [];

    elements.push(
      <polyline
        key="spine"
        points={sortedPoints.map((p) => `${p.x},${p.y}`).join(' ')}
        fill="none"
        stroke="#4cf5a6"
        strokeWidth="1.2"
        strokeDasharray="1.5,1.5"
        className="animate-pulse"
      />,
    );

    const upperPoints = record.landmarkPoints.filter((p) => p.y <= 45);
    const lowerPoints = record.landmarkPoints.filter((p) => p.y > 45);

    upperPoints.forEach((up, uIdx) => {
      lowerPoints.forEach((low, lIdx) => {
        if (Math.abs(up.x - low.x) < 25) {
          elements.push(
            <line
              key={`rib-${uIdx}-${lIdx}`}
              x1={up.x}
              y1={up.y}
              x2={low.x}
              y2={low.y}
              stroke="#aeeecb"
              strokeWidth="0.8"
              strokeDasharray="2,2"
              opacity="0.8"
            />,
          );
        }
      });
    });

    return (
      <svg className="pointer-events-none absolute inset-0 z-10 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
        {elements}
      </svg>
    );
  };

  const getFormattedShareText = () => {
    return `🐄 Rayvora Vision Pro - Laudo de Avaliação Bovino
----------------------------------------
🏷️ Brinco: #${displayAnimalId}
⚖️ Peso: ${currentWeight.toFixed(1)} kg (${currentIsRealWeight ? 'Confirmado na Balança' : 'Estimado'})
📊 Escore Corporral (ECC): ${record.score ? record.score.toFixed(1) : '3.5'} / 5.0
🐂 Raça: ${record.breed || 'Nelore'}
📅 Data: ${record.date}
📋 Veredito: ${record.verdict}

💡 Critério de Abate:
${record.verdict === 'APTO PARA ABATE' 
  ? '✓ APTO: Peso ≥ 420 kg e ECC ≥ 3.2 com acabamento de carcaça pronto para o frigorífico.' 
  : '✕ NÃO APTO: Peso < 420 kg ou ECC < 3.2. Recomenda-se estender a engorda.'}
----------------------------------------
Emitido por Rayvora Vision Pro - Visão Computacional Veterinária`;
  };

  const triggerToast = (msg: string) => {
    setShowToastMessage(msg);
    setTimeout(() => setShowToastMessage(null), 2500);
  };

  const handleCopyText = async () => {
    const text = getFormattedShareText();
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      triggerToast('✓ Texto do laudo copiado com sucesso!');
    } catch (e) {
      console.warn('Copy failed:', e);
      triggerToast('Erro ao copiar texto.');
    }
  };

  const handleWhatsAppShare = () => {
    const text = getFormattedShareText();
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleNativeShare = async () => {
    const text = getFormattedShareText();
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Rayvora Vision Pro: Brinco #${displayAnimalId}`,
          text,
        });
      } catch (err) {
        console.warn('Native share error or dismissed:', err);
      }
    } else {
      handleCopyText();
    }
  };

  const openPrintWindow = () => {
    const printWin = window.open('', '_blank', 'width=850,height=950');
    if (!printWin) {
      triggerToast('Aviso: Ative os pop-ups no seu navegador para abrir o laudo de impressão.');
      return;
    }

    const isApto = record.verdict === 'APTO PARA ABATE';

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="pt-BR">
        <head>
          <meta charset="utf-8"/>
          <title>Rayvora Vision Pro - Laudo #${displayAnimalId}</title>
          <style>
            * { box-sizing: border-box; }
            body { font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 30px; color: #0f172a; line-height: 1.5; background: #fff; margin: 0; }
            .header { text-align: center; border-bottom: 3px solid #1e3a8a; padding-bottom: 16px; margin-bottom: 24px; }
            .header h1 { margin: 0; font-size: 24px; color: #1e3a8a; text-transform: uppercase; tracking: 0.5px; }
            .header p { margin: 4px 0 0; font-size: 11px; font-family: monospace; color: #475569; font-weight: bold; }
            .meta { display: flex; justify-content: space-between; margin-top: 14px; font-size: 12px; background: #f1f5f9; padding: 10px 16px; border-radius: 8px; font-family: monospace; border: 1px solid #e2e8f0; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 24px; }
            .photo-box { width: 100%; border-radius: 10px; border: 1px solid #cbd5e1; overflow: hidden; background: #000; display: flex; align-items: center; justify-content: center; }
            .photo { width: 100%; height: auto; max-height: 280px; object-fit: cover; display: block; }
            .badge { padding: 16px; border-radius: 10px; text-align: center; font-weight: 800; margin-bottom: 16px; border: 2px solid; }
            .badge.apto { background: #f0fdf4; color: #15803d; border-color: #22c55e; }
            .badge.nao-apto { background: #fef2f2; color: #b91c1c; border-color: #ef4444; }
            .badge-title { font-size: 18px; letter-spacing: -0.5px; }
            .badge-sub { font-size: 11px; font-weight: 500; margin-top: 4px; opacity: 0.9; }
            .table { width: 100%; border-collapse: collapse; font-size: 13px; }
            .table th, .table td { border: 1px solid #cbd5e1; padding: 10px 12px; text-align: left; }
            .table th { background: #f8fafc; font-weight: 700; color: #334155; width: 45%; }
            .table td { color: #0f172a; font-weight: 600; }
            .signature-area { margin-top: 60px; display: flex; justify-content: space-between; align-items: flex-end; }
            .signature { text-align: center; border-top: 1px solid #0f172a; width: 240px; padding-top: 6px; font-size: 12px; font-weight: bold; }
            .footer { margin-top: 40px; border-top: 1px solid #e2e8f0; padding-top: 16px; display: flex; justify-content: space-between; font-size: 10px; font-family: monospace; color: #64748b; }
            .no-print-bar { background: #1e293b; color: #fff; padding: 12px 20px; display: flex; justify-content: space-between; align-items: center; margin: -30px -30px 24px -30px; }
            @media print { .no-print-bar { display: none !important; } }
          </style>
        </head>
        <body>
          <div class="no-print-bar">
            <span style="font-size: 13px; font-weight: 600;">Rayvora Vision Pro - Visualização do Laudo</span>
            <button onclick="window.print()" style="background: #2563eb; color: white; border: none; padding: 8px 18px; font-weight: bold; border-radius: 6px; cursor: pointer; font-size: 12px;">🖨️ Imprimir Laudo Agora</button>
          </div>

          <div class="header">
            <h1>Rayvora Vision Pro</h1>
            <p>LAUDO TÉCNICO VETERINÁRIO DE AVALIAÇÃO E BIOMETRIA BOVINA</p>
            <div class="meta">
              <span>IDENTIFICADOR: <strong>BRINCO #${displayAnimalId}</strong></span>
              <span>DATA: <strong>${record.date}</strong></span>
              <span>AVALIADOR: <strong>${userProfile?.name || 'Dr. Pedro Almeida'}</strong></span>
            </div>
          </div>

          <div class="grid">
            <div class="photo-box">
              <img src="${record.photoUrl}" class="photo" alt="Foto da Carcaça" />
            </div>

            <div>
              <div class="badge ${isApto ? 'apto' : 'nao-apto'}">
                <div class="badge-title">${record.verdict}</div>
                <div class="badge-sub">${record.notes || (isApto ? 'Peso e acabamento ideais para envio ao frigorífico.' : 'Peso corporal abaixo do critério mínimo de 420 kg ou ECC < 3.2.')}</div>
              </div>

              <table class="table">
                <tr><th>Brinco / Registro</th><td>#${displayAnimalId}</td></tr>
                <tr><th>Massa Corporal</th><td>${currentWeight.toFixed(1)} kg (${currentIsRealWeight ? 'Aferido em Balança' : 'Estimativa'})</td></tr>
                <tr><th>Escore Corporal (ECC)</th><td>${record.score ? record.score.toFixed(1) : '3.5'} / 5.0</td></tr>
                <tr><th>Raça / Linhagem</th><td>${record.breed || 'Nelore'}</td></tr>
                <tr><th>Garantia de Qualidade</th><td>Certificado por Visão Computacional Edge</td></tr>
              </table>
            </div>
          </div>

          <div class="signature-area">
            <div style="font-size: 11px; color: #475569; font-family: monospace;">
              Documento assinado digitalmente<br/>
              Sistema Rayvora Vision Pro AI
            </div>
            <div class="signature">
              ${userProfile?.name || 'Dr. Pedro Almeida'}<br/>
              <span style="font-size: 10px; font-weight: normal; color: #64748b;">Médico Veterinário Responsável</span>
            </div>
          </div>

          <div class="footer">
            <span>© ${new Date().getFullYear()} Rayvora Vision Pro Technologies</span>
            <span>Relatório Oficial de Abate e Biometria</span>
          </div>

          <script>
            window.onload = function() {
              setTimeout(function() { window.print(); }, 250);
            };
          </script>
        </body>
      </html>
    `;

    printWin.document.open();
    printWin.document.write(htmlContent);
    printWin.document.close();
  };

  useEffect(() => {
    // Limpa a URL do PDF quando o modal de impressão é fechado
    if (!showPrintModal) setGeneratedPdfUrl(null);
  }, [showPrintModal]);

  const generatePdfDownload = async () => {
    setIsGeneratingPdf(true);
    setShowPrintModal(true);
    triggerToast('Gerando arquivo PDF do Laudo Oficial...');

    setTimeout(async () => {
      try {
        const element = document.getElementById('printable-laudo-paper');
        if (!element) {
          throw new Error('Elemento do laudo não encontrado');
        }

        // @ts-ignore
        const html2pdfModule = (await import('html2pdf.js')).default || (await import('html2pdf.js'));

        const opt = {
          margin: [8, 8, 8, 8],
          filename: `Laudo_Rayvora_Brinco_${displayAnimalId}.pdf`,
          image: { type: 'jpeg', quality: 0.85 }, // Otimização: Reduz a qualidade da imagem para diminuir o tamanho do arquivo.
          html2canvas: { scale: 1.5, useCORS: true, logging: false }, // Otimização: Reduz a escala de renderização, impactando significativamente o tamanho do PDF.
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };

        // Gera o PDF como um Blob para maior compatibilidade móvel
        const pdfBlob = await (html2pdfModule as any)().set(opt).from(element).output('blob');
        const url = URL.createObjectURL(pdfBlob);
        setGeneratedPdfUrl(url);

        // Tenta abrir o PDF em uma nova aba para iniciar o download automaticamente (ótimo para mobile)
        window.open(url, '_blank');

        triggerToast('✓ PDF gerado! Clique no link para baixar.');

      } catch (err) {
        console.error('Erro ao gerar PDF:', err);
        triggerToast('Abrindo janela de impressão limpa...');
        openPrintWindow();
      } finally {
        setIsGeneratingPdf(false);
      }
    }, 250);
  };

  const handlePrint = () => {
    setShowPrintModal(true);
    triggerToast('Visualizador de Laudo Oficial aberto.');
  };

  return (
    <div id={`assessment-view-${record.id}`} className="space-y-6 animate-fade-in print:bg-white print:p-0 print:space-y-4">
      {/* Toast Notification */}
      {showToastMessage && (
        <div className="fixed bottom-6 right-6 z-[200] flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-950/90 px-4 py-3 text-xs font-bold text-white shadow-2xl backdrop-blur-md animate-bounce">
          <CheckCircle className="h-4 w-4 text-emerald-400" />
          <span>{showToastMessage}</span>
        </div>
      )}

      {/* Email Share Modal */}
      {showEmailModal && (
        <div
          className="fixed inset-0 z-[160] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fade-in print:hidden"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowEmailModal(false);
          }}
        >
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const recipient = (e.target as HTMLFormElement).recipient.value;
              if (!recipient) {
                triggerToast('Por favor, insira um e-mail de destino.');
                return;
              }

              triggerToast('Enviando laudo por e-mail...');

              try {
                const res = await fetch('/api/share-by-email', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    recipient,
                    subject: `Rayvora Vision Pro - Laudo de Avaliação: Brinco #${displayAnimalId}`,
                    body: getFormattedShareText(),
                    smtpConfig: userProfile?.smtpConfig,
                  }),
                });

                const result = await res.json();
                if (!res.ok) throw new Error(result.message);

                triggerToast('✓ E-mail enviado com sucesso!');
                setShowEmailModal(false);
              } catch (err: any) {
                console.error('Email send error:', err);
                triggerToast(`Falha ao enviar: ${err.message}`);
              }
            }}
            className="w-full max-w-sm rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl dark:border-gray-800 dark:bg-[#0e1320]"
          >
            <div className="mb-4 flex items-center justify-between border-b border-gray-100 pb-3 dark:border-gray-800">
              <div className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-blue-600 dark:text-sky-400" />
                <h3 className="text-base font-bold text-gray-900 dark:text-white">Enviar Laudo por E-mail</h3>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label htmlFor="recipient-email" className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  E-mail do Destinatário
                </label>
                <input
                  type="email"
                  id="recipient-email"
                  name="recipient"
                  required
                  placeholder="ex: comprador@email.com"
                  className="w-full h-10 px-3 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowEmailModal(false)} className="px-4 py-2 text-xs font-bold text-gray-600 bg-gray-100 border border-gray-200 rounded-md hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700 dark:hover:bg-gray-700">Cancelar</button>
                <button type="submit" className="px-4 py-2 text-xs font-bold text-white bg-blue-600 rounded-md hover:bg-blue-700 flex items-center gap-1.5">
                  <Send className="h-4 w-4" />
                  <span>Enviar Agora</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Share Modal */}
      {showShareModal && (
        <div
          className="fixed inset-0 z-[150] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fade-in print:hidden"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowShareModal(false);
          }}
        >
          <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl dark:border-gray-800 dark:bg-[#0e1320] mx-auto">
            <div className="mb-4 flex items-center justify-between border-b border-gray-100 pb-3 dark:border-gray-800">
              <div className="flex items-center gap-2">
                <Share2 className="h-5 w-5 text-blue-600 dark:text-sky-400" />
                <h3 className="text-base font-bold text-gray-900 dark:text-white">Compartilhar Laudo do Animal</h3>
              </div>
              {/* O botão de fechar foi movido para o rodapé para simplificar a UI */}
            </div>

            <p className="mb-4 text-xs text-gray-600 dark:text-gray-400">
              Escolha como deseja enviar ou exportar as métricas do animal <strong>Brinco #{displayAnimalId}</strong>:
            </p>

            <div className="space-y-3">
              <button
                onClick={handleWhatsAppShare}
                className="flex w-full items-center justify-between rounded-xl border border-emerald-500/30 bg-emerald-50 p-3.5 text-left text-xs font-bold text-emerald-900 shadow-xs transition-all hover:bg-emerald-100 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-200 dark:hover:bg-emerald-900/50"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-sm">
                    <MessageSquare className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="block text-sm">Enviar via WhatsApp</span>
                    <span className="text-[10px] font-normal opacity-80">Abre mensagem formatada no WhatsApp</span>
                  </div>
                </div>
                <ExternalLink className="h-4 w-4 opacity-60" />
              </button>

            </div>

            <div className="mt-5 border-t border-gray-100 pt-3 text-right dark:border-gray-800">
              <button
                onClick={() => setShowShareModal(false)}
                className="flex items-center gap-1.5 ml-auto rounded-lg bg-gray-100 border border-gray-200 px-4 py-2 text-xs font-bold text-gray-700 hover:bg-gray-200 transition-all cursor-pointer dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                <span>Fechar</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Printable Laudo Modal */}
      {showPrintModal && (
        <div
          className="fixed inset-0 z-[250] flex items-center justify-center bg-slate-950/85 p-3 sm:p-6 backdrop-blur-md overflow-y-auto animate-fade-in print:p-0 print:bg-white print:static print:inset-auto"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowPrintModal(false);
          }}
        >
          <div className="relative w-full max-w-4xl rounded-2xl border border-slate-700 bg-slate-900 p-4 sm:p-8 shadow-2xl text-slate-100 print:border-none print:shadow-none print:bg-white print:text-black print:p-0">
            {/* Top Toolbar (Hidden on print) */}
            <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-4 print:hidden">
              <div>
                <div className="flex items-center gap-2">
                  <Printer className="h-5 w-5 text-blue-400" />
                  <h3 className="text-lg font-bold text-white">Laudo Técnico Veterinário de Impressão</h3>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Visualização oficial formatada para A4 / PDF • Brinco #{displayAnimalId}
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-start sm:justify-end gap-2 w-full sm:w-auto">
                {generatedPdfUrl ? (
                  <a
                    href={generatedPdfUrl}
                    download={`Laudo_Rayvora_Brinco_${displayAnimalId}.pdf`}
                    className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-500 shadow-md cursor-pointer transition-all"
                  >
                    <Download className="h-4 w-4 text-emerald-200" />
                    <span>BAIXAR PDF AGORA</span>
                  </a>
                ) : (
                  <button
                    onClick={generatePdfDownload}
                    disabled={isGeneratingPdf}
                    className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-500 shadow-md cursor-pointer transition-all disabled:opacity-50"
                  >
                    {isGeneratingPdf ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4 text-sky-200" />}
                    <span>{isGeneratingPdf ? 'Gerando PDF...' : 'Gerar PDF para Baixar'}</span>
                  </button>
                )}

                <button
                  onClick={openPrintWindow}
                  className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-blue-500 shadow-md cursor-pointer transition-all"
                  title="Abre a página de impressão em janela independente para evitar bloqueios do navegador"
                >
                  <Printer className="h-4 w-4" />
                  <span>Imprimir em Nova Aba</span>
                </button>

                <button
                  onClick={handleCopyText}
                  className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-bold text-slate-300 hover:bg-slate-700 hover:text-white cursor-pointer transition-all"
                >
                  <Copy className="h-4 w-4" />
                  <span>Copiar Texto</span>
                </button>
              </div>
            </div>

            {/* Formatted Laudo Document Content */}
            <div id="printable-laudo-paper" className="rounded-xl border border-slate-200 bg-white p-6 sm:p-10 text-slate-900 shadow-xl print:border-none print:p-0 print:shadow-none">
              {/* Document Header */}
              <div className="border-b-2 border-slate-900 pb-5 text-center">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-[10px] font-bold text-slate-500 uppercase tracking-widest">Rayvora Vision Pro • Pecuária de Precisão</span>
                  <span className="font-mono text-[10px] font-extrabold text-blue-800 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">DOCUMENTO OFICIAL AUTENTICADO</span>
                </div>
                <h1 className="font-serif text-3xl font-bold text-blue-900 tracking-wider">LAUDO DE AVALIAÇÃO TÉCNICA</h1>
                <p className="font-sans text-sm font-medium text-slate-500 mt-1">Rayvora Vision Pro • Análise de Escore de Condição Corporal (ECC)</p>
                <div className="mt-3 flex flex-wrap justify-between gap-2 rounded-lg bg-slate-100 p-2.5 font-mono text-xs text-slate-800 border border-slate-200">
                  <span>IDENTIFICADOR: <strong className="text-slate-950">BRINCO #${displayAnimalId}</strong></span>
                  <span>DATA: <strong className="text-slate-950">{record.date}</strong></span>
                  <span>AVALIADOR: <strong className="text-slate-950">{userProfile?.name || 'Dr. Pedro Almeida'}</strong></span>
                </div>
              </div>

              {/* Photo & Main Verdict Grid */}
              <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-6 items-center">
                <div className="overflow-hidden rounded-xl border border-slate-300 bg-black shadow-sm">
                  <img src={record.photoUrl} alt="Foto da Carcaça" className="w-full h-56 sm:h-64 object-cover" crossOrigin="anonymous" />
                </div>

                <div className="space-y-4">
                  <div className={`rounded-xl border-2 p-5 text-center ${record.verdict === 'APTO PARA ABATE' ? 'border-emerald-500 bg-emerald-50 text-emerald-900' : 'border-rose-500 bg-rose-50 text-rose-900'}`}>
                    <span className="text-[10px] font-mono font-bold uppercase tracking-widest block opacity-75">Status do Animal</span>
                    <span className="text-2xl font-black tracking-tight block mt-1">{record.verdict}</span>
                    <p className="text-xs font-medium mt-1.5 opacity-90 leading-tight">
                      {record.notes || (record.verdict === 'APTO PARA ABATE' ? 'Massa corporal e acabamento ideais para abate imediato em frigorífico.' : 'Massa corporal abaixo do padrão mínimo recomendado de 420 kg ou ECC < 3.2.')}
                    </p>
                  </div>

                  <table className="w-full text-xs border-collapse">
                    <tbody>
                      <tr className="border-b border-slate-200">
                        <td className="py-2 font-bold text-slate-600 bg-slate-50 px-3 border-r border-slate-200 w-1/2">Brinco de Campo</td>
                        <td className="py-2 font-mono font-extrabold text-slate-900 px-3">#{displayAnimalId}</td>
                      </tr>
                      <tr className="border-b border-slate-200">
                        <td className="py-2 font-bold text-slate-600 bg-slate-50 px-3 border-r border-slate-200">Massa Corporal Aferida</td>
                        <td className="py-2 font-mono font-extrabold text-slate-900 px-3">{currentWeight.toFixed(1)} kg ({currentIsRealWeight ? 'Balança' : 'Estimada'})</td>
                      </tr>
                      <tr className="border-b border-slate-200">
                        <td className="py-2 font-bold text-slate-600 bg-slate-50 px-3 border-r border-slate-200">Escore Corporal (ECC)</td>
                        <td className="py-2 font-mono font-extrabold text-slate-900 px-3">{record.score ? record.score.toFixed(1) : '3.5'} / 5.0</td>
                      </tr>
                      <tr>
                        <td className="py-2 font-bold text-slate-600 bg-slate-50 px-3 border-r border-slate-200">Raça / Genética</td>
                        <td className="py-2 font-mono font-extrabold text-slate-900 px-3">{record.breed || 'Nelore'}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Signatures & Footer */}
              <div className="mt-10 pt-6 border-t border-slate-300 flex flex-col sm:flex-row items-center justify-between gap-6">
                <div className="text-left font-mono text-[10px] text-slate-500 space-y-1">
                  <p>✓ Validação Biométrica Edge Computer Vision</p>
                  <p>✓ Hash de Autenticidade: RV-{record.id.slice(0, 8).toUpperCase()}</p>
                </div>

                <div className="text-center border-t border-slate-900 pt-1.5 w-60">
                  <span className="font-bold text-xs text-slate-900 block">{userProfile?.name || 'Dr. Pedro Almeida'}</span>
                  <span className="text-[10px] font-mono text-slate-600 block">Médico Veterinário Responsável</span>
                </div>
              </div>

              <div className="mt-8 pt-4 border-t border-slate-200 text-center font-mono text-[9px] text-slate-400">
                © {new Date().getFullYear()} Rayvora Vision Pro AI Technologies • Pecuária de Precisão. Laudo emitido via algoritmo de visão computacional.
              </div>
            </div>

            {/* Bottom Modal Actions */}
            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-slate-800 pt-4 print:hidden">
              <span className="text-xs text-slate-400 font-mono">
                Pressione <kbd className="px-1.5 py-0.5 bg-slate-800 text-slate-300 rounded border border-slate-700">ESC</kbd> para fechar
              </span>
              <div className="flex flex-wrap items-center gap-2">
                {generatedPdfUrl ? (
                  <a
                    href={generatedPdfUrl}
                    download={`Laudo_Rayvora_Brinco_${displayAnimalId}.pdf`}
                    className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-500 shadow-md cursor-pointer transition-all"
                  >
                    <Download className="h-4 w-4 text-emerald-200" />
                    <span>BAIXAR PDF AGORA</span>
                  </a>
                ) : (
                  <button
                    onClick={generatePdfDownload}
                    disabled={isGeneratingPdf}
                    className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-500 shadow-md cursor-pointer transition-all disabled:opacity-50"
                  >
                    {isGeneratingPdf ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4 text-sky-200" />}
                    <span>{isGeneratingPdf ? 'Gerando PDF...' : 'Gerar Arquivo PDF'}</span>
                  </button>
                )}
                <button
                  onClick={() => setShowPrintModal(false)}
                  className="flex items-center gap-1.5 rounded-lg bg-rose-600/20 border border-rose-500/40 px-4 py-2 text-xs font-bold text-rose-300 hover:bg-rose-600 hover:text-white cursor-pointer transition-all"
                >
                  <span>Sair</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header exclusivo para Impressão */}
      <div className="hidden border-b-2 border-gray-800 pb-4 text-center print:block">
        <h1 className="font-serif text-2xl font-black text-gray-900">Rayvora Vision Pro - Laudo Técnico Veterinário</h1>
        <p className="text-xs font-mono uppercase tracking-wider text-gray-600">REGISTRO E FICHA DE AVALIAÇÃO ANATOMOFISIOLÓGICA</p>
        <div className="mt-2 flex justify-center gap-6 text-[11px] font-mono text-gray-700">
          <span>Identificador: <strong>Brinco #{displayAnimalId}</strong></span>
          <span>Data: <strong>{record.date}</strong></span>
          <span>Avaliador: <strong>{userProfile?.name || 'Dr. Pedro Almeida'}</strong></span>
        </div>
      </div>

      <div className="flex items-center justify-between gap-4 print:hidden">
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="flex items-center gap-1 rounded-md border border-gray-200 bg-white px-3 py-1.5 text-xs font-mono font-bold text-gray-500 transition-all hover:bg-gray-100 hover:text-gray-900 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400 dark:hover:text-[#aeeecb]"
          >
            ← Voltar para a lista
          </button>
          <div className="flex items-center gap-1.5 font-mono text-xs text-gray-400">
            <span>Identificador Único:</span>
            <span className="font-bold text-[#1e3a8a] dark:text-sky-400">Brinco #{displayAnimalId}</span>
          </div>
        </div>
        <span className="inline-flex rounded px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-mono font-bold uppercase tracking-wider">
          ✓ PROCESSADO
        </span>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-start">
        <div className="space-y-4 rounded-lg border border-gray-200 bg-white p-3.5 shadow-[0_2px_4px_rgba(0,0,0,0.03)] dark:border-gray-800 dark:bg-[#0e1320] lg:col-span-7 print:col-span-12 sm:p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold tracking-tight text-gray-950 dark:text-white">Resultado da Análise</h2>
            <div className="text-xs font-mono text-gray-400 dark:text-gray-500">
              Brinco: <span className="font-bold text-gray-900 dark:text-gray-100">{displayAnimalId}</span>
            </div>
          </div>

          <div className="group relative aspect-[4/3] w-full overflow-hidden rounded-lg border border-gray-200 bg-black shadow-inner">
            <div className="relative h-full w-full origin-center transition-transform duration-300" style={{ transform: `scale(${zoomLevel})` }}>
              <img
                src={record.photoUrl}
                alt="Análise Multimodal"
                className="h-full w-full object-cover object-[center_35%]"
                referrerPolicy="no-referrer"
              />
              <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(14,81,56,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(14,81,56,0.03)_1px,transparent_1px)] bg-[size:16px_16px]" />
              {layersMode === 2 && getWireframeLines()}
              {(layersMode === 1 || layersMode === 2) &&
                record.landmarkPoints?.map((p, idx) => {
                  const theme = p.type === 'skeleton'
                    ? 'bg-amber-500 ring-amber-300'
                    : p.type === 'fat'
                      ? 'bg-emerald-500 ring-emerald-300'
                      : 'bg-blue-500 ring-blue-300';
                  return (
                    <div key={idx} className="absolute group/point" style={{ left: `${p.x}%`, top: `${p.y}%`, transform: 'translate(-50%, -50%)' }}>
                      <div className={`relative z-10 h-3.5 w-3.5 animate-pulse rounded-full ${theme} ring-4 ring-offset-0 ring-opacity-40 cursor-help`} />
                      <div className="absolute bottom-5 left-1/2 z-20 -translate-x-1/2 rounded border border-gray-750 bg-black/90 px-2 py-0.5 text-[10px] font-mono whitespace-nowrap text-white shadow-lg opacity-100 transition-all scale-100">
                        {p.label}
                      </div>
                    </div>
                  );
                })}
              <div className="pointer-events-none absolute left-0 right-0 top-0 h-1 animate-bounce bg-gradient-to-r from-transparent via-blue-400/40 to-transparent shadow-[0_0_10px_#3b82f6]" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 print:hidden">
            <button
              id="assessment-btn-toggle-layers"
              onClick={() => setLayersMode((prev) => (prev === 2 ? 1 : prev === 1 ? 0 : 2))}
              className={`flex h-10 items-center justify-center gap-1.5 rounded border text-xs font-mono font-bold transition-all ${
                layersMode === 2
                  ? 'border-blue-900 bg-[#1e3a8a] text-white dark:border-blue-950 dark:bg-blue-800'
                  : layersMode === 1
                    ? 'border-blue-200 bg-blue-50 text-[#1e3a8a] dark:border-blue-900/40 dark:bg-blue-950/40 dark:text-sky-300'
                    : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800'
              }`}
            >
              <Eye className="h-3.5 w-3.5" />
              <span>{layersMode === 2 ? 'Modo: Esqueleto' : layersMode === 1 ? 'Modo: Marcadores' : 'Fotos Limpas'}</span>
            </button>

            <button
              id="assessment-btn-zoom-anatomico"
              onClick={() => setZoomLevel((z) => (z === 1.3 ? 1.6 : z === 1.6 ? 1 : 1.3))}
              className="flex h-10 items-center justify-center gap-1.5 rounded border border-gray-200 bg-white text-xs font-mono font-bold text-gray-600 transition-colors hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Zoom: {zoomLevel === 1 ? '1x' : zoomLevel === 1.3 ? '1.3x' : '1.6x'}</span>
            </button>
          </div>
        </div>

        <div className="space-y-6 lg:col-span-5 print:col-span-12">
          {/* Card Veredito do Sistema */}
          <div className={`flex flex-col overflow-hidden rounded-xl border-2 p-5 text-center shadow-lg ${verdictStyle.bg}`}>
            <span className={`mb-3 block text-[10px] font-mono font-bold uppercase tracking-widest ${verdictStyle.systemLabelColor}`}>
              Veredito do Sistema
            </span>
            <div className={`mb-2 flex h-14 w-14 items-center justify-center self-center rounded-full border-4 border-white shadow-md dark:border-slate-800 ${verdictStyle.circleTheme}`}>
              <CheckCircle className="h-8 w-8 shrink-0" />
            </div>
            <h3 className={`text-2xl font-black leading-none tracking-tight ${verdictStyle.textTitleColor}`}>
              {verdictStyle.verdictText}
            </h3>
            <p className={`mt-1 max-w-sm text-xs font-medium ${verdictStyle.textDescColor}`}>
              {record.notes || verdictStyle.desc}
            </p>

            {/* Explicação Resumida dos Critérios de Abate */}
            <div className="mt-4 w-full rounded-xl border border-gray-200/80 bg-white/80 p-3 text-left shadow-sm dark:border-gray-800 dark:bg-gray-900/70">
              <div className="mb-2 flex items-center gap-1.5 font-bold text-xs text-gray-900 dark:text-white">
                <Info className="h-4 w-4 text-blue-600 dark:text-sky-400 shrink-0" />
                <span>Entenda os Critérios de Aptidão:</span>
              </div>
              <div className="space-y-1.5 text-[10px] leading-relaxed text-gray-600 dark:text-gray-300">
                <div className="rounded-md border border-blue-100 bg-blue-50/70 p-2 dark:border-blue-900/40 dark:bg-blue-950/40">
                  <span className="font-bold text-blue-900 dark:text-sky-300 block mb-0.5">✓ APTO PARA ABATE (≥ 420 kg & ECC ≥ 3.2):</span>
                  <span>Massa corporal ideal com acúmulo de gordura e acabamento de carcaça adequados para envio imediato ao frigorífico.</span>
                </div>
                <div className="rounded-md border border-rose-100 bg-rose-50/70 p-2 dark:border-rose-900/40 dark:bg-rose-950/40">
                  <span className="font-bold text-rose-900 dark:text-rose-300 block mb-0.5">✕ NÃO APTO (&lt; 420 kg ou ECC &lt; 3.2):</span>
                  <span>Peso inferior a 420 kg ou cobertura de gordura insuficiente (&lt; 3.2). Recomenda-se estender o período de engorda em pasto/confinamento.</span>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4 rounded-lg border border-gray-200 bg-white p-5 shadow-[0_2px_4px_rgba(0,0,0,0.03)] dark:border-gray-800 dark:bg-[#0e1320]">
            <h4 className="text-[10px] font-mono font-bold uppercase tracking-wider text-gray-400 dark:text-sky-400/80">
              Métricas Extraídas
            </h4>

            <div className="flex flex-col justify-between gap-4 rounded-lg bg-gray-50 p-4 border border-gray-100 dark:bg-gray-900/50 dark:border-gray-800 sm:flex-row sm:items-center">
              <div className="flex items-center gap-2.5">
                <Scale className="h-5 w-5 shrink-0 text-gray-500 dark:text-gray-400" />
                <div className="text-left">
                  <div className="flex flex-wrap items-center gap-1.5 text-sm font-semibold leading-none text-gray-900 dark:text-gray-100">
                    {currentIsRealWeight ? (
                      <>
                        <span className="font-bold text-emerald-700 dark:text-emerald-400">Peso de Balança</span>
                        <span id="label-verified-scale" className="rounded-full border border-emerald-200 bg-emerald-100 px-2 py-0.5 text-[9px] font-mono font-black uppercase text-emerald-800 dark:border-emerald-800/80 dark:bg-emerald-950/60 dark:text-emerald-300">
                          Confirmado
                        </span>
                      </>
                    ) : (
                      <span>Peso Estimado</span>
                    )}
                  </div>
                  <span className="mt-1 inline-block text-[10px] font-mono text-gray-400 dark:text-gray-500">
                    {currentIsRealWeight ? 'Massa física aferida na balança da fazenda' : 'Massa Corporal Estimada por Visão Computacional'}
                  </span>
                </div>
              </div>

              {isEditingWeight ? (
                <div className="flex w-full sm:w-auto items-center justify-center gap-2 shrink-0">
                  <input
                    type="number"
                    min="100"
                    max="1000"
                    step="0.1"
                    value={weightInputVal}
                    onChange={(e) => setWeightInputVal(e.target.value)}
                    placeholder={currentWeight.toFixed(0)}
                    className="h-8 w-24 rounded border border-emerald-500 bg-white px-2 text-xs font-mono font-bold text-gray-900 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-emerald-600 dark:bg-gray-900 dark:text-white"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const val = parseFloat(weightInputVal);
                      if (!isNaN(val) && val > 0) {
                        setLocalWeight(val);
                        setLocalIsRealWeight(true);
                        setIsEditingWeight(false);
                      } else {
                        setIsEditingWeight(false);
                      }
                    }}
                    className="h-8 rounded bg-emerald-600 px-2 text-xs font-bold text-white shadow-sm transition-colors hover:bg-emerald-700"
                    title="Confirmar peso de balança"
                  >
                    Salvar
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditingWeight(false)}
                    className="flex h-8 w-8 items-center justify-center rounded bg-gray-100 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-450"
                  >
                    X
                  </button>
                </div>
              ) : (
                <div className="flex w-full sm:w-auto items-center justify-center gap-2 shrink-0">
                  <div className="text-center sm:text-right font-mono text-2xl font-bold text-gray-900 dark:text-white">
                    {currentWeight.toFixed(1)} <span className="text-sm font-normal text-gray-400 dark:text-gray-500">kg</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setWeightInputVal(currentWeight.toFixed(1));
                      setIsEditingWeight(true);
                    }}
                    className="rounded-md p-1.5 text-gray-400 transition-colors hover:bg-gray-200 hover:text-emerald-600 dark:hover:bg-gray-800 dark:hover:text-emerald-400"
                    title="Informar peso real de balança"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
            </div>

            <div className="space-y-3 print:hidden">
              {!isSavedInDb ? (
                <button
                  id="assessment-btn-save-to-history"
                  onClick={() => {
                    onSaveToHistory({
                      ...record,
                      weight: currentWeight,
                      isRealWeight: currentIsRealWeight,
                    });
                    setLocalWeight(null);
                    setLocalIsRealWeight(null);
                    setIsEditingWeight(false);
                  }}
                  className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#1e3a8a] text-sm font-sans font-bold text-white shadow-md transition-all hover:bg-blue-900 hover:scale-[1.01] active:scale-98 dark:bg-blue-800 dark:hover:bg-blue-900"
                >
                  <FileCheck className="h-4.5 w-4.5 text-sky-300" />
                  <span>Salvar no Histórico</span>
                </button>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center justify-center gap-1.5 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-center text-xs font-medium text-emerald-700 shadow-xs dark:bg-emerald-500/5 dark:text-emerald-450">
                    <CheckCircle className="h-4 w-4 shrink-0 text-emerald-500" />
                    <span>Laudo sincronizado com o histórico</span>
                  </div>
                  {(localWeight !== null || localIsRealWeight !== null) && (
                    <button
                      onClick={() => {
                        onSaveToHistory({
                          ...record,
                          weight: currentWeight,
                          isRealWeight: currentIsRealWeight,
                        });
                        setLocalWeight(null);
                        setLocalIsRealWeight(null);
                        setIsEditingWeight(false);
                      }}
                      className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-750 text-xs font-sans font-semibold uppercase tracking-wider text-white shadow-md transition-all duration-200 hover:from-blue-700 hover:to-indigo-850 hover:shadow-lg active:scale-98 dark:from-sky-700 dark:to-blue-800"
                    >
                      <FileCheck className="h-4 w-4 text-sky-200" />
                      <span>Atualizar Registro no Histórico</span>
                    </button>
                  )}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <button
                  id="assessment-btn-download-pdf"
                  onClick={handlePrint}
                  disabled={isGeneratingPdf}
                  className="flex h-11 items-center justify-center gap-2 rounded-lg border border-blue-200/60 bg-white text-xs sm:text-sm font-sans font-bold uppercase tracking-wider text-blue-900 shadow-xs transition-all duration-200 hover:border-blue-300 hover:bg-blue-50/50 hover:scale-[1.01] active:scale-98 dark:border-blue-900/40 dark:bg-gray-950 dark:text-sky-300 dark:hover:bg-gray-900 cursor-pointer"
                >
                  {isGeneratingPdf ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4 text-blue-700 dark:text-sky-400" />}
                  <span>Laudo PDF</span>
                </button>

                <button
                  id="assessment-btn-share"
                  onClick={() => setShowShareModal(true)}
                  className="flex h-11 items-center justify-center gap-2 rounded-lg border border-blue-200/60 bg-white text-xs sm:text-sm font-sans font-bold uppercase tracking-wider text-blue-900 shadow-xs transition-all duration-200 hover:border-blue-300 hover:bg-blue-50/50 hover:scale-[1.01] active:scale-98 dark:border-blue-900/40 dark:bg-gray-950 dark:text-sky-300 dark:hover:bg-gray-900 cursor-pointer"
                >
                  <Share2 className="h-4 w-4 text-blue-700 dark:text-sky-400" />
                  <span>Compartilhar</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
