import Login from './views/Login.vue'
import Dashboard from './views/Dashboard.vue'
import NotFound from './views/NotFound.vue'

/** @type {import('vue-router').RouterOptions['routes']} */
export const routes = [
  { path: '/login', component: Login, meta: { title: 'Login' } },
  { path: '/', component: Dashboard, meta: { title: 'Dashboard' } },
  { path: '/:path(.*)', component: NotFound },
]
