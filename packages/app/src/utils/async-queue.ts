type Resolved<T> = T extends Promise<infer I> ? I : T

interface QueuedTask<T = unknown> {
  task: () => T
  resolve: (result: T) => void
  reject: (err: unknown) => void
}

export function createAsyncQueue() {
  let running = null as null | Promise<void>
  const queue = [] as QueuedTask<any>[]

  async function runQueue() {
    while (queue.length) {
      const { task, resolve, reject } = queue.shift()!
      const result = task()
      try {
        resolve(result instanceof Promise ? await result : result)
      } catch (err) {
        reject(err)
      }
    }
    running = null
  }

  return {
    async enqueue<R>(task: () => R): Promise<Resolved<R>> {
      const promise = new Promise<Resolved<R>>((resolve, reject) => {
        queue.push({ task, resolve, reject })
      })
      runQueue()
      return promise
    },
    runQueue() {
      if (!running) {
        running = runQueue()
      }
      return running
    },
  }
}
