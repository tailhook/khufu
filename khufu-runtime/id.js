let counter = 0;

export function id(state=null, _) {
    if(state == null) {
        return 'khufu_id_' + (counter++);
    } else {
        return state
    }
}
