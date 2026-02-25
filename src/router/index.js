import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'
import Search from '../views/Search.vue'
import MultiSearch from '../views/MultiSearch.vue'
import Favorites from '../views/Favorites.vue'
import History from '../views/History.vue'
import Settings from '../views/Settings.vue'
import Analytics from '../views/Analytics.vue'
import Compare from '../views/Compare.vue'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home
  },
  {
    path: '/search',
    name: 'Search',
    component: Search
  },
  {
    path: '/multi-search',
    name: 'MultiSearch',
    component: MultiSearch
  },
  {
    path: '/favorites',
    name: 'Favorites',
    component: Favorites
  },
  {
    path: '/history',
    name: 'History',
    component: History
  },
  {
    path: '/analytics',
    name: 'Analytics',
    component: Analytics
  },
  {
    path: '/compare',
    name: 'Compare',
    component: Compare
  },
  {
    path: '/settings',
    name: 'Settings',
    component: Settings
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
