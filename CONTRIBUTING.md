# Guia de Contribuição (Contributing Guide)

Obrigado pelo interesse em contribuir com o **Nickel Lanches**! 🚀🍔
Este documento fornece as diretrizes para desenvolvimento, criação de issues e envio de pull requests.

---

## 📋 Sumário
1. [Código de Conduta](#código-de-conduta)
2. [Como Posso Contribuir?](#como-posso-contribuir)
3. [Configuração do Ambiente Local](#configuração-do-ambiente-local)
4. [Padrões de Branch e Commit](#padrões-de-branch-e-commit)
5. [Padrões de Código e TypeScript](#padrões-de-código-e-typescript)
6. [Diretrizes de Impressão Térmica (ESC/POS)](#diretrizes-de-impressão-térmica-escpos)
7. [Submetendo um Pull Request](#submetendo-um-pull-request)

---

## 1. Código de Conduta
Por favor, leia nosso [Código de Conduta](CODE_OF_CONDUCT.md) antes de participar da comunidade. Esperamos respeito e cordialidade em todas as interações.

---

## 2. Como Posso Contribuir?
- 🐛 **Reportando Bugs:** Use os modelos de issue do repositório para relatar falhas com passos reproduzíveis.
- 💡 **Sugerindo Melhorias:** Proponha novos lanches, recursos para garçons, otimizações no Kanban ou ideias para o mini-game.
- 🖨️ **Suporte a Novas Impressoras Térmicas:** Testes com modelos de 58mm/80mm (Epson, Elgin, Daruma, Bematech, POS-80, Xprinter, etc.).
- 📝 **Melhorias na Documentação:** Correções tipográficas, traduções ou novos tutoriais.

---

## 3. Configuração do Ambiente Local

### Pré-requisitos
- **Node.js** >= 18.0.0
- **npm** ou **bun**
- Um projeto no **Firebase Console** (Auth + Firestore ativados)

### Passo a Passo
```bash
# 1. Clone o repositório
git clone https://github.com/seu-usuario/nickel-lanches.git
cd nickel-lanches

# 2. Instale as dependências
npm install

# 3. Crie seu arquivo de ambiente baseado no exemplo
cp .env.example .env.local

# 4. Inicie o servidor de desenvolvimento
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000) no seu navegador.

---

## 4. Política de Branch e Padrões de Commit

> ### 🛑 REGRA CRÍTICA DE PROTEÇÃO DE BRANCH
> **É estritamente proibido realizar commits diretos (`git push origin main`) na branch `main`.**
> 
> 1. Todas as modificações sem exceção devem ser feitas em uma branch separada (`feature/*`, `fix/*`, `chore/*`, `docs/*`).
> 2. Qualquer tentativa de push direto na `main` será bloqueada pelas regras de proteção do repositório e pelo GitHub Actions CI.
> 3. O merge para a `main` só é permitido via **Pull Request (PR)** aprovado e com todas as etapas do CI (Lint e Build) concluídas com 100% de sucesso.
> 4. **Segurança de Credenciais:** NUNCA adicione a senha real de administrador (`VITE_ADMIN_PASSWORD`) ou credenciais secretas em commits, PRs, testes ou documentação pública.

- `feature/nome-da-funcionalidade` (ex: `feature/modo-garcom-comanda-mesa`)
- `fix/descricao-do-bug` (ex: `fix/thermal-feed-cut-pos80`)
- `docs/melhoria-documentacao` (ex: `docs/arquitetura-motor-grafico`)
- `perf/otimizacao` (ex: `perf/canvas-1bit-threshold`)

### Padrão de Commits (Conventional Commits)
Seguimos o padrão [Conventional Commits](https://www.conventionalcommits.org/):

```
tipo(escopo opcional): descrição curta no imperativo

[corpo explicativo opcional]

[referência a issues fechadas, ex: Closes #42]
```

**Tipos permitidos:**
- `feat`: Nova funcionalidade para o usuário ou admin
- `fix`: Correção de um bug
- `docs`: Alterações exclusivamente na documentação
- `style`: Formatação, ponto e vírgula, espaços (sem alteração lógica)
- `refactor`: Refatoração de código sem mudar comportamento
- `perf`: Mudança de código que melhora performance
- `test`: Adição ou refatoração de testes
- `chore`: Tarefas de build, ferramentas auxiliares ou dependências

---

## 5. Padrões de Código e TypeScript

1. **TypeScript Obrigatório:** Não utilize `any` desnecessário; defina interfaces em `src/types.ts` ou nos módulos de domínio.
2. **Estilização com Tailwind CSS:** Evite CSS inline arbitrário. Use classes semânticas do Tailwind.
3. **Verificação de Compilação:** Antes de abrir um PR, execute sempre:
   ```bash
   npm run lint
   npm run build
   ```
   Ambos devem passar com **zero erros**.

---

## 6. Diretrizes de Impressão Térmica (ESC/POS)

Se for modificar arquivos relacionados à impressão (`src/lib/receiptCanvas.ts`, `src/lib/escpos.ts`, `src/lib/printerService.ts`):
- O layout das comandas deve respeitar as larguras padrão:
  - **80mm / 3 polegadas:** Largura de renderização de **576 pixels** (ou 48 caracteres em texto mono).
  - **58mm / 2 polegadas:** Largura de renderização de **384 pixels** (ou 32 caracteres em texto mono).
- O motor gráfico utiliza rasterização **1-bit monocromático puro** (limiar threshold `>= 128` vira branco, `< 128` vira preto puro) para evitar borrões de pontilhado/dithering em cabeçotes térmicos.
- O corte de papel (`GS V 0` ou `GS V 1`) deve incluir avanço de linhas configurável (`feedLines`) antes de acionar a guilhotina.

---

## 7. Submetendo um Pull Request

1. Atualize sua branch com a `main` mais recente (`git rebase main` ou `git merge main`).
2. Garanta que `npm run lint` e `npm run build` rodem com sucesso.
3. Abra o PR utilizando o modelo padrão pré-definido em `.github/PULL_REQUEST_TEMPLATE.md`.
4. Descreva claramente o objetivo da mudança e inclua prints ou vídeos se a alteração for visual.
