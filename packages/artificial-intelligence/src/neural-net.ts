import { mapRow } from './batchMath'
import { TransformationFactory } from './transform'
import { regularize } from './transform/regularize'

export interface NeuralNet {
  passForward: (input: number[]) => { output: number[]; trace: unknown }
  passBack: (trace: unknown, error: number[]) => number[]
  passBatchBack: (batch: Array<{ trace: unknown; error: number[] }>) => void
  serialize: () => string
  clean: () => void
  clone: (config?: { transformation?: TransformationFactory }) => NeuralNet
  outputSize: number
  inputSize: number
}

export function createNeuralNet(config: {
  inputSize: number
  serializedContent?: string
  transformation: TransformationFactory
}): NeuralNet {
  const transform = regularize(
    config.transformation({
      size: config.inputSize,
      serializedContent: config.serializedContent,
    }),
  )

  function passForward(input: number[]): { output: number[]; trace: unknown } {
    return transform.passForward(input, null)
  }

  function passBack(trace: unknown, error: number[]) {
    let inputError: undefined | number[]
    transform.passBack(trace, error, (_, result) => {
      inputError = result
    })
    if (!inputError) {
      throw new Error('Backprop did not finish')
    }
    return inputError
  }

  function passBatchBack(batch: { trace: any; error: number[] }[]) {
    for (const { trace, error } of batch) {
      passBack(trace, mapRow(error, e => e / batch.length))
    }
    transform.applyLearning()
  }

  function serialize(): string {
    return transform.serialize()
  }

  function clean(): void {
    transform.clean()
  }

  function clone(newConfig: { transformation?: TransformationFactory } = {}) {
    return createNeuralNet({
      transformation: newConfig.transformation || config.transformation,
      serializedContent: serialize(),
      inputSize: config.inputSize,
    })
  }

  return {
    passForward,
    passBack,
    passBatchBack,
    serialize,
    clean,
    clone,
    outputSize: transform.size,
    inputSize: config.inputSize,
  }
}
