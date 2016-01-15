export default function range(start, stop, step=1) {
    let x = []
    for(let i = start; i < stop; i += step) {
        x.push(i)
    }
    return x
}
