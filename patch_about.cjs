const fs = require('fs');

let content = fs.readFileSync('src/App.tsx', 'utf8');

const oldAbout = `            <div className="mb-12">
              <h2 className="text-3xl md:text-5xl font-black text-[#4E2A84] mb-4 uppercase tracking-tighter">Nossa História</h2>
              <p className="text-stone-600 font-medium leading-relaxed md:text-lg">Tudo começou com uma paixão gigante por lanches de verdade. Na <NickelText /> Lanches, nós não fazemos apenas comida, nós construímos momentos. Acreditamos que um xis bem feito e um cachorro-quente no capricho podem transformar o seu dia.</p>
            </div>`;

const newAbout = `            <div className="mb-12 text-center md:text-left">
              <h2 className="text-4xl md:text-5xl font-black text-[#4E2A84] mb-6 uppercase tracking-tighter drop-shadow-sm">Muito Prazer, <NickelText />! 🍔✨</h2>
              
              <div className="bg-gradient-to-br from-[#FCF9F5] to-white p-6 md:p-8 rounded-[32px] border border-[#F2E8D5] shadow-sm mb-10">
                <p className="text-stone-700 font-medium leading-relaxed md:text-xl mb-4">
                  Sabe aquele lanche que abraça a gente por dentro? É exatamente isso que fazemos por aqui! Mais do que matar a sua fome, nossa missão é entregar uma explosão de sabor e alegria em cada mordida.
                </p>
                <p className="text-stone-600 font-medium leading-relaxed md:text-lg">
                  Nossa receita? Ingredientes fresquinhos, cuidado artesanal e muuuito carinho na chapa. Preparamos tudo como se fosse para a nossa própria família — e você, claro, já faz parte dela!
                </p>
              </div>

              {/* Videos */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="rounded-[32px] overflow-hidden shadow-lg border-4 border-[#F28B20] relative aspect-[3/4] md:aspect-square bg-stone-900 group">
                  <video 
                    autoPlay loop muted playsInline 
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  >
                    <source src="/videos/producaolanches.mp4" type="video/mp4" />
                  </video>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-6">
                    <span className="bg-[#F28B20] text-white text-[10px] font-bold px-3 py-1 rounded-full w-max mb-2 uppercase tracking-widest">Bastidores</span>
                    <h3 className="text-white font-black text-2xl drop-shadow-md leading-none">Nossa Produção 🧑‍🍳</h3>
                  </div>
                </div>
                
                <div className="rounded-[32px] overflow-hidden shadow-lg border-4 border-[#4E2A84] relative aspect-[3/4] md:aspect-square bg-stone-900 group">
                  <video 
                    autoPlay loop muted playsInline 
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  >
                    <source src="/videos/videoatrativo.mp4" type="video/mp4" />
                  </video>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-6">
                    <span className="bg-[#4E2A84] text-white text-[10px] font-bold px-3 py-1 rounded-full w-max mb-2 uppercase tracking-widest">Irresistível</span>
                    <h3 className="text-white font-black text-2xl drop-shadow-md leading-none">Puro Sabor 🤤</h3>
                  </div>
                </div>
              </div>
            </div>`;

content = content.replace(oldAbout, newAbout);
fs.writeFileSync('src/App.tsx', content);
