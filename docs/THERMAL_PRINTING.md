# 🖨️ Guia Técnico de Impressão Térmica - Nickel Lanches

Este documento descreve detalhadamente o funcionamento, arquitetura de hardware e comandos de baixo nível do motor de impressão térmica do **Nickel Lanches**.

---

## 🎯 Desafio da Impressão em Lanchonetes

Impressoras de cupom térmico (como POS-80, Epson TM-T20X, Elgin i9, Bematech MP-4200, Xprinter, Daruma) possuem particularidades desafiadoras:
1. **Substituição de Fontes por Hardware:** O driver do Windows frequentemente ignora fontes tipográficas bonitas do navegador e substitui por fontes ASCII simples e desalinhadas.
2. **Remoção de Fundos Pretos (CSS):** Drivers monocromáticos removem cores de fundo (`background-color: #000`), fazendo com que tarjas pretas (como `PEDIDO #1` ou `ITENS DO PEDIDO`) fiquem invisíveis ou com texto branco sobre fundo branco.
3. **Bloqueio de Diálogo do Navegador:** O `window.print()` tradicional sempre abre a janela do sistema operacional exigindo que o chapeiro pare de trabalhar e pressione `Enter`.

---

## 🚀 A Solução do Nickel Lanches: Motor Gráfico 1-Bit

Desenvolvemos um pipeline gráfico exclusivo em 4 etapas:

```
[Dados do Pedido / Order]
           │
           ▼
[1. Canvas HTML5 2D Render]  ──► Desenha tarjas pretas, fontes em negrito,
           │                      caixas tracejadas e badges em 576px (80mm) ou 384px (58mm)
           ▼
[2. Binarização 1-Bit Rigorosa] ─► Transforma cada pixel RGB em Preto Puro (0) ou Branco Puro (255)
           │                      Threshold fixo: Luminância < 128 = Preto
           │
           ├──────────────────────────────┬──────────────────────────────┐
           ▼                              ▼                              ▼
 [A. Navegador / Iframe]      [B. WebUSB Direto]        [C. Ponte Windows v5 (.bat)]
 - Iframe temporário oculto   - Conexão direta por cabo - Script PowerShell (.NET GDI)
 - Tag <img> com Bitmap PNG   - Comandos ESC/POS bytes   - Graphics.DrawImage
 - CSS @page { margin: 0 }    - 'GS v 0' (Raster Image)  - Impressão 100% silenciosa
```

---

## 📏 Especificações de Resolução e Largura

| Tipo de Bobina | Largura Física | Resolução em Pixels | Densidade Recomendada |
| -------------- | -------------- | ------------------- | --------------------- |
| **80mm (Padrão)** | 72mm imprimíveis | **576 pixels** | 8 dots/mm (203 DPI) |
| **58mm (Estreita)** | 48mm imprimíveis | **384 pixels** | 8 dots/mm (203 DPI) |

---

## 🛠️ Modos de Impressão Suportados

### 1. Aplicativo Windows "Sempre Ligado" (`Impressao-Automatica-Nickel.bat`)
- O arquivo `.bat` baixa e executa um script PowerShell avançado em segundo plano.
- Ele cria um servidor HTTP local em `http://127.0.0.1:4848` e também escuta a coleção de fila no Firestore (`settings/print_queue`).
- Quando um pedido é feito, o script utiliza a biblioteca nativa `.NET System.Drawing.Printing.PrintDocument` para desenhar o Bitmap PNG diretamente na fila de impressão do Windows com interpolação `NearestNeighbor`.
- **Vantagem:** Impressão **instantânea e silenciosa** sem nenhuma intervenção na tela.

### 2. Conexão Direta WebUSB (ESC/POS Nativo)
- O navegador conecta diretamente na impressora térmica USB sem precisar de driver instalado no Windows (utiliza a API `navigator.usb`).
- Converte a imagem 1-bit em bytes ESC/POS:
  - Inicialização: `ESC @` (`0x1B 0x40`)
  - Alinhamento central: `ESC a 1` (`0x1B 0x61 0x01`)
  - Impressão de imagem raster: `GS v 0` (`0x1D 0x76 0x30 0x00 xL xH yL yH [dados...]`)
  - Avanço de linhas: `ESC d n` (`0x1B 0x64 n`)
  - Acionamento da guilhotina: `GS V 66 0` (`0x1D 0x56 0x42 0x00`)

### 3. Spooler Iframe com Imagem Bitmap
- Cria um `<iframe>` invisível dinamicamente.
- Insere a imagem da comanda como uma tag `<img src="data:image/png;base64,...">`.
- Como se trata de uma imagem de primeiro plano (e não CSS de fundo), os drivers como POS-80 são incapazes de desconfigurar ou remover as tarjas pretas.

---

## ❓ Resolução de Problemas (Troubleshooting)

### A bobina saiu em branco
- Verifique se a bobina térmica foi inserida do lado correto (o lado térmico deve ficar encostado no cabeçote). Faça um risco rápido com a unha no papel: se riscar em preto, este é o lado térmico.

### O texto saiu borrado ou com pontinhos cinzas
- O nosso motor usa binarização 1-bit com limiar estrito de 128, eliminando qualquer degradê cinza. Certifique-se de que a resolução no painel do sistema está condizente com sua impressora (selecione **80mm** ou **58mm** nas configurações).

### A janela preta do Windows diz "Nenhuma impressora padrão encontrada"
- Abra o Painel de Controle do Windows > Dispositivos e Impressoras.
- Clique com o botão direito na sua impressora térmica e marque **"Definir como impressora padrão"**.
- Pressione a tecla **`[I]`** na janela preta do aplicativo para selecionar manualmente a impressora correta.
