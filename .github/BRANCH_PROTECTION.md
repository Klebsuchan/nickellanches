# Guia de Configuração: Proteção da Branch Main

Para atender à exigência de **não permitir nenhuma alteração direta na branch `main`**, este documento detalha como ativar as **Branch Protection Rules** e **Rulesets** no repositório GitHub do **Nickel Lanches**.

---

## 🔒 1. Por que Proteger a Branch `main`?

A branch `main` representa o código de produção estável conectado ao deploy contínuo (Vercel / Firebase Hosting / Servidor de Impressão). 

Permitir commits diretos na `main` pode:
- Quebrar o sistema de delivery em horário de pico;
- Desalinhar o banco de dados e as regras do Firestore;
- Gerar conflitos de merge e perda de integridade do histórico;
- Expor dados confidenciais ou quebrar a compilação do TypeScript.

---

## ⚙️ 2. Como Configurar no GitHub (Passo a Passo)

### Método A: Branch Protection Rules (Padrão)

1. No repositório no GitHub, clique na aba **Settings** (Configurações);
2. No menu lateral esquerdo, na seção **Code and automation**, clique em **Branches**;
3. Ao lado de **Branch protection rules**, clique no botão **Add branch ruleset** ou **Add rule**;
4. No campo **Branch name pattern**, digite exatamente:
   ```text
   main
   ```
5. Marque as seguintes opções obrigatórias:
   - ✅ **Require a pull request before merging** (Exigir Pull Request antes do merge):
     - ✅ *Require approvals:* Selecione `1` aprovação mínima.
     - ✅ *Dismiss stale pull request approvals when new commits are pushed* (Descarta aprovações antigas ao receber novos commits).
     - ✅ *Require review from Code Owners* (Opcional, se houver CODEOWNERS).
   - ✅ **Require status checks to pass before merging** (Exigir aprovação do CI):
     - ✅ *Require branches to be up to date before merging*.
     - Na barra de pesquisa de status checks, selecione o job do GitHub Actions:
       - `Lint & Build Validation` (definido no `.github/workflows/ci.yml`).
   - ✅ **Require conversation resolution before merging** (Obriga a resolver todas as conversas/comentários de revisão).
   - ✅ **Do not allow bypassing the above settings** (Não permitir ignorar as regras — aplica as restrições inclusive para administradores e proprietários do repositório).
   - ✅ **Restrict who can push to matching branches** (Nenhum usuário pode dar `git push origin main` diretamente; apenas via merge de PR aprovado).
6. Clique em **Save changes** (ou **Create**).

---

### Método B: GitHub Repository Rulesets (Novo Padrão GitHub)

Se o repositório utilizar a funcionalidade moderna de **Rulesets**:
1. Acesse **Settings** > **Rules** > **Rulesets**;
2. Clique em **New ruleset** > **New branch ruleset**;
3. Nome: `Restringir Main e Exigir PR`;
4. Enforcement status: **Active**;
5. Target branches: **Include default branch** (`main`);
6. Marque as regras:
   - ✅ **Restrict creations** (impede recriar ou deletar a branch);
   - ✅ **Restrict updates** (impede push direto);
   - ✅ **Restrict deletions** (impede apagar a branch);
   - ✅ **Require a pull request before merging** (mínimo 1 aprovação);
   - ✅ **Require status checks to pass** (`Lint & Build Validation`);
   - ✅ **Block force pushes** (impede `git push --force`).
7. Clique em **Save changes**.

---

## 🛡️ 3. Regra de Segurança: Senhas e Credenciais

- **Nunca insira senhas reais no código**:
  O painel administrativo do Nickel Lanches valida o acesso de forma segura através da variável `VITE_ADMIN_PASSWORD` ou pelo hash criptográfico SHA-256 mestre.
- Nenhuma alteração que contenha senhas em texto puro deve ser aprovada em Pull Requests.
- As variáveis de ambiente de produção devem ser configuradas exclusivamente nas abas de Secrets do GitHub e no painel da plataforma de hospedagem (Vercel, Google Cloud, Firebase).

---

## 🔄 4. Fluxo de Trabalho do Desenvolvedor

Para enviar qualquer modificação ao repositório:

```bash
# 1. Garanta que está com a main atualizada
git checkout main
git pull origin main

# 2. Crie uma branch de funcionalidade ou correção
git checkout -b feature/minha-melhoria

# 3. Desenvolva, teste e confirme a integridade
npm run lint
npm run build

# 4. Commit e push na branch de funcionalidade (NUNCA na main)
git add .
git commit -m "feat(cardapio): adiciona novo item especial"
git push origin feature/minha-melhoria

# 5. Abra um Pull Request no GitHub apontando para a branch main
```

Após o Pull Request passar no CI e for revisado, realize o **Squash and Merge** ou **Rebase and Merge**.
