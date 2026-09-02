const fs = require('fs');
let content = fs.readFileSync('src/components/CheckoutModal.tsx', 'utf8');

content = content.replace(
  `                    </motion.div>
                  )}
                </div>`,
  `                    </motion.div>
                  )}
                  </AnimatePresence>
                </div>`
);

fs.writeFileSync('src/components/CheckoutModal.tsx', content);
