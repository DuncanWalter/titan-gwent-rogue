/**
 * Signals are a form of synthetic, in-memory event used to manage interactions over time while also being simulatable.
 *
 *
 * Listeners to signals will be, as much as is possible, unordered. Signals are created, annotated, evaluated, and then executed.
 */

import { MultiMap } from '../utils/multi-map'

interface SignalFactory<Payload = unknown> {
  (payload: Payload): Signal<Payload>
}

interface Signal<Payload> {
  label: string
  type: SignalFactory<Payload>
  payload: Payload
}

interface SignalProcessor {
  push: <Payload>(
    signal: Signal<Payload>,
  ) => { signal: Signal<Payload>; processed: Promise<void> }
  addListener: <Payload>(
    type: SignalFactory<Payload>,
    callback: (signalContext: { payload: Payload }) => void | Promise<void>,
  ) => () => void
}

interface AnnotationResolver<Payload, Value> {
  (args: {
    payload: Payload
    values: Value[]
    resolveAnnotation: (annotation: SignalAnnotation<Payload, any>) => void
  }): unknown
}

interface SignalAnnotation<Payload, Value> {
  resolve: AnnotationResolver<Payload, Value>
}

interface SignalListenerArgs<Payload> {
  annotate: <Value>(
    annotation: SignalAnnotation<Payload, Value>,
    value: Value,
  ) => void
  hasAnnotation: (annotation: SignalAnnotation<any, any>) => boolean
  cancel: () => void
  next: () => void
  push: SignalProcessor['push']
  payload: Payload
}

interface SignalListener<Payload> {
  (args: SignalListenerArgs<Payload>): void
}

export function createSignalAnnotation<Payload, Value>(
  resolve: AnnotationResolver<Payload, Value>,
): SignalAnnotation<Payload, Value> {
  return { resolve }
}

export function createSignalProcessor(): SignalProcessor {
  const allListeners = new MultiMap<SignalFactory<any>, SignalListener<any>>()

  function addListener<Payload>(
    type: SignalFactory<Payload>,
    callback: SignalListener<Payload>,
  ) {
    allListeners.add(type, callback)

    return () => allListeners.remove(type, callback)
  }

  function push<Payload>(signal: Signal<Payload>) {
    const signalAnnotations = new MultiMap<
      SignalAnnotation<Payload, any>,
      any
    >()

    function annotate<Value>(
      annotation: SignalAnnotation<Payload, Value>,
      value: Value,
    ) {
      signalAnnotations.add(annotation, value)
    }

    function hasAnnotation(annotation: SignalAnnotation<any, any>) {
      return !!signalAnnotations.get(annotation).size
    }

    let i = 0
    let cancelled = false
    const listeners = Array.from(allListeners.get(signal.type))
    const listenerArgs: SignalListenerArgs<Payload> = {
      next: function next() {
        for (; !cancelled && i < listeners.length; ) {
          listeners[i++](listenerArgs)
        }
      },
      cancel: () => {
        cancelled = true
      },
      annotate,
      hasAnnotation,
      push,
      payload: signal.payload,
    }

    listenerArgs.next()

    function resolveAnnotation(annotation: SignalAnnotation<Payload, any>) {
      const values = signalAnnotations.get(annotation)
      if (values.size !== 0) {
        annotation.resolve({
          payload: signal.payload,
          values: Array.from(values),
          resolveAnnotation,
        })
        signalAnnotations.delete(annotation)
      }
    }

    for (const annotation of Array.from(signalAnnotations.keys())) {
      resolveAnnotation(annotation)
    }

    const foo: any = 1

    return foo
  }

  return {
    addListener,
    push,
  }
}

export function createSignalFactory<Payload>(
  label: string,
  defaultPayload: Payload,
) {
  return function createSignal(payload = defaultPayload) {
    return {
      label,
      type: createSignal,
      payload,
    }
  }
}
