const fs = require('fs');
let code = fs.readFileSync('src/components/DogGame.tsx', 'utf8');

const replacement = `{/* Animated Tracker Section */}
      {order && (
        <motion.div 
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="w-full bg-white border border-stone-200 rounded-3xl p-8 mb-8 shadow-sm relative overflow-hidden text-black"
        >
          <h3 className="font-display font-bold uppercase text-xl mb-12 text-center">Status da Missão</h3>

          <div className="relative flex justify-between items-center w-full max-w-3xl mx-auto px-4">
            
            {/* Animated Progress Line */}
            <div className="absolute top-1/2 left-0 w-full h-3 bg-zinc-100 border border-stone-200 -z-20 transform -translate-y-1/2 rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-yellow-400"
                initial={{ width: 0 }}
                animate={{ width: \`\${progress}%\` }}
                transition={{ ease: "linear" }}
              />
            </div>

            {/* Rocket tracking the line */}
            <motion.div
              className="absolute top-1/2 -z-10 text-4xl transform -translate-y-1/2"
              initial={{ left: '0%', x: '-50%' }}
              animate={{ left: \`\${progress}%\`, x: '-50%' }}
              transition={{ ease: "linear" }}
            >
              🚀
            </motion.div>

            <div className="flex flex-col items-center gap-2 bg-white px-2">
              <div className={\`w-12 h-12 rounded-full flex items-center justify-center transition-colors shadow-sm border \${progress >= 10 ? 'bg-yellow-400 border-black' : 'bg-zinc-100 border-stone-200 text-stone-400'}\`}>
                <Clock size={24} className={progress >= 10 ? 'text-black' : ''} />
              </div>
              <span className={\`text-xs font-bold uppercase \${progress >= 10 ? 'text-black' : 'text-stone-400'}\`}>Pendente</span>
            </div>

            <div className="flex flex-col items-center gap-2 bg-white px-2">
              <div className={\`w-12 h-12 rounded-full flex items-center justify-center transition-colors shadow-sm border \${progress >= 60 ? 'bg-yellow-400 border-black' : 'bg-zinc-100 border-stone-200 text-stone-400'}\`}>
                <Flame size={24} className={progress >= 60 ? 'text-black' : ''} />
              </div>
              <span className={\`text-xs font-bold uppercase \${progress >= 60 ? 'text-black' : 'text-stone-400'}\`}>Preparo</span>
            </div>

            <div className="flex flex-col items-center gap-2 bg-white px-2">
              <div className={\`w-12 h-12 rounded-full flex items-center justify-center transition-colors shadow-sm border \${progress >= 85 ? 'bg-yellow-400 border-black' : 'bg-zinc-100 border-stone-200 text-stone-400'}\`}>
                <Truck size={24} className={progress >= 85 ? 'text-black' : ''} />
              </div>
              <span className={\`text-xs font-bold uppercase \${progress >= 85 ? 'text-black' : 'text-stone-400'}\`}>A Caminho</span>
            </div>
            
            <div className="flex flex-col items-center gap-2 bg-white px-2">
              <div className={\`w-12 h-12 rounded-full flex items-center justify-center transition-colors shadow-sm border \${progress >= 100 ? 'bg-green-400 border-black' : 'bg-zinc-100 border-stone-200 text-stone-400'}\`}>
                <CheckCircle size={24} className={progress >= 100 ? 'text-black' : ''} />
              </div>
              <span className={\`text-xs font-bold uppercase \${progress >= 100 ? 'text-black' : 'text-stone-400'}\`}>Entregue</span>
            </div>
          </div>
          
          <div className="mt-8 text-center text-sm font-bold text-stone-500 bg-zinc-50 py-3 px-6 rounded-full inline-block border border-stone-200 shadow-inner">
            {orderStatus === 'pendente' && 'Recebemos seu pedido. Aguardando cozinha...'}
            {orderStatus === 'cozinha_confirmou' && 'A cozinha confirmou! Logo começa o preparo.'}
            {orderStatus === 'em_preparo' && 'Seu lanche está na chapa! 🍔🔥'}
            {orderStatus === 'a_caminho' && 'O entregador está a caminho. Prepare a campainha! 🛵'}
            {orderStatus === 'entregue' && 'Pedido Entregue! Bom apetite! 🎉'}
          </div>
        </motion.div>
      )}

      {/* Game Section (Always render) */}
      <div className="w-full bg-white border border-stone-200 rounded-3xl p-8 shadow-sm text-center relative overflow-hidden mb-8">
        <h3 className="font-display font-black uppercase text-2xl mb-2 text-[#4E2A84] tracking-tight">Dog voador</h3>
        <p className="text-stone-500 font-bold mb-8">{order ? 'Passe o tempo até seu pedido chegar!' : 'Divirta-se e bata seu recorde!'}</p>
        
        <div className="relative inline-block border-4 border-black rounded-3xl overflow-hidden shadow-[8px_8px_0px_#000]">
          <canvas 
            ref={canvasRef} 
            width={400} 
            height={600} 
            className="bg-sky-300 block max-w-full h-auto"
            style={{ touchAction: 'none' }}
          />
          
          <div className="absolute top-4 left-4 bg-white border-2 border-black rounded-xl px-4 py-2 font-display font-black text-2xl text-black shadow-[2px_2px_0px_#000]">
            {score}
          </div>

          {countdown !== null && !gameOver && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-20">
              <span className="text-8xl font-black text-white drop-shadow-[0_4px_4px_rgba(0,0,0,0.5)] animate-pulse">
                {countdown}
              </span>
            </div>
          )}

          {gameOver && (
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center p-6 z-30 animate-fade-in">
              <h3 className="text-4xl font-display font-black uppercase text-yellow-400 mb-2 drop-shadow-lg tracking-widest">Game Over!</h3>
              <p className="text-white text-xl font-bold mb-6">Você fez {score} pontos!</p>
              
              {order && progress >= 100 ? (
                <p className="text-green-400 font-bold text-xl uppercase mb-8">Pedido Entregue! Bom apetite!</p>
              ) : (
                <>
                  {order && <p className="mb-8 text-center max-w-xs font-bold text-xl text-white">Mas não se preocupe, seu pedido continua a caminho!</p>}
                  <div className="flex gap-4 flex-col sm:flex-row">
                    <button 
                      onClick={handleRestart}
                      className="px-8 py-3 bg-white border-2 border-black text-black rounded-xl font-bold uppercase tracking-wider hover:bg-yellow-400 shadow-[4px_4px_0px_#000] active:translate-y-1 active:shadow-[0px_0px_0px_#000] transition-all"
                    >
                      Tentar de Novo
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* Conditionally render Dev Button */}
      {order && !gameOver && (
        <button 
          onClick={onFinishOrder}
          className="mt-4 mb-8 px-8 py-3 bg-white border border-stone-200 text-black font-bold uppercase tracking-widest rounded-xl hover:bg-zinc-100 transition-all shadow-sm active:translate-y-1 active:shadow-none"
        >
          (Dev: Pular para "Entregue")
        </button>
      )}

      {/* Conditionally render Post Game Actions & Sections */}
      {order ? (
        <>
          {/* Ações Pós Jogo */}
          <div className="w-full max-w-2xl mt-4 flex flex-col sm:flex-row gap-4 mb-12">
            <button onClick={() => {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }} className="flex-1 bg-[#F28B20] text-white font-black uppercase tracking-widest py-4 rounded-2xl hover:bg-orange-500 transition-colors shadow-lg">
              Acompanhar Pedido
            </button>
            {onClose && (
              <button onClick={onClose} className="flex-1 bg-white border border-stone-200 text-stone-900 font-black uppercase tracking-widest py-4 rounded-2xl hover:bg-stone-50 transition-colors shadow-sm">
                Voltar ao Início
              </button>
            )}
          </div>

          {/* Entretenimento: Jornada e Cozinha */}
          <div className="w-full max-w-2xl bg-white border border-stone-200 rounded-3xl p-8 mb-12 shadow-sm text-left relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#F4EBF6] rounded-bl-full -z-10 opacity-50"></div>
            <h3 className="font-display font-black uppercase text-2xl mb-4 text-[#4E2A84] tracking-tight">Saiba um pouco mais sobre a nossa jornada</h3>
            <p className="text-stone-600 font-medium mb-6 leading-relaxed">Enquanto seu lanche está sendo preparado com todo carinho, que tal conhecer a história de quem faz a mágica acontecer? Nossa paixão por qualidade vem de longe.</p>
            
            {onViewAbout && (
              <button onClick={onViewAbout} className="text-[#F28B20] font-bold uppercase tracking-wider text-sm flex items-center gap-2 hover:gap-3 transition-all">
                Ler História Completa <span>&rarr;</span>
              </button>
            )}
          </div>

          <div className="w-full max-w-2xl bg-stone-900 text-white border border-stone-800 rounded-3xl p-8 mb-16 shadow-xl text-left relative overflow-hidden">
            <h3 className="font-display font-black uppercase text-2xl mb-6 text-[#F28B20] tracking-tight">Como é a nossa cozinha</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="bg-stone-800 rounded-2xl p-4 flex flex-col items-center justify-center text-center">
                <span className="text-4xl mb-3">🔥</span>
                <h4 className="font-bold text-sm mb-1 uppercase tracking-wider">Chapa a 200°C</h4>
                <p className="text-xs text-stone-400">Selando a carne no ponto certo</p>
              </div>
              <div className="bg-stone-800 rounded-2xl p-4 flex flex-col items-center justify-center text-center">
                <span className="text-4xl mb-3">🧼</span>
                <h4 className="font-bold text-sm mb-1 uppercase tracking-wider">Higiene Nível Ouro</h4>
                <p className="text-xs text-stone-400">Limpeza rigorosa e industrial</p>
              </div>
              <div className="bg-stone-800 rounded-2xl p-4 flex flex-col items-center justify-center text-center">
                <span className="text-4xl mb-3">🥬</span>
                <h4 className="font-bold text-sm mb-1 uppercase tracking-wider">Ingredientes Frescos</h4>
                <p className="text-xs text-stone-400">Selecionados todos os dias</p>
              </div>
              <div className="bg-stone-800 rounded-2xl p-4 flex flex-col items-center justify-center text-center">
                <span className="text-4xl mb-3">📦</span>
                <h4 className="font-bold text-sm mb-1 uppercase tracking-wider">Embalagem Térmica</h4>
                <p className="text-xs text-stone-400">O lanche chega quente e crocante</p>
              </div>
            </div>

            {/* Imagens da Cozinha */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6 mt-8">
              <img src="https://images.unsplash.com/photo-1583337130417-3346a1be7dee?q=80&w=600&auto=format&fit=crop" alt="Preparo cuidadoso" className="w-full h-32 object-cover rounded-xl shadow-md hover:scale-105 transition-transform duration-300" referrerPolicy="no-referrer" />
              <img src="https://images.unsplash.com/photo-1555939594-58d7cb561ad1?q=80&w=600&auto=format&fit=crop" alt="Chapa quente" className="w-full h-32 object-cover rounded-xl shadow-md hover:scale-105 transition-transform duration-300 hidden md:block" referrerPolicy="no-referrer" />
              <img src="https://images.unsplash.com/photo-1572656306390-40a9fc3899f7?q=80&w=600&auto=format&fit=crop" alt="Ingredientes frescos" className="w-full h-32 object-cover rounded-xl shadow-md hover:scale-105 transition-transform duration-300" referrerPolicy="no-referrer" />
            </div>

            <div className="bg-[#F28B20] text-stone-900 rounded-2xl p-6 text-center shadow-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/20 rounded-bl-full -z-10"></div>
              <h4 className="font-display font-black uppercase text-xl mb-2">Feito com muito carinho! ❤️</h4>
              <p className="text-sm font-bold opacity-90 leading-relaxed">
                Seu lanche está sendo preparado agora mesmo, com os melhores ingredientes.
                Nossa embalagem térmica especial garante que ele chegue fresquinho, quentinho e MUITO gostoso até você!
              </p>
            </div>
          </div>

          {/* Feedbacks de Clientes */}
          <div className="w-full max-w-2xl mb-16">
            <h3 className="font-display font-black uppercase text-2xl mb-6 text-[#4E2A84] tracking-tight text-center">O que dizem sobre nós</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-2 mb-3">
                  <div className="text-[#F28B20] text-sm">⭐⭐⭐⭐⭐</div>
                  <span className="text-stone-400 text-xs font-bold">Há 2 dias</span>
                </div>
                <p className="text-stone-700 text-sm italic mb-4">"Melhor lanche da cidade! Chegou super quente e o pão é incrivelmente macio. Recomendo de olhos fechados."</p>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-stone-200 flex items-center justify-center font-bold text-stone-500 text-xs">M</div>
                  <span className="font-bold text-stone-900 text-sm">Mariana Silva</span>
                </div>
              </div>
              
              <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-2 mb-3">
                  <div className="text-[#F28B20] text-sm">⭐⭐⭐⭐⭐</div>
                  <span className="text-stone-400 text-xs font-bold">Hoje</span>
                </div>
                <p className="text-stone-700 text-sm italic mb-4">"A batata frita chegou crocante, o que é um milagre no delivery! O molho verde é um espetáculo à parte."</p>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-stone-200 flex items-center justify-center font-bold text-stone-500 text-xs">R</div>
                  <span className="font-bold text-stone-900 text-sm">Rafael Costa</span>
                </div>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="w-full max-w-2xl flex justify-center mt-4 mb-16">
          {onClose && (
            <button onClick={onClose} className="px-8 py-4 bg-white border border-stone-200 text-stone-900 font-black uppercase tracking-widest rounded-2xl hover:bg-stone-50 transition-colors shadow-sm">
              Voltar ao Início
            </button>
          )}
        </div>
      )}
    </div>
  );
}`;

const startIndex = code.indexOf('{/* Animated Tracker Section */}');
const newCode = code.substring(0, startIndex) + replacement;

fs.writeFileSync('src/components/DogGame.tsx', newCode);
console.log('patched dog game');
