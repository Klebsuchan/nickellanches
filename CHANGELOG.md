# Changelog

Todas as mudanças notáveis deste projeto serão documentadas neste arquivo.

O formato é baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/),
e este projeto adere ao [Semantic Versioning](https://semver.org/lang/pt-BR/).

---

## [5.0.0] - 2026-10-22

### Adicionado (Added)
- **Motor Gráfico Visual 1-Bit de Impressão Térmica (`receiptCanvas.ts`):**
  - Renderização pixel a pixel via HTML5 Canvas em resolução 576px (80mm) e 384px (58mm).
  - Algoritmo de binarização rigoroso (threshold 1-bit sem dithering cinza/borrões).
  - Conversão direta para comandos ESC/POS Raster Bit Image (`GS v 0`).
  - Tarja preta arredondada em alto destaque para `PEDIDO #X` e `SENHA`.
  - Borda tracejada elegante para `ENDEREÇO DE ENTREGA:` e destaque para `Obs. Entrega:`.
  - Badges pretos arredondados para quantidades `[1x]`, `[2x]` e preços alinhados à direita.
  - Tarja preta destacada para `>>> PEDIDO PAGO E CONFIRMADO <<<`.
- **Ponte Windows "Impressão Automática" v5 Visual (`printerService.ts`):**
  - Script em batch + PowerShell que renderiza bitmaps nativos via `.NET System.Drawing.Printing.PrintDocument`.
  - Encerramento automático de processos antigos órfãos em background na porta 4848.
  - Suporte a impressão silenciosa direta sem caixa de diálogo do Windows.
- **Detecção de Versão da Ponte:**
  - O painel web agora detecta se a máquina cliente possui o App Windows v5 ou versão legada, impedindo fallback em texto simples.

### Corrigido (Fixed)
- Substituição de fontes por drivers POS-80/PS-80 que ignoravam regras de CSS (`background-color: #000`) em impressão HTML direta.
- Fila de impressão na nuvem agora armazena `imageBase64` em vez de texto bruto de 32 colunas.
- Tipagem TypeScript no modelo de `Order` com suporte nativo ao campo `deliveryNotes`.

---

## [4.0.0] - 2026-10-20

### Adicionado (Added)
- **Modo Garçom & Atendimento Presencial:**
  - Painel exclusivo para lançamento rápido de comandas por mesa ou balcão.
  - Seleção ágil de opcionais e impressão instantânea de vias para a cozinha.
- **Painel Kanban de Pedidos em Tempo Real:**
  - Colunas de status: *Recebido*, *Em Preparo*, *Pronto para Entrega*, *Entregue*.
  - Sincronização em tempo real via Firestore `onSnapshot`.
- **Efeitos Sonoros Retrô 8-bits e Jingle:**
  - Alerta sonoro imediato ao receber novos pedidos confirmados.
  - Integração com Web Audio API nativa e jingle sonoro exclusivo da lancheria.

---

## [3.0.0] - 2026-10-15

### Adicionado (Added)
- **Checkout com Pagamento PIX e Cartão:**
  - Integração com fluxo de confirmação e geração de código de autenticação de comprovante.
  - Suporte a troco para dinheiro e cálculo dinâmico de taxa por região/bairro.
- **Mini-Game Intergaláctico "Dog Sideral Runner":**
  - Jogo estilo arcade em Canvas HTML5 embutido na tela de acompanhamento do pedido.
  - Mascote animado com sistema de colisão e pontuação.

---

## [2.0.0] - 2026-10-05

### Adicionado (Added)
- **Sistema de Níveis de Fidelidade (XP):**
  - Pontuação acumulada por lanche pedido.
  - Patentes galácticas desbloqueáveis com benefícios no cardápio.
- **Editor Administrativo de Cardápio e Banners:**
  - Gerenciamento de itens, preços, fotos, disponibilidade e categorias.
  - Gestão de cupons de desconto ativos.

---

## [1.0.0] - 2026-09-20

### Adicionado (Added)
- Lançamento inicial da plataforma web Nickel Lanches.
- Catálogo de xis, porções e bebidas artesanais.
- Carrinho de compras com observações personalizadas.
- Autenticação de clientes via Google / Firebase Auth.
