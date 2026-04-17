import { createRouter, createWebHistory } from 'vue-router'
import DashboardView from '../views/DashboardView.vue'
import DealDetailView from '../views/DealDetailView.vue'
import { isValidDealId } from '../utils/security'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'dashboard',
      component: DashboardView,
      meta: { title: 'Dashboard' }
    },
    {
      path: '/deal/:id',
      name: 'deal-detail',
      component: DealDetailView,
      meta: { title: 'Deal Details' },
      beforeEnter(to) {
        const id = Array.isArray(to.params.id) ? to.params.id[0] : to.params.id
        if (!isValidDealId(id)) {
          return { name: 'dashboard' }
        }
      }
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: '/'
    }
  ]
})

export default router
