const fs = require('fs');

let content = fs.readFileSync('src/components/HeroVideo.tsx', 'utf8');

const oldPromos = `  const promos = [
    {
      id: 1,
      image: "https://images.unsplash.com/photo-1550547660-d9450f859349?q=80&w=1200&auto=format&fit=crop",
      title: "Promoção Loucura",
      description: "4 X-Especiais por R$ 90 + Refri 2L Charrua"
    },
    {
      id: 2,
      image: "https://images.unsplash.com/photo-1576107232684-1279f390859f?q=80&w=1200&auto=format&fit=crop",
      title: "Promoção Fim de Mês",
      description: "Batata Frita com Maionese Caseira por R$ 6!"
    }
  ];`;

const newPromos = `  const promos = [
    {
      id: 1,
      image: "/images/comboloucura.jpg",
      title: "Promoção Loucura",
      description: "4 X-Especiais por R$ 90 + Refri 2L Charrua"
    },
    {
      id: 2,
      image: "https://images.unsplash.com/photo-1576107232684-1279f390859f?q=80&w=1200&auto=format&fit=crop",
      title: "Promoção Fim de Mês",
      description: "Batata Frita com Maionese Caseira por R$ 6!"
    },
    {
      id: 3,
      image: "/images/combinhocasal.jpg",
      title: "Combinho Casal",
      description: "O lanche perfeito para dividir com quem você ama!"
    }
  ];`;

content = content.replace(oldPromos, newPromos);
fs.writeFileSync('src/components/HeroVideo.tsx', content);
