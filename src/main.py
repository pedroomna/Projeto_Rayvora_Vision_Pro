"""
Backend FastAPI — Validação de imagem + Predição de peso
Fluxo: App/Web (React + Node) -> API Python (este servidor) -> Edge Impulse
Este servidor rodaria separado do backend Node/Express do projeto.
O Node consome este serviço via HTTP.
"""

from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.responses import JSONResponse
import uvicorn
import numpy as np
import cv2
import requests
import base64
import os
from ultralytics import YOLO

app = FastAPI(title="API Validação e Predição de Peso Bovino")

# CONFIGURAÇÕES 
SEG_MODEL_PATH = os.getenv("SEG_MODEL_PATH", "modelo_bois.pt")

EDGE_IMPULSE_API_KEY = os.getenv("EI_API_KEY")
EDGE_IMPULSE_URL = os.getenv("EI_URL")

# THRESHOLDS DE VALIDAÇÃO
# Calibrar estes valores com dados melhores se necessário
THRESHOLDS = {
    # Check 1 — confiança mínima da detecção do YOLO
    "conf_min": 0.50,

    # Check 2 — brilho médio mínimo dentro da máscara (escala 0-255)
    "brightness_min": 50.0,

    # Check 3 — DISTÂNCIA DO ANIMAL
    # Proporção mínima da imagem que a máscara do boi deve ocupar.
    # Quanto mais longe o boi está da câmera, menor essa proporção fica.
    # Ex.: 0.07 = o boi precisa ocupar pelo menos 7% da área total da imagem.
    # Calibrar possivelmente este valor.
    "mask_area_ratio_min": 0.07,

    # Check 4 — ângulo de visão (rear view vs lateral)
    # Razão largura/altura do bounding box do animal.
    # Boi de costas/frente: bbox tende a ser mais "quadrado" (ratio baixo).
    # Boi de lado: bbox tende a ser bem mais largo que alto (ratio alto).
    "aspect_ratio_max": 1.60,
}

# CARREGAMENTO DO MODELO
seg_model = YOLO(SEG_MODEL_PATH)
print(f" Modelo de segmentação carregado: {SEG_MODEL_PATH}")


# EXTRAÇÃO DE FEATURES DA MÁSCARA
def extract_features(result, img_rgb: np.ndarray):
    
    h, w = img_rgb.shape[:2]

    if result.masks is None or len(result.masks) == 0:
        return None

    # Pega a detecção com maior confiança (caso haja mais de um objeto)
    best_idx = result.boxes.conf.argmax().item()

    # Bounding box 
    box   = result.boxes.xyxy[best_idx].cpu().numpy()   # [x1, y1, x2, y2]
    box_w = float(box[2] - box[0])
    box_h = float(box[3] - box[1])

    # Máscara binária 
    mask      = result.masks.data[best_idx].cpu().numpy()
    mask_rsz  = cv2.resize(mask, (w, h), interpolation=cv2.INTER_NEAREST)
    mask_bool = mask_rsz.astype(bool)
    mask_area_px = float(mask_bool.sum())

    # DISTÂNCIA: proporção da máscara em relação à imagem inteira
    # Esta é a métrica central do Check 3 (distância do animal).
    # Quanto menor essa fração, mais longe o boi provavelmente está da câmera.
    mask_area_ratio = mask_area_px / (h * w)

    # Iluminação: brilho médio calculado só dentro da área do animal.
    gray        = cv2.cvtColor(img_rgb, cv2.COLOR_RGB2GRAY)
    masked_gray = gray[mask_bool]
    brightness_mean = float(masked_gray.mean()) if masked_gray.size > 0 else 0.0

    return {
        "confidence"        : float(result.boxes.conf[best_idx].item()),
        "bbox_w"            : box_w,
        "bbox_h"            : box_h,
        "bbox_aspect_ratio" : (box_w / box_h) if box_h > 0 else 0.0,
        "mask_area_px"      : mask_area_px,
        "mask_area_ratio"   : mask_area_ratio,   # ← usado no check de distância
        "brightness_mean"   : brightness_mean,
        "img_w"             : w,
        "img_h"             : h,
    }

# VALIDAÇÃO — 4 checks sequenciais
def validate_image(result, img_rgb: np.ndarray, thresholds: dict = THRESHOLDS):
    """
      1. Boi detectado com confiança suficiente?
      2. Iluminação adequada?
      3. Boi está próximo o suficiente da câmera? (proporção da máscara)
      4. Boi está na pose correta (rear view), não de lado?

    Retorna: {aprovada, motivo, check, features}
    """
    feats = extract_features(result, img_rgb)

    def rejeitar(check, motivo, valor):
        return {
            "aprovada": False,
            "motivo"  : motivo,
            "check"   : check,
            "valor"   : valor,
            "features": feats,
        }

    # Check 1
    if feats is None or feats["confidence"] < thresholds["conf_min"]:
        conf = feats["confidence"] if feats else 0.0
        return rejeitar(
            "check1_deteccao",
            f"Nenhum boi detectado com confiança suficiente ({conf:.2f})",
            conf,
        )

    # Check 2
    if feats["brightness_mean"] < thresholds["brightness_min"]:
        return rejeitar(
            "check2_iluminacao",
            f"Iluminação insuficiente (brilho médio = {feats['brightness_mean']:.1f}/255)",
            feats["brightness_mean"],
        )

    # Check 3
    if feats["mask_area_ratio"] < thresholds["mask_area_ratio_min"]:
        pct_imagem = feats["mask_area_ratio"] * 100
        pct_minimo = thresholds["mask_area_ratio_min"] * 100
        return rejeitar(
            "check3_distancia",
            (f"Boi muito longe da câmera — ocupa apenas {pct_imagem:.1f}% da "
             f"imagem (mínimo exigido: {pct_minimo:.1f}%)"),
            feats["mask_area_ratio"],
        )

    # Check 4
    if feats["bbox_aspect_ratio"] > thresholds["aspect_ratio_max"]:
        return rejeitar(
            "check4_angulo",
            f"Boi provavelmente fotografado de lado (proporção L/A = {feats['bbox_aspect_ratio']:.2f})",
            feats["bbox_aspect_ratio"],
        )

    return {
        "aprovada": True,
        "motivo"  : "Imagem aprovada — todos os critérios atendidos",
        "check"   : "all_passed",
        "features": feats,
    }


# INTEGRAÇÃO COM EDGE IMPULSE
def chamar_edge_impulse(img_bytes: bytes):
    """
    Envia a imagem aprovada para o Edge Impulse.
    Ajustar conforme a documentação específica do projeto no Edge Impulse!!!
    """
    if not EDGE_IMPULSE_API_KEY or not EDGE_IMPULSE_URL:
        raise ValueError("Credenciais do Edge Impulse não configuradas (EI_API_KEY / EI_URL).")

    img_b64 = base64.b64encode(img_bytes).decode("utf-8")
    payload = {"features": img_b64}

    response = requests.post(
        EDGE_IMPULSE_URL,
        headers={
            "x-api-key"   : EDGE_IMPULSE_API_KEY,
            "Content-Type": "application/json",
        },
        json=payload,
        timeout=30,
    )

    if response.status_code != 200:
        raise RuntimeError(f"Edge Impulse retornou erro {response.status_code}: {response.text}")

    return response.json()


# decodifica bytes de upload em imagem RGB
def decodificar_imagem(img_bytes: bytes):
    img_array = np.frombuffer(img_bytes, np.uint8)
    img_bgr   = cv2.imdecode(img_array, cv2.IMREAD_COLOR)
    if img_bgr is None:
        raise HTTPException(status_code=400, detail="Imagem inválida ou corrompida.")
    return cv2.cvtColor(img_bgr, cv2.COLOR_BGR2RGB)


# ENDPOINTS
@app.post("/predizer-peso")
async def predizer_peso(imagem: UploadFile = File(...)):
    """
    Endpoint principal — consumido pelo backend Node/Express.

    1. Recebe a imagem
    2. Valida com os 4 checks (segmentação YOLO)
    3. Se aprovada, envia ao Edge Impulse e retorna o peso estimado
    4. Se rejeitada, retorna o motivo (para exibir na interface web)
    """
    img_bytes = await imagem.read()
    img_rgb   = decodificar_imagem(img_bytes)

    results = seg_model.predict(img_rgb, conf=0.5, verbose=False)
    result  = results[0]

    val = validate_image(result, img_rgb)

    if not val["aprovada"]:
        return JSONResponse(status_code=200, content={
            "aprovada"    : False,
            "motivo"      : val["motivo"],
            "check_falhou": val["check"],
            "peso_kg"     : None,
            "features"    : val["features"],
        })

    try:
        ei_response = chamar_edge_impulse(img_bytes)
        peso_kg = (
            ei_response.get("result", {}).get("peso_kg")
            or ei_response.get("peso_kg")
        )

        return JSONResponse(status_code=200, content={
            "aprovada"    : True,
            "motivo"      : "aprovada",
            "check_falhou": None,
            "peso_kg"     : peso_kg,
            "features"    : val["features"],
            "ei_response" : ei_response,
        })

    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Erro ao chamar Edge Impulse: {str(e)}")


@app.post("/validar")
async def validar_apenas(imagem: UploadFile = File(...)):
    """
    Endpoint auxiliar — roda só a validação (sem chamar o Edge Impulse).
    Útil para testar e calibrar o modelo de segmentação isoladamente.
    """
    img_bytes = await imagem.read()
    img_rgb   = decodificar_imagem(img_bytes)

    results = seg_model.predict(img_rgb, conf=0.5, verbose=False)
    val     = validate_image(results[0], img_rgb)

    return JSONResponse(status_code=200, content=val)

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=False)
