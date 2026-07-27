# Fine-Tuning — Modelo Experimental (V2)

> **Status: 🧪 Experimental.** Este modelo ainda **não substitui** o modelo em produção (`models/edge-impulse/model.tflite`). O resultado atual (MAE 47.82 kg) é **pior** que o modelo do Edge Impulse (MAE 32.87 kg). Mantido aqui como frente de pesquisa em desenvolvimento para a Sprint 3.

## Resumo

Tentativa de melhorar a estimativa de peso aplicando **Fine-Tuning** (ajuste fino) sobre um modelo **MobileNet pré-treinado**, obtido a partir do projeto de referência indicado pelo Prof. Alexandre (ver `external/TCC_V2-master.zip`). O treinamento foi feito no **Google Colab**.

## Métrica obtida

| Métrica | Valor |
|---|---|
| MAE (Mean Absolute Error) | **47.82 kg** |

**Comparação com o modelo de produção:**

| Modelo | MAE |
|---|---|
| Edge Impulse (Transfer Learning / MobileNet) — produção | 32.87 kg |
| Fine-Tuning (MobileNet pré-treinado + ajuste fino) — experimental | 47.82 kg |

O resultado do Fine-Tuning ainda não superou o modelo atual. Possíveis causas a investigar: diferença entre o domínio do dataset original do modelo pré-treinado (imagens de vista superior) e o dataset próprio (vista traseira), quantidade de dados de treino, ou hiperparâmetros do ajuste fino.

## Passo a passo: como foi feito

### 1. Origem do modelo base
- Modelo pré-treinado **MobileNet**, obtido do projeto de referência indicado pelo Prof. Alexandre: `external/TCC_V2-master.zip` (projeto de outro grupo/TCC que trabalhou com estimativa de peso bovino usando imagens de vista superior).

### 2. Dataset utilizado
- **Apenas o dataset próprio** da equipe (`data/dataset/`, o mesmo usado no Edge Impulse) — imagens de bovinos (vista traseira) com peso real (kg) como label.

### 3. Processo de Fine-Tuning (Google Colab)
- Carregamento do modelo pré-treinado (pesos do MobileNet vindos do TCC de referência).
- Camadas base mantidas (congeladas ou parcialmente ajustadas) para reaproveitar o conhecimento visual genérico já aprendido (bordas, texturas, formas).
- Ajuste fino (fine-tuning) das camadas finais de regressão usando o dataset próprio, para adaptar a saída à tarefa específica de prever peso (kg) a partir das imagens da Rayvora.
- Notebook completo: `FineTuning_Rayvora.ipynb`.

### 4. Avaliação
- MAE calculado sobre o conjunto de teste: **47.82 kg**.

## Arquivos nesta pasta

| Arquivo | Descrição |
|---|---|
| `FineTuning_Rayvora.ipynb` | Notebook do Google Colab com todo o processo de fine-tuning |
| `model.tflite` | Modelo resultante do fine-tuning (experimental, não usado em produção) |
| `Rayvora_v3_Fine_Tunning_Completo.zip` | Pacote completo gerado a partir do processo de fine-tuning |

## Próximos passos (Sprint 3)

- Investigar por que o MAE ficou maior que o modelo do Edge Impulse.
- Testar variações de hiperparâmetros (taxa de aprendizado, épocas, quais camadas congelar).
- Avaliar se vale combinar o dataset próprio com imagens do dataset de referência (vista superior) do TCC, mesmo que o domínio visual seja diferente.
- Comparar resultado final com o modelo de produção antes de decidir por uma eventual substituição.

## Dataset utilizado

Ver `data/dataset/README.md`.

## Projeto de referência (origem do modelo pré-treinado)

Ver `external/README.md`.