import {main} from './counter.khufu'
import {patch} from 'incremental-dom'

patch(document.getElementById('app'), main)
