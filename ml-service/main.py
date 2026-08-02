"""
Microserviço de inferência - BovinoVision
Roda separado do backend Node/Express, chamado via HTTP.

Instalar:
    pip install fastapi uvicorn ultralytics pillow python-multipart numpy tflite-runtime

    Obs: tflite-runtime pode não ter wheel pra toda plataforma (ex: alguns Macs M).
    Se der erro na instalação, usar `tensorflow` completo no lugar e trocar o import
    de `tflite_runtime.interpreter` para `tensorflow.lite`.

Rodar (dev):
    uvicorn main:app --reload --host 0.0.0.0 --port 8001
"""

from fastapi import FastAPI, UploadFile, File, HTTPException
from ultralytics import YOLO
from PIL import Image
import numpy as np
import io

try:
    import tflite_runtime.interpreter as tflite
except ImportError:
    import tensorflow.lite as tflite  # fallback se tflite-runtime não instalar

app = FastAPI(title="BovinoVision ML Service")

# Carrega os modelos uma única vez, na subida do servidor (não a cada request)
segmentation_model = YOLO("models/modelo_bois.pt")

weight_interpreter = tflite.Interpreter(model_path="models/model.tflite")
weight_interpreter.allocate_tensors()
weight_input_details = weight_interpreter.get_input_details()
weight_output_details = weight_interpreter.get_output_details()

# Só pra você ver no terminal, ao subir o serviço, o shape esperado pelo modelo
print("Peso - input details:", weight_input_details)
print("Peso - output details:", weight_output_details)


def _predict_weight(image: Image.Image) -> float:
    """Roda o modelo de peso (Edge Impulse) numa imagem PIL já pronta (recortada ou não)."""
    _, target_h, target_w, _ = weight_input_details[0]["shape"]
    resized = image.resize((target_w, target_h))  # resize = 'Squash' do Edge Impulse
    array = np.array(resized).astype(np.float32)

    # Normalização 0-1, conforme padrão do bloco "Image" do Edge Impulse (confirmar
    # empiricamente com uma foto de peso real conhecido se o valor vier estranho).
    array = array / 255.0

    input_data = np.expand_dims(array, axis=0).astype(weight_input_details[0]["dtype"])

    weight_interpreter.set_tensor(weight_input_details[0]["index"], input_data)
    weight_interpreter.invoke()
    output = weight_interpreter.get_tensor(weight_output_details[0]["index"])

    return float(output[0][0])


def _segment_and_crop(image: Image.Image) -> tuple[Image.Image, bool]:
    """
    Roda a segmentação e recorta a região do animal com maior confiança.
    Se nada for detectado, devolve a imagem original sem recorte (fallback seguro,
    melhor estimar com a imagem inteira do que falhar a análise).
    """
    results = segmentation_model(image)[0]

    if not results.boxes or not hasattr(results.boxes, 'conf') or results.boxes.conf is None or len(results.boxes.conf) == 0:
        return image, False

    best_idx = int(results.boxes.conf.argmax())
    x1, y1, x2, y2 = results.boxes.xyxy[best_idx].tolist()
    cropped = image.crop((x1, y1, x2, y2))
    return cropped, True


@app.post("/infer/analyze")
async def infer_analyze(file: UploadFile = File(...)):
    """
    Endpoint único usado pelo server.ts: segmenta (uso interno, recorte),
    estima o peso na região recortada, e devolve só o peso previsto.
    O status (apto/não apto) é decidido no Node, não aqui.
    """
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(400, "Envie um arquivo de imagem")

    image_bytes = await file.read()
    image = Image.open(io.BytesIO(image_bytes)).convert("RGB")

    cropped_image, animal_detected = _segment_and_crop(image)
    predicted_weight = _predict_weight(cropped_image)

    return {
        "weight": predicted_weight,
        "animalDetected": animal_detected,
    }


# Endpoints individuais mantidos à parte, úteis pra debugar cada modelo isoladamente
# (ex: testar só a segmentação sem rodar o peso, ou vice-versa).

@app.post("/infer/segmentation")
async def infer_segmentation(file: UploadFile = File(...)):
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(400, "Envie um arquivo de imagem")

    image_bytes = await file.read()
    image = Image.open(io.BytesIO(image_bytes)).convert("RGB")

    results = segmentation_model(image)[0]

    detections = []
    if results.masks is not None:
        for i, polygon in enumerate(results.masks.xy):
            cls_id = int(results.boxes.cls[i])
            confidence = float(results.boxes.conf[i])
            detections.append({
                "classId": cls_id,
                "className": segmentation_model.names[cls_id],
                "confidence": confidence,
                "polygon": polygon.tolist(),
                "box": results.boxes.xyxy[i].tolist(),
            })

    return {
        "imageWidth": image.width,
        "imageHeight": image.height,
        "detections": detections,
    }


@app.post("/infer/weight")
async def infer_weight(file: UploadFile = File(...)):
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(400, "Envie um arquivo de imagem")

    image_bytes = await file.read()
    image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    predicted_weight = _predict_weight(image)

    return {"weight": predicted_weight}
