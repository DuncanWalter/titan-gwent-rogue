import { TransformationFactory } from '.'
import { vector, rowZip, add, mapRow } from '../batchMath'
import { normal } from '../utils/gaussian'

type BiasSeeder = (inputSize: number) => (index: number) => number

export interface BiasConfig {
  learningRate: number
  inertia?: number
}

export interface BiasTransformProps {
  seeder?: BiasSeeder
  config: BiasConfig
}

const defaultSeed: BiasSeeder = size => () => normal() / Math.sqrt(size)

export function biasTransform({
  seeder = defaultSeed,
  config,
}: BiasTransformProps): TransformationFactory {
  return function biasFactory({ size, serializedContent }) {
    const initializer = seeder(size)
    const weights = serializedContent
      ? JSON.parse(serializedContent)
      : vector(size, initializer)
    let deltas = vector(size, () => 0)
    return {
      type: 'simplified',
      passForward(batch) {
        return rowZip(batch, weights, add)
      },
      passBack(error: number[]) {
        rowZip(deltas, error, add, deltas)
        return error
      },
      applyLearning() {
        const { learningRate, inertia = 0 } = config
        const dialation = 1 / (1 - inertia)
        const update = mapRow(deltas, x => (learningRate * x) / dialation)
        rowZip(weights, update, add, weights)
        mapRow(deltas, x => (x * (dialation - 1)) / dialation, deltas)
      },
      clean() {
        deltas = vector(size, () => 0)
      },
      serialize() {
        return JSON.stringify(weights)
      },
      size,
    }
  }
}
