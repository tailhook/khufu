import khufu from 'khufu-runtime'
import {main} from './counter.khufu'

khufu(document.getElementById('app'), main)

if(module.hot) {
    module.hot.accept()
}
