import Vue from 'vue'
import Router from 'vue-router'
import RealPosition from '@/components/RealPosition'
import HistoryPosition from '@/components/HistoryPosition'

Vue.use(Router)

export default new Router({
  routes: [
    {
      path: '/',
      name: 'RealPosition',
      component: RealPosition
    },
    {
      path: '/history',
      name: 'HistoryPosition',
      component: HistoryPosition
    }
  ]
})
