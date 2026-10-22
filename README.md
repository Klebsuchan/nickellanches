<div align="center">
  <img src="public/logonickel.png" alt="Nickel Lanches Logo" width="220" />
  
  # 🚀 Nickel Lanches
  
  **O ecossistema definitivo de delivery, atendimento de salão e impressão térmica inteligente para lanchonetes.**
  
  Uma experiência intergaláctica completa: cardápio gamificado com temática retrô arcade, painel Kanban da cozinha em tempo real, modo garçom para comandas de mesa/balcão e um revolucionário motor gráfico 1-bit de impressão térmica em bobinas de 80mm e 58mm.

  <p align="center">
    <a href="https://github.com/braiankleber/nickel-lanches/actions"><img src="https://img.shields.io/badge/CI-Passing-brightgreen?style=for-the-badge&logo=github-actions&logoColor=white" alt="CI Status" /></a>
    <img src="https://img.shields.io/badge/React_18-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React" />
    <img src="https://img.shields.io/badge/TypeScript_5-007ACC?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
    <img src="https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite" />
    <img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS" />
    <img src="https://img.shields.io/badge/Firebase_Firestore-FFCA28?style=for-the-badge&logo=firebase&logoColor=black" alt="Firebase" />
    <img src="https://img.shields.io/badge/ESC%2FPOS-1Bit_Raster-blueviolet?style=for-the-badge&logo=print&logoColor=white" alt="ESC/POS 1-Bit" />
    <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge" alt="Licença MIT" /></a>
  </p>
</div>

---

## 📋 Sumário

- [🌟 Por que o Nickel Lanches é Único?](#-por-que-o-nickel-lanches-é-único)
- [✨ Principais Funcionalidades](#-principais-funcionalidades)
- [🖨️ Revolucionário Motor Gráfico de Impressão Térmica (v5 Visual)](#️-revolucionário-motor-gráfico-de-impressão-térmica-v5-visual)
- [🛠️ Tecnologias Utilizadas](#️-tecnologias-utilizadas)
- [🚀 Como Executar Localmente](#-como-executar-localmente)
- [📂 Estrutura de Diretórios](#-estrutura-de-diretórios)
- [📖 Documentação Técnica Completa](#-documentação-técnica-completa)
- [🤝 Como Contribuir & Comunidade](#-como-contribuir--comunidade)
- [📄 Licença & Autoria](#-licença--autoria)

---

## 🌟 Por que o Nickel Lanches é Único?

A maioria dos sistemas de delivery se divide entre plataformas pesadas de terceiros (que cobram comissões abusivas por pedido) ou soluções web frágeis que engasgam na impressora do caixa. 

O **Nickel Lanches** foi desenhado artesanalmente para resolver o mundo real de uma chapa de lanches movimentada:
1. **Zero comissão:** Plataforma própria com total controle dos dados e pagamentos.
2. **Experiência do Cliente Gamificada:** O ato de pedir vira um jogo retrô anos 90, com efeitos sonoros em 8-bits, pontos de experiência (XP), patentes galácticas e um mini-game de corrida com o mascote enquanto o lanche é preparado.
3. **Hardware Sem Dor de Cabeça:** Um motor gráfico inovador que desenha comandas pixel a pixel em preto e branco puro, imune a erros de drivers do Windows, sem fontes tortas e com corte automático de papel.

---

## ✨ Principais Funcionalidades

### 🍔 Para o Cliente (Cardápio & Experiência)
- **Catálogo Interativo Completo:** Seleção dinâmica de lanches, adicionais extras (bacon, cheddar, ovo, maionese temperada) e campos de observação.
- **Checkout Inteligente & PIX:** Cálculo automático de taxa de entrega por bairro/região, troco para dinheiro e código de autenticação único de pedido.
- **🎮 Mini-Game Sideral Runner:** Jogo estilo arcade dinossauro/runner construído em Canvas HTML5 puro para entreter o cliente enquanto acompanha a barra de progresso do preparo.
- **🏆 Sistema de Níveis e Fidelidade (XP):** Cada lanche concede pontos de experiência para desbloquear títulos de honra no ranking de clientes.
- **🔊 Sintetizador de Áudio Retrô:** Sons de moeda, power-up e beeps sintetizados em tempo real via **Web Audio API** nativa (sem arquivos pesados).

### 🍳 Para a Cozinha & Operação (Kanban & Som)
- **Painel Kanban em Tempo Real:** Colunas dinâmicas (*Recebido*, *Em Preparo*, *Pronto para Entrega*, *Entregue*) com sincronização instantânea via Firestore `onSnapshot`.
- **Sirene Sonora de Alerta:** Jingle exclusivo e aviso sonoro potente para que a cozinha nunca perca um pedido novo.
- **Controle de Produção:** Separação visual clara de comandas pagas e opções de cancelamento/estorno com um clique.

### 🛎️ Para o Salão (Modo Garçom)
- **Lançamento Rápido de Mesas e Balcão:** Interface táctil e objetiva para garçons realizarem pedidos presenciais sem fricção de login.
- **Disparo de Comandas Segmentadas:** Impressão de vias dedicadas para a copa de bebidas e para a chapa de lanches.

### ⚙️ Painel Administrativo
- **Gestão de Produtos & Preços:** Adicionar, editar, pausar estoque e gerenciar promoções.
- **Cupons de Desconto:** Criação de códigos promocionais com regras de valor fixo ou percentual.
- **Configurações Globais de Impressão:** Ajuste de margens, cabeçalhos, rodapés, número de vias e escolha de bobina (80mm vs 58mm).

---

## 🖨️ Revolucionário Motor Gráfico de Impressão Térmica (v5 Visual)

O calcanhar de Aquiles dos sistemas web para lanchonetes é a impressora térmica de cupom (POS-80, Epson, Elgin, Bematech). Drivers comuns substituem fontes e removem fundos pretos de CSS.

Resolvemos isso com o **Motor Gráfico 1-Bit Monocromático**:
- **Renderização Pixel a Pixel em Canvas HTML5 (`receiptCanvas.ts`):** A comanda inteira é rasterizada em alta definição (576px para 80mm ou 384px para 58mm).
- **Threshold Binarizado Rigoroso:** Elimina qualquer pontilhado cinza (*dithering*) que deixaria o cabeçote térmico borrado. Cada ponto é preto absoluto ou branco absoluto.
- **Layout Profissional Idêntico ao Físico:**
  - Tarja preta arredondada gigante `PEDIDO #X` com letras brancas em alto contraste.
  - Caixa com borda tracejada elegante para `ENDEREÇO DE ENTREGA:` e destaque para `Obs. Entrega:`.
  - Badges pretos arredondados de quantidade `[1x]`, `[2x]` ao lado dos itens e preços alinhados à direita.
  - Tarja preta de autenticação `>>> PEDIDO PAGO E CONFIRMADO <<<`.
- **Três Canais de Saída Simultâneos:**
  1. **Ponte Windows "Sempre Ligado" (`.bat` v5):** Serviço silencioso em segundo plano usando `.NET System.Drawing` que imprime sozinho assim que o pedido entra, sem caixa de diálogo.
  2. **WebUSB Direto:** Envio de comandos brutos ESC/POS (`GS v 0` Raster Bit Image) via cabo USB sem necessidade de driver.
  3. **Spooler Iframe:** Renderização da imagem 1-bit em tag `<img>` invisível compatível com qualquer navegador moderno.

---

## 🛠️ Tecnologias Utilizadas

| Camada | Tecnologia | Propósito |
| ------ | ---------- | --------- |
| **Frontend** | React 18, TypeScript | Arquitetura SPA componentizada e fortemente tipada |
| **Build & Dev** | Vite | Compilação ultra-rápida e Hot Module Replacement |
| **Estilização** | Tailwind CSS | Design system responsivo com zero arquivos CSS soltos |
| **Animações** | Framer Motion | Transições suaves de gavetas, modais e banners |
| **Ícones** | Lucide React | Pacote moderno e consistente de ícones vetoriais |
| **Banco de Dados** | Google Cloud Firestore | Banco NoSQL em tempo real reativo via WebSockets |
| **Autenticação** | Firebase Auth | Login social simplificado com Google |
| **Áudio** | Web Audio API nativa | Síntese sonora procedural de 8-bits sem dependências |
| **Impressão** | HTML5 Canvas 2D + ESC/POS | Rasterização 1-bit de comandas térmicas |
| **Ponte Windows** | PowerShell + .NET GDI | Driver de impressão silenciosa em segundo plano |

---

## 🚀 Como Executar Localmente

### Pré-requisitos
- **Node.js** v18+ instalado.
- Conta no [Firebase Console](https://console.firebase.google.com/) com Auth e Firestore ativados.

### 1. Clonar o Repositório
```bash
git clone https://github.com/braiankleber/nickel-lanches.git
cd nickel-lanches
```

### 2. Configurar Variáveis de Ambiente
Crie um arquivo `.env` na raiz do projeto:
```env
VITE_FIREBASE_API_KEY=sua_api_key
VITE_FIREBASE_AUTH_DOMAIN=seu-projeto.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=seu-projeto
VITE_FIREBASE_STORAGE_BUCKET=seu-projeto.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=seu_sender_id
VITE_FIREBASE_APP_ID=seu_app_id
PORT=3000
```

### 3. Instalar Dependências e Iniciar
```bash
npm install
npm run dev
```
Acesse `http://localhost:3000` no seu navegador!

---

## 📂 Estrutura de Diretórios

```
.
├── .github/
│   ├── ISSUE_TEMPLATE/       # Modelos profissionais de issues (Bug, Feature, Impressora)
│   ├── workflows/ci.yml      # Pipeline de CI automático (Lint + TypeCheck + Build)
│   └── PULL_REQUEST_TEMPLATE.md
├── docs/                     # Documentação técnica detalhada
│   ├── ARCHITECTURE.md       # Diagramas arquiteturais e fluxo de dados
│   ├── THERMAL_PRINTING.md   # Especificações de ESC/POS, WebUSB e motor 1-bit
│   ├── FIRESTORE_DATABASE.md # Esquema de coleções, índices e regras de segurança
│   └── DEPLOYMENT.md         # Guias de deploy (Cloud Run, Vercel, Docker)
├── public/                   # Imagens de lanches, logomarcas, ícones e PWA manifest
├── src/
│   ├── components/           # Componentes de interface (Kanban, Garçom, Modais, Game)
│   ├── lib/                  # Serviços centrais (firebase.ts, db.ts, receiptCanvas.ts, printerService.ts)
│   ├── App.tsx               # Orquestrador central e roteamento SPA
│   ├── data.ts               # Cardápio inicial estático, cupons e níveis de XP
│   └── types.ts              # Tipagem global do TypeScript
├── server.ts                 # Servidor Node.js Express para servir em containers
├── firestore.rules           # Regras de segurança rigorosas do Cloud Firestore
├── CHANGELOG.md              # Histórico de versões estruturado (Keep a Changelog)
├── CONTRIBUTING.md           # Diretrizes para colaboradores da comunidade
├── CODE_OF_CONDUCT.md        # Código de Conduta Contributor Covenant v2.1
├── SECURITY.md               # Política e canal confidencial de segurança
└── LICENSE                   # Licença de código aberto MIT
```

---

## 📖 Documentação Técnica Completa

Para se aprofundar em qualquer aspecto do sistema, consulte os manuais dedicados na pasta [`docs/`](docs/):

- 🏛️ [**Arquitetura do Sistema**](docs/ARCHITECTURE.md): Diagrama em camadas, estado global e reatividade.
- 🖨️ [**Guia de Impressão Térmica**](docs/THERMAL_PRINTING.md): Especificações de ESC/POS, WebUSB, cálculo de threshold 1-bit e troubleshooting de bobinas.
- 🗄️ [**Banco de Dados Firestore**](docs/FIRESTORE_DATABASE.md): Esquema das coleções `orders`, `products`, `settings/print_queue` e regras de acesso.
- 🚀 [**Manual de Implantação e Deploy**](docs/DEPLOYMENT.md): Passo a passo para Cloud Run, Vercel, Docker e instalação no PC do restaurante.

---

## 🤝 Como Contribuir & Política de Branches

Adoramos contribuições da comunidade! No entanto, mantemos uma política estrita de governança de código:

> 🛡️ **Proteção da Branch `main`:**  
> **Não são permitidos commits diretos na branch `main`.**  
> Todo código deve ser desenvolvido em branches secundárias (`feature/*`, `fix/*`) e submetido exclusivamente via **Pull Request (PR)** com 100% de aprovação no pipeline de CI (Lint, Typecheck e Build). Consulte o [**Guia de Proteção da Branch Main**](.github/BRANCH_PROTECTION.md).

> 🔐 **Segurança e Senhas:**  
> A senha do Painel Administrativo nunca deve ser exposta ou commitada no repositório. O acesso é configurado localmente ou em produção via variável de ambiente `VITE_ADMIN_PASSWORD` (consulte `.env.example` e [SECURITY.md](SECURITY.md)).

1. Leia nosso [Código de Conduta](CODE_OF_CONDUCT.md).
2. Consulte o [Guia de Contribuição](CONTRIBUTING.md) e [Guia de Proteção de Branches](.github/BRANCH_PROTECTION.md).
3. Escolha ou crie uma [Issue no GitHub](https://github.com/braiankleber/nickel-lanches/issues) usando nossos templates dedicados:
   - 🐛 [Reportar Bug](.github/ISSUE_TEMPLATE/bug_report.md)
   - 💡 [Sugerir Nova Funcionalidade](.github/ISSUE_TEMPLATE/feature_request.md)
   - 🖨️ [Problema com Impressora Térmica](.github/ISSUE_TEMPLATE/thermal_printer_issue.md)
4. Abra seu [Pull Request](.github/PULL_REQUEST_TEMPLATE.md)!

---

## 📄 Licença & Autoria

Distribuído sob a **Licença MIT**. Consulte o arquivo [`LICENSE`](LICENSE) para mais detalhes.

Desenvolvido com carinho e muito bacon por **Braian Kleber Camargo** & equipe **Nickel Lanches**! 🌭🚀

