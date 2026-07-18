<div align="center">
  <img src="public/logonickel.png" alt="Nickel Lanches Logo" width="200" />
  <h1>🚀 Nickel Lanches</h1>
  <p><b>Uma lancheria intergaláctica com experiência gamificada e temática arcade!</b></p>
  <p>
    <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React" />
    <img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
    <img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind" />
    <img src="https://img.shields.io/badge/Firebase-FFCA28?style=for-the-badge&logo=firebase&logoColor=white" alt="Firebase" />
  </p>
</div>

---

## 🌭 O que é o Nickel Lanches?

**Nickel Lanches** não é apenas um sistema de delivery, é uma experiência! Criado com a temática de fliperama/arcade e história em quadrinhos, o projeto transforma o ato de pedir comida em um verdadeiro jogo. 

Com sede (fictícia) em Passo Fundo, a lancheria do *Cachorro Sideral* oferece um cardápio recheado, sistema de níveis de fidelidade baseados em XP (Experiência), mini-games e easter eggs escondidos pela interface!

## ✨ Funcionalidades Incríveis

- 🛒 **Carrinho Dinâmico & Personalização:** Adicione lanches, escolha ingredientes extras (Bacon, Cheddar, etc.) e deixe observações personalizadas.
- 🎮 **Mini-Game Embutido:** A espera pela entrega nunca foi tão divertida! Jogue um *runner* no estilo dinossauro do Chrome com o mascote Doguinho Sideral enquanto acompanha a barra de progresso animada do seu pedido.
- 🏆 **Sistema de XP e Patentes:** Cada lanche vale pontos de experiência (XP). Suba no ranking da galera e alcance títulos como *Mestre da Maionese* ou *Lenda Galáctica*.
- 🔊 **Efeitos Sonoros Retrô:** Áudio em 8-bits gerado via Web Audio API para simular a sensação de estar em um verdadeiro fliperama dos anos 90.
- ❤️ **Favoritos & "Pedir Novamente":** Salve seus lanches favoritos com um clique e repita pedidos do seu histórico com facilidade.
- 🎟️ **Cupons de Desconto:** Suporte a cupons secretos (`NICKEL10`, `PRIMEIRAVIAGEM`, `DIADOBACON`).
- 🔐 **Autenticação & Banco de Dados:** Login social com o Google e persistência de dados em tempo real utilizando Firebase Authentication e Firestore.
- 🕹️ **Easter Eggs Escondidos:** Explore a interface para encontrar segredos (Dica: tente clicar várias vezes na logo inicial!).

## 🛠️ Tecnologias Utilizadas

- **Frontend:** React 18, Vite, TypeScript
- **Estilização:** Tailwind CSS, Framer Motion (Animações fluidas)
- **Ícones:** Lucide React
- **Backend/BaaS:** Firebase (Auth, Firestore)
- **Áudio:** Web Audio API nativa
- **Deploy/Infra:** Pronto para rodar em containers (Docker/Cloud Run)

## 🚀 Como Rodar o Projeto

### Pré-requisitos
- Node.js (v18 ou superior)
- Conta no [Firebase](https://firebase.google.com/) com um projeto criado.

### 1. Clonar o repositório

```bash
git clone https://github.com/seu-usuario/nickel-lanches.git
cd nickel-lanches
```

### 2. Configurar Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto com as credenciais do seu Firebase:

```env
VITE_FIREBASE_API_KEY=sua_api_key
VITE_FIREBASE_AUTH_DOMAIN=seu_auth_domain
VITE_FIREBASE_PROJECT_ID=seu_project_id
VITE_FIREBASE_STORAGE_BUCKET=seu_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=seu_messaging_sender_id
VITE_FIREBASE_APP_ID=seu_app_id
```

> **Atenção:** Certifique-se de habilitar a autenticação pelo provedor **Google** e instanciar o **Firestore Database** no console do Firebase.

### 3. Instalar Dependências e Iniciar

```bash
npm install
npm run dev
```

A aplicação estará rodando localmente, geralmente na porta `3000` ou `5173`.

## 📂 Estrutura Principal

```
/src
 ├── /components     # Componentes de UI (Sidebar, DogGame, Modals, Toast)
 ├── /lib            # Integrações de serviços (firebase.ts, db.ts, audio.ts)
 ├── App.tsx         # Arquivo principal, roteamento de telas (Menu, Game, Admin)
 ├── data.ts         # Dados estáticos, cardápio, cupons e ranks
 ├── types.ts        # Interfaces e tipos globais do TypeScript
 └── index.css       # Diretivas do Tailwind e variáveis CSS
```

## 👾 Sobre o Mini-Game

O jogo **Cachorro Sideral Runner** foi construído utilizando apenas a API de Canvas do HTML5 `ctx.fillRect()` / `ctx.fillText()` e um loop de animação com `requestAnimationFrame`. Não depende de bibliotecas pesadas de jogos, mantendo a aplicação leve e reativa.

## 🤝 Contribuindo

Pull requests são sempre bem-vindos! Se você tem uma ideia de lanche, um cupom maluco ou um efeito visual novo, sinta-se à vontade para contribuir:

1. Faça um Fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/SuperHamburguer`)
3. Commit suas mudanças (`git commit -m 'Adiciona novo Super Hambúrguer'`)
4. Faça o push para a branch (`git push origin feature/SuperHamburguer`)
5. Abra um Pull Request

## 📝 Licença

Desenvolvido para fins de estudo e portfólio. Este projeto é de código aberto sob a licença [MIT](https://opensource.org/licenses/MIT).

---
<p align="center"> Feito com 💛, muito Bacon e JavaScript! </p>
