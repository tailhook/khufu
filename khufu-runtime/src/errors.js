// Error subclassing from mozilla docs
export function SuppressedError(original) {
    let err = Error(`Suppresed error: ${ original }`)
    this.name = 'SuppressedError';
    this.message = err.message
    this.stack = err.stack
    this.original = original
}
SuppressedError.prototype = Object.create(Error.prototype)
SuppressedError.prototype.constructor = SuppressedError
