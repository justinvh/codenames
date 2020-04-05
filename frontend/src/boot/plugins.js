import VueCompositionApi from '@vue/composition-api'
import VueQrcode from '@chenfengyuan/vue-qrcode'
import PortalVue from 'portal-vue'

export default async ({ Vue }) => {
  Vue.use(VueCompositionApi)
  Vue.use(PortalVue)
  Vue.component(VueQrcode.name, VueQrcode)
}
