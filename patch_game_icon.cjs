const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

// Replace Dog with Gamepad2 in imports
content = content.replace(
  "import { MessageCircle, Plus, Menu, Search, SlidersHorizontal, Bell, ShoppingCart, Star, ChefHat, LogOut, ArrowRight, Dog, Tag, Heart, Utensils, BookOpen, Flame, Info, Home, ShoppingBag, User, LayoutGrid, MoreVertical } from 'lucide-react';",
  "import { MessageCircle, Plus, Menu, Search, SlidersHorizontal, Bell, ShoppingCart, Star, ChefHat, LogOut, ArrowRight, Gamepad2, Tag, Heart, Utensils, BookOpen, Flame, Info, Home, ShoppingBag, User, LayoutGrid, MoreVertical } from 'lucide-react';"
);

// Replace <Dog ... /> with <Gamepad2 ... />
content = content.replace(/<Dog /g, '<Gamepad2 ');

fs.writeFileSync('src/App.tsx', content);
