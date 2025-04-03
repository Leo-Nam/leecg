import { createStore } from 'vuex'
import createPersistedState from 'vuex-persistedstate'
import SecureLS from 'secure-ls'

import common from './modules/common'
import user from './modules/user'
import route from './modules/route'
import ai from './modules/ai'
import jabDongsani from './modules/jabDongsani'

const ls = new SecureLS({ isCompression: false }) // 브라우저의 로컬 스토리지에 암호화된 데이터 저장

export default createStore({
  plugins: [
    createPersistedState({
      paths: ['common', 'user', 'route', 'ai', 'jabDongsani'], // 새로고침 후에도 유지할 모듈
      storage: {
        getItem: (key) => ls.get(key),
        setItem: (key, value) => ls.set(key, value),
        removeItem: (key) => ls.remove(key)
      }
    })
  ],
  modules: {
    common,
    user,
    route,
    ai,
    jabDongsani,
  }
})
