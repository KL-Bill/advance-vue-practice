import { createRouter, createWebHistory } from 'vue-router'

import Index from '@/pages/Index.vue'
import MyArena from '@/pages/MyArena.vue'
import MyWorld from '@/pages/MyWorld.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'home', component: Index },
    { path: '/my-game', name: 'my-game', component: MyWorld },
    { path: '/my-arena', name: 'my-arena', component: MyArena },
  ],
})

export default router
