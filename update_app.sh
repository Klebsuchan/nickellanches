#!/bin/bash
sed -i "s/import { createUserProfile/import { subscribeToProducts, subscribeToPromos, seedDatabase, createUserProfile/" src/App.tsx

# insert the state variables for menu items and discount codes
sed -i '/const \[showCookies/a\
  const [menuItems, setMenuItems] = useState<Product[]>([]);\
  const [discountCodes, setDiscountCodes] = useState<Record<string, number>>({});\
\
  useEffect(() => {\
    seedDatabase(MENU_ITEMS, DISCOUNT_CODES);\
    const unsubProducts = subscribeToProducts(setMenuItems);\
    const unsubPromos = subscribeToPromos((promos) => {\
      const codeMap = promos.reduce((acc, curr) => ({ ...acc, [curr.code]: curr.discount }), {});\
      setDiscountCodes(codeMap);\
    });\
    return () => {\
      unsubProducts();\
      unsubPromos();\
    };\
  }, []);\
' src/App.tsx

# replace MENU_ITEMS with menuItems
sed -i 's/MENU_ITEMS.map/menuItems.map/g' src/App.tsx
# replace DISCOUNT_CODES with discountCodes
sed -i 's/DISCOUNT_CODES\[/discountCodes\[/g' src/App.tsx

