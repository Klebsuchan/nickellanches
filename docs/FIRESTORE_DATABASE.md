# 🗄️ Esquema do Banco de Dados Firestore - Nickel Lanches

O **Nickel Lanches** utiliza o **Google Cloud Firestore** (NoSQL Database) em modo em tempo real para sincronização instantânea entre clientes, garçons, painel da cozinha e ponte de impressão.

---

## 📂 Coleções Principais

### 1. `orders` (Pedidos)
Armazena todos os pedidos realizados no sistema (delivery, balcão e mesas).

| Campo | Tipo | Descrição |
| ----- | ---- | --------- |
| `id` | `string` | ID único gerado automaticamente pelo Firestore |
| `orderNumber` | `number` | Número sequencial legível para a comanda (ex: 1, 2, 3...) |
| `userName` | `string` | Nome do cliente ou "Mesa X / Balcão" |
| `whatsapp` | `string` | Telefone / WhatsApp para contato e confirmação |
| `address` | `string` | Endereço completo com rua, número, complemento e bairro |
| `region` | `string` | Bairro / Região selecionada para taxa de entrega |
| `deliveryNotes` | `string` | Observações específicas de entrega (ex: campainha quebrada) |
| `deliveryFee` | `number` | Valor cobrado pela taxa de entrega (R$) |
| `items` | `Array<OrderItem>` | Lista de itens inclusos no pedido |
| `totalPrice` | `number` | Valor total final do pedido (R$) |
| `paymentMethod` | `string` | Método escolhido (PIX, Cartão na Entrega, Dinheiro) |
| `changeFor` | `string` | Valor de troco solicitado para pagamento em dinheiro |
| `status` | `string` | Status atual (`recebido`, `em preparo`, `pronto`, `entregue`, `cancelado`) |
| `isPaid` | `boolean` | `true` se o pagamento foi confirmado pelo admin ou gateway |
| `paymentStatus` | `string` | `pago`, `pendente` ou `recusado` |
| `receiptAuthCode` | `string` | Código de autenticação gerado para validação fiscal |
| `receiptTimestamp` | `string` | Horário formatado da emissão da comanda |
| `createdAt` | `Timestamp` | Data e hora de criação do pedido |

#### Estrutura do item (`OrderItem`):
```typescript
interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  observation?: string;
  extras?: Array<{ name: string; price: number }>;
}
```

---

### 2. `products` (Cardápio / Produtos)
Itens disponíveis para venda no aplicativo.

| Campo | Tipo | Descrição |
| ----- | ---- | --------- |
| `id` | `string` | ID do produto |
| `name` | `string` | Nome do lanche ou bebida (ex: "X-Salada Duplo Especial") |
| `category` | `string` | Categoria (`xis`, `porcoes`, `bebidas`, `combos`, `sobremesas`) |
| `price` | `number` | Preço base do produto |
| `description` | `string` | Descrição dos ingredientes e receita |
| `imageUrl` | `string` | URL da foto do produto |
| `available` | `boolean` | Se está disponível para pedidos hoje |
| `isPromo` | `boolean` | Se está em destaque de promoção |
| `promoPrice` | `number` | Preço promocional (se ativo) |
| `points` | `number` | Quantidade de XP concedida ao pedir este lanche |

---

### 3. `settings` (Configurações Gerais e Impressoras)
Documentos de configuração do sistema. O documento `printer` armazena as preferências de impressão:

| Campo | Tipo | Descrição |
| ----- | ---- | --------- |
| `printerType` | `string` | `thermal_80` (80mm) ou `thermal_58` (58mm) |
| `printCopies` | `number` | `1` (via única) ou `2` (via da cozinha + via do cliente) |
| `autoPrint` | `boolean` | Ativa a impressão automática no momento em que o pedido é pago |
| `printHeader` | `string` | Título da comanda (ex: "NICKEL LANCHES") |
| `printSubHeader` | `string` | Subtítulo da comanda (ex: "DELIVERY DE VERDADE!") |
| `printPhone` | `string` | Telefone que aparece no cabeçalho |
| `printAddress` | `string` | Endereço físico da lancheria |
| `printFooter` | `string` | Mensagem de agradecimento no rodapé |
| `feedLines` | `number` | Quantidade de linhas para avançar o papel antes do corte |
| `cutPaper` | `boolean` | Enviar comando de acionamento da guilhotina |

---

### 4. `settings/print_queue` (Fila de Impressão na Nuvem)
Subcoleção onde jobs de impressão são enfileirados pelo painel web e consumidos pela ponte do Windows:

| Campo | Tipo | Descrição |
| ----- | ---- | --------- |
| `orderId` | `string` | ID do pedido associado |
| `imageBase64` | `string` | Comanda completa binarizada em formato PNG 1-bit Base64 |
| `copies` | `number` | Número de vias a imprimir |
| `printerType` | `string` | Largura da bobina (`thermal_80` ou `thermal_58`) |
| `createdAt` | `Timestamp` | Momento em que o job foi enfileirado |
| `printed` | `boolean` | Marcado como `true` assim que a impressora física processa o job |

---

## 🔒 Regras de Segurança (`firestore.rules`)

As regras garantem:
1. Clientes autenticados podem criar seus próprios pedidos e ler apenas os seus.
2. Admins identificados têm permissão total de leitura e escrita nas coleções.
3. Leitura pública permitida para o catálogo de `products` e `settings` gerais.
4. Escrita na fila `print_queue` permitida para operadores autenticados.
