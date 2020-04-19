export class MultiMap<Key, Value> {
  _innerMap: Map<Key, Set<Value>>
  constructor() {
    this._innerMap = new Map<Key, Set<Value>>()
  }
  get(key: Key): Set<Value> {
    let innerSet = this._innerMap.get(key)
    if (!innerSet) {
      innerSet = new Set()
      this._innerMap.set(key, innerSet)
    }
    return innerSet
  }
  add(key: Key, value: Value) {
    this.get(key).add(value)
  }
  remove(key: Key, value: Value) {
    this.get(key).delete(value)
  }
  delete(key: Key) {
    this._innerMap.delete(key)
  }
  entries() {
    return this._innerMap.entries()
  }
  keys() {
    return this._innerMap.keys()
  }
  values() {
    return this._innerMap.values()
  }
}
