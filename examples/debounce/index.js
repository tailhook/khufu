import khufu from 'khufu-runtime'
import {main} from './text.khufu'
//import regeneratorRuntime from 'regenerator/runtime'
//import 'babel-polyfill'

//window.regeneratorRuntime = regeneratorRuntime

khufu(document.getElementById('app'), main)
