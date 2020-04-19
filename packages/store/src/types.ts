import { Slice } from './slice'
import { StateSlice } from './createStore'

type Maybe<T> = T | null | undefined | false

export interface InternalPeek {
  <V>(wrapper: Slice<V> | Reducer<V, any>): V
}

export type Dispatchable = Maybe<Action | ActionList>

/**
 * Can be extended using declarations in order
 * to strongly type middleware which modifies the
 * call signature of dispatch.
 */
export interface RawDispatch {
  (action: Dispatchable): void
}

export interface InternalDispatch extends RawDispatch {
  <Result>(
    thunk: (dispatch: InternalDispatch, peek: InternalPeek) => Result,
  ): Result
}

export interface RawWrapReducer {
  <S>(reducer: Reducer<S, any>): StateSlice<S>
}

export interface WrapReducer {
  <S>(reducer: Reducer<S, any>): Slice<S>
}

export interface Action {
  type: string
  reducers: Reducer<any, any>[]
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface ActionList extends Array<Maybe<ActionList | Action>> {}

export interface Reducer<State = any, A extends Action = Action> {
  (state: State | undefined, action: A): State
}

export interface InternalStore {
  dispatch: InternalDispatch
  peek: InternalPeek
  wrapReducer: WrapReducer
}

export interface MiddlewareAPI {
  dispatch: RawDispatch
  peek: InternalPeek
  wrapReducer: RawWrapReducer
}

export type Middleware = (
  store: RawStore,
  middlewareAPI: MiddlewareAPI,
) => Partial<MiddlewareAPI>

export interface Network {
  enqueue(slice: Slice<any>): void
  propagate(): void
}

export interface RawStore extends InternalStore {
  dispatch: InternalDispatch
  peek: InternalPeek
  wrapReducer: RawWrapReducer
  slices: Map<Reducer<any>, StateSlice<any>>
  network: Network
}
