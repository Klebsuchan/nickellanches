# 🏛️ Arquitetura do Sistema - Nickel Lanches

Este documento descreve a visão geral da arquitetura de software, fluxo de dados, separação de responsabilidades e decisões técnicas do **Nickel Lanches**.

---

## 📐 Visão Geral em Camadas

```
+-------------------------------------------------------------------------+
|                           CLIENTE (FRONTEND SPA)                        |
|                                                                         |
|  +--------------------+  +--------------------+  +-------------------+  |
|  |  Cardápio / Pedido |  |  Cozinha (Kanban)  |  |   Modo Garçom     |  |
|  |  - Carrinho & Cupom|  |  - Status Realtime |  |   - Mesa / Balcão |  |
|  |  - Mini-Game Retro |  |  - Som de Alerta   |  |   - Impressão Vias|  |
|  +--------------------+  +--------------------+  +-------------------+  |
|                                                                         |
|  +-------------------------------------------------------------------+  |
|  |               Motor Gráfico de Impressão Térmica v5               |  |
|  |  - Renderização 1-Bit em Canvas HTML5 (576px / 384px)             |  |
|  |  - Conversão ESC/POS Raster (GS v 0) & Spooler Iframe             |  |
|  +-------------------------------------------------------------------+  |
+------------------------------------+------------------------------------+
                                     |
                                     | HTTPS / WSS
                                     v
+-------------------------------------------------------------------------+
|                  INFRAESTRUTURA & PERSISTÊNCIA (FIREBASE)               |
|                                                                         |
|  +--------------------+  +--------------------+  +-------------------+  |
|  |   Firestore DB     |  |   Firebase Auth    |  |  Cloud Storage    |  |
|  |  - Pedidos / Status|  |  - Google Sign-In  |  |  - Fotos Lanches  |  |
|  |  - Produtos / Card.|  |  - Perfis de User  |  |  - Áudios & Mídia |  |
|  |  - Fila de Impress.|  |  - RBAC (Admin)    |  |                   |  |
|  +--------------------+  +--------------------+  +-------------------+  |
+------------------------------------+------------------------------------+
                                     |
                                     | Polling Local / WebSocket / HTTP
                                     v
+-------------------------------------------------------------------------+
|                  PONTE DE IMPRESSÃO WINDOWS (SEMPRE LIGADO)             |
|                                                                         |
|  - Script PowerShell v5 rodando nativamente no Windows (localhost:4848) |
|  - .NET System.Drawing.Printing.PrintDocument (Bitmap Nativo GDI)       |
|  - Impressão Direta sem Diálogos e sem Interrupção do Operador          |
+-------------------------------------------------------------------------+
```

---

## 🧩 Principais Módulos

### 1. Camada de Apresentação (`src/components/` & `src/App.tsx`)
- **`App.tsx`**: Roteador central e orquestrador de estado global (carrinho, usuário logado, visualização ativa, configurações de tema e alertas sonoros).
- **`Navbar.tsx` & `CartDrawer.tsx`**: Barra de navegação com contador de itens, pontos de experiência (XP), botão de acesso rápido e gaveta deslizante de checkout.
- **`KitchenKanban.tsx`**: Painel visual de pedidos em tempo real dividido em colunas (*Recebido*, *Em Preparo*, *Pronto para Entrega*, *Entregue*). Dispara alerta sonoro e impressão automática ao detectar novos pedidos pagos.
- **`WaiterPanel.tsx`**: Interface ergonômica com toque rápido para atendentes presenciais lançarem pedidos de mesa/balcão sem necessidade de login completo.
- **`DogGame.tsx`**: Mini-game arcade 8-bits construído sobre a HTML5 2D Canvas API rodando em 60 FPS com detecção de colisão AABB (Axis-Aligned Bounding Box).

### 2. Camada de Dados e Sincronização (`src/lib/db.ts` & `src/lib/firebase.ts`)
- Utiliza **Cloud Firestore** com snapshots reativos (`onSnapshot`) para que atualizações em pedidos reflitam instantaneamente na cozinha, no painel do garçom e na tela do cliente.
- Sistema de deduplicação local em `localStorage` para evitar que a mesma comanda seja impressa duas vezes na impressora física.

### 3. Motor Gráfico de Impressão Térmica (`src/lib/receiptCanvas.ts`)
- Substitui a impressão tradicional em HTML/CSS por renderização matemática direta no `<canvas>`.
- **Por que Canvas 1-Bit?** 
  Impressoras térmicas de cupom (POS-80, Epson, Elgin) possuem cabeçotes térmicos monocromáticos. Drivers comuns de Windows frequentemente falham ao renderizar fundos pretos de CSS ou substituem fontes do sistema por fontes nativas desordenadas. A renderização em Canvas gera uma imagem 1-bit pura, garantindo 100% de precisão visual em qualquer modelo.

### 4. Áudio e Efeitos Sonoros (`src/lib/audio.ts`)
- **Web Audio API**: Geração algorítmica de beeps de 8-bits (ondas quadradas e triangulares sintetizadas diretamente na CPU) para cliques de botão, inserção no carrinho e morte no mini-game.
- **Mídia Real**: Jingle comemorativo e sirene de novos pedidos transmitidos em áudio de alta fidelidade para não passar despercebido pelo operador da chapa.
