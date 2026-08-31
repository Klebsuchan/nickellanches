const fs = require('fs');

let content = fs.readFileSync('src/components/AppetiteVideo.tsx', 'utf8');

const oldLogoBox = `<motion.div 
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="absolute top-0 left-4 sm:left-6 z-10 bg-white rounded-br-[32px] md:rounded-br-[48px] pt-4 pl-4 pr-6 pb-6 md:pt-6 md:pl-6 md:pr-10 md:pb-10 flex flex-col items-center justify-center"
         >
            <img src="/logo.png" alt="Nickel Lanches" className="w-28 sm:w-36 md:w-48 h-auto object-contain drop-shadow-sm" />
            
            {/* SVG Smooth Curve Right */}
            <svg className="absolute top-0 -right-[24px] md:-right-[32px] w-[24px] h-[24px] md:w-[32px] md:h-[32px] text-white fill-current pointer-events-none" viewBox="0 0 32 32">
               <path d="M0 0 H32 A32 32 0 0 0 0 32 V0 Z" />
            </svg>
            
            {/* SVG Smooth Curve Bottom */}
            <svg className="absolute -bottom-[24px] md:-bottom-[32px] left-0 w-[24px] h-[24px] md:w-[32px] md:h-[32px] text-white fill-current pointer-events-none" viewBox="0 0 32 32">
               <path d="M0 0 H32 A32 32 0 0 0 0 32 V0 Z" />
            </svg>
         </motion.div>`;

const newLogoBox = `<motion.div 
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="absolute top-0 left-4 sm:left-6 z-10 bg-white rounded-br-[16px] sm:rounded-br-[32px] md:rounded-br-[48px] p-2 pr-3 pb-3 sm:pt-4 sm:pl-4 sm:pr-6 sm:pb-6 md:pt-6 md:pl-6 md:pr-10 md:pb-10 flex flex-col items-center justify-center"
         >
            <img src="/logo.png" alt="Nickel Lanches" className="w-16 sm:w-28 md:w-48 h-auto object-contain drop-shadow-sm" />
            
            {/* SVG Smooth Curve Right */}
            <svg className="absolute top-0 -right-[12px] sm:-right-[24px] md:-right-[32px] w-[12px] h-[12px] sm:w-[24px] sm:h-[24px] md:w-[32px] md:h-[32px] text-white fill-current pointer-events-none" viewBox="0 0 32 32">
               <path d="M0 0 H32 A32 32 0 0 0 0 32 V0 Z" />
            </svg>
            
            {/* SVG Smooth Curve Bottom */}
            <svg className="absolute -bottom-[12px] sm:-bottom-[24px] md:-bottom-[32px] left-0 w-[12px] h-[12px] sm:w-[24px] sm:h-[24px] md:w-[32px] md:h-[32px] text-white fill-current pointer-events-none" viewBox="0 0 32 32">
               <path d="M0 0 H32 A32 32 0 0 0 0 32 V0 Z" />
            </svg>
         </motion.div>`;

content = content.replace(oldLogoBox, newLogoBox);
fs.writeFileSync('src/components/AppetiteVideo.tsx', content);
console.log('Fixed AppetiteVideo mobile size');
