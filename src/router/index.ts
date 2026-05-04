import { createRouter, createWebHistory } from 'vue-router'
import DashboardView from '../views/DashboardView.vue'
import DealDetailView from '../views/DealDetailView.vue'
import { isValidDealId, ROLES } from '../utils/security'
import { fetchDealById } from '../api/dealService'
import { useDealStore } from '../stores/dealStore'

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

router.beforeEach(async (to) => {
  if (to.name !== 'deal-detail') return

  const store = useDealStore()
  if (store.currentRole !== ROLES.PARTNER) return

  const id = Array.isArray(to.params.id) ? to.params.id[0] : to.params.id
  if (!isValidDealId(id)) return { name: 'dashboard' }

  try {
    const deal = await fetchDealById(id)
    if (!deal || deal.assignedTo !== store.currentPartnerId) {
      return { name: 'dashboard' }
    }
  } catch {
    return { name: 'dashboard' }
  }
})

export default router
