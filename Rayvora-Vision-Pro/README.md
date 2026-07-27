# Rayvora Vision Pro — Sistema Inteligente de Estimativa de Peso Bovino

![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)
![Python](https://img.shields.io/badge/Python-3.12-blue.svg)
![React](https://img.shields.io/badge/React-18%20%2B%20Vite-61DAFB?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript)
![Node.js](https://img.shields.io/badge/Node.js-18+-339933?logo=nodedotjs)
![TinyML: Edge Impulse](https://img.shields.io/badge/TinyML-Edge%20Impulse-1BA94C.svg)
![PWA](https://img.shields.io/badge/PWA-Suportado-orange?logo=pwa)
![Status: Em Desenvolvimento](https://img.shields.io/badge/Status-Em%20Desenvolvimento-yellow.svg)

**Autores:** Ludivino José Da Silva, Lucas Teixeira Belli e Pedro Omna
**Disciplina:** Projeto Integrador I (2026.1) – Engenharia de Computação (UFSC)

---

## Sobre o Projeto

O **Rayvora Vision Pro** é um ecossistema de pecuária de precisão focado na estimativa de peso de bovinos a partir de imagens. O objetivo é oferecer ao produtor rural uma alternativa móvel, de baixo custo e não invasiva à pesagem mecânica tradicional, utilizando apenas a câmera de um smartphone e modelos avançados de Machine Learning (TinyML).

A aplicação é uma **Progressive Web App (PWA)** construída com React e Vite, com um microserviço de IA em Python/FastAPI para o processamento pesado.


## Funcionalidades Principais

- **Estimativa de Peso com IA**: Processa imagens de bovinos para estimar o peso.
- **Status de Aptidão para Abate**: Classifica automaticamente o animal como "APTO" ou "NÃO APTO" com base no peso.
- **Instalação como App (PWA)**: Pode ser adicionado à tela inicial do Android/iOS.
- **Autenticação e Histórico na Nuvem**: Login seguro e sincronização de dados com Firebase/Supabase.
- **Análise de Evolução**: Gráficos para acompanhar o Ganho Médio Diário (GMD).
- **Modo Offline**: Permite registrar avaliações sem conexão com a internet.

## Tecnologias Utilizadas

- **Frontend**: React, Vite, TypeScript, TailwindCSS
- **Backend (API)**: Node.js, Express.js
- **Backend (IA)**: Python, FastAPI, YOLOv8, TensorFlow Lite
- **Banco de Dados & Auth**: Supabase, Firebase
- **PWA**: `vite-plugin-pwa`

## Estrutura do Projeto

```
./
├── ml-service/           # 🧠 Backend de IA (Python/FastAPI)
│   ├── models/           # Modelos .pt e .tflite (não versionados)
│   └── main.py           # Lógica da API de inferência
├── models/               # 🤖 Documentação e fontes dos modelos de IA
│   ├── segmentation/     # Modelo YOLOv8 para segmentação
│   ├── edge-impulse/     # Modelo de regressão (Produção)
│   └── fine-tuning/      # Modelo de regressão (Experimental)
├── public/               # Assets estáticos e ícones da PWA
├── src/                  # 💻 Código-fonte do Frontend (React)
│   ├── components/
│   ├── lib/              # Módulos de integração (Firebase, Supabase)
│   └── App.tsx           # Componente raiz da aplicação
├── server/               # Módulos do servidor Node.js
├── server.ts             # Ponto de entrada do servidor Express
├── package.json          # Dependências do Node.js
└── README.md
```

## Como Começar

### Pré-requisitos
- Node.js (v18 ou superior)
- Python (v3.10 ou superior)
- Git

### 1. Clone o Repositório
```bash
git clone https://github.com/ludivinojosedasilva/Projeto_Bois_IA.git
cd Rrayvora-Vision-Pro
```

### 2. Configure os Modelos de IA
O serviço de IA precisa dos arquivos de modelo para funcionar. Crie a pasta e copie-os:
```bash
# Crie a pasta para os modelos do microsserviço
mkdir -p ml-service/models

# Copie o modelo de segmentação
cp models/segmentation/best.pt ml-service/models/modelo_bois.pt

# Copie o modelo de regressão (produção)
cp models/edge-impulse/model.tflite ml-service/models/model.tflite
```

### 3. Inicie o Backend de IA (Python)
Abra um terminal e execute os seguintes comandos:
```bash
# Navegue até a pasta do microsserviço
cd ml-service

+# (Opcional, mas recomendado) Crie um ambiente virtual
+python -m venv venv
+source venv/bin/activate  # No Windows: venv\Scripts\activate

# Instale as dependências Python
pip install fastapi uvicorn ultralytics pillow python-multipart numpy "tensorflow-lite"

# Inicie a API na porta 8001
uvicorn main:app --reload --port 8001
```
Deixe este terminal rodando.

### 4. Inicie o Frontend (Node.js + React)
Abra um **segundo terminal** na raiz do projeto (`Rrayvora-Vision-Pro`) e execute:
```bash
# Instale as dependências do Node.js
npm install

# Inicie o servidor de desenvolvimento na porta 3000
npm run dev
```
A aplicação estará disponível em `http://localhost:3000`.

## Modelos de Inteligência Artificial

O projeto utiliza uma pipeline com múltiplos modelos de IA. Para detalhes técnicos sobre o treinamento e as métricas de cada um, consulte os arquivos `README.md` em suas respectivas pastas.

| Módulo | Técnica | Status | Resultado |
| :--- | :--- | :--- | :--- |
| **Segmentação** | YOLOv8s-Seg | ✅ Validado | `mAP50: 0.99` |
| **Regressão (Produção)** | Edge Impulse (MobileNet) | ✅ Em Produção | `MAE: 32.87 kg` |
| **Regressão (Experimental)** | Fine-Tuning (MobileNet) | 🧪 Em Pesquisa | `MAE: 47.82 kg` |

## Licença

Este projeto está licenciado sob a **MIT License**. Veja o arquivo `LICENSE` para mais detalhes.

## Autores

Este sistema foi desenvolvido como parte do Projeto Integrador I do curso de Engenharia de Computação da UFSC (2026.1).

- **Ludivino José Da Silva**
- **Lucas Teixeira Belli**
- **Pedro Omna**