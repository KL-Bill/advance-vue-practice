import { createRouter, createWebHistory } from 'vue-router'

import GameLab from '@/pages/GameLab.vue'
import Index from '@/pages/Index.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'home', component: Index },
    { path: '/game-lab', name: 'game-lab', component: GameLab },
  ],
})

export default router
