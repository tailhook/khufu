import khufu from 'khufu-runtime'
import regeneratorRuntime from 'regenerator/runtime'

window.regeneratorRuntime = regeneratorRuntime

import {main} from './counter.khufu'

khufu(document.getElementById('app'), main())

if(module.hot) {
    module.hot.accept()
}
