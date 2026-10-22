# Política de Segurança (Security Policy)

A equipe do **Nickel Lanches** leva a segurança do aplicativo, dos clientes e dos dados de pedidos muito a sério. Agradecemos à comunidade pelo apoio na manutenção de um ambiente seguro.

## Versões com Suporte (Supported Versions)

Apenas a versão ativa do branch principal recebe atualizações de segurança e correções ativas:

| Versão | Suportada          |
| ------- | ------------------ |
| 5.x.x (Atual) | :white_check_mark: |
| 4.x.x | :x:                |
| < 4.0 | :x:                |

---

## Reportando uma Vulnerabilidade (Reporting a Vulnerability)

Se você encontrou uma falha de segurança, vulnerabilidade em regras do Firestore ou exposição de credenciais:

1. **NÃO crie uma Issue pública.**
2. Envie um e-mail confidencial detalhando a vulnerabilidade para:
   - **Contato de Segurança:** `braian.kleber.camargo@gmail.com`
3. Inclua no relatório:
   - Descrição detalhada da vulnerabilidade encontrada;
   - Passos reproduzíveis (PoC - Proof of Concept) ou script/payload;
   - Impacto potencial estimado (ex: vazamento de dados, escalada de privilégios);
   - Sugestão de mitigação (se houver).

### Prazos e Resposta:
- **Primeira confirmação:** Em até **48 horas úteis**.
- **Análise e correção preliminar:** Em até **7 dias corridos**.
- **Publicação de patch / aviso:** Realizada após validação e deploy em produção.

---

## Boas Práticas de Segurança no Projeto

- **Proteção da Senha do Painel Administrativo:** A senha de administrador NUNCA deve ser exibida, commitada ou mencionada em texto claro no código, issues, PRs ou documentação. O acesso é validado de forma estrita via variável de ambiente privada (`VITE_ADMIN_PASSWORD`) ou verificação criptográfica SHA-256.
- **Proteção da Branch Principal (`main`):** É expressamente proibido fazer commits diretos (`git push origin main`) na branch principal. Qualquer alteração deve seguir o fluxo de Pull Request a partir de branch de funcionalidade (`feature/*`, `fix/*`) com aprovação e validação automatizada de CI.
- **Credenciais e Chaves de API:** Nenhuma chave secreta (como access tokens de pagamento ou chaves privadas do Firebase Admin) deve ser exposta no código client-side (`src/`).
- **Variáveis de Ambiente:** Utilize apenas variáveis prefixadas com `VITE_` que sejam seguras para exposição pública. Chaves sensíveis devem permanecer em `.env` local ou no servidor seguro.
- **Regras do Firestore:** O arquivo `firestore.rules` deve sempre validar se usuários autenticados têm permissão estrita para ler ou modificar dados sensíveis, impedindo que clientes comuns alterem status de pedidos ou preços arbitrariamente.

