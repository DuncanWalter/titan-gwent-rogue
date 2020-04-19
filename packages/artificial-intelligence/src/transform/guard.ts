import { TransformationFactory } from '.'
import { vector, mapRow } from '../batchMath'

export function guardTransform(floor = 0, ceil = 1): TransformationFactory {
  return ({ size, serializedContent }) => {
    let min = vector(size, () => Infinity)
    let max = vector(size, () => -Infinity)
    if (serializedContent) {
      ;({ min, max } = JSON.parse(serializedContent))
    }
    let dMin = [...min]
    let dMax = [...max]
    return {
      type: 'simplified',
      passForward(inputRow: number[]): number[] {
        return mapRow(inputRow, (input, i) => {
          dMax[i] = Math.max(input, dMax[i])
          dMin[i] = Math.min(input, dMin[i])
          if (min[i] >= max[i]) {
            return Math.random() * (ceil - floor) + floor
          }
          return ((ceil - floor) * (input - min[i])) / (max[i] - min[i]) + floor
        })
      },
      passBack(error: number[], input: number[]): number[] {
        return mapRow(error, (e, i) => {
          if (input[i] === min[i] && e < 0) return 0
          if (input[i] === max[i] && e > 0) return 0
          return (e * (max[i] - min[i])) / (ceil - floor)
        })
      },
      applyLearning() {
        min = dMin
        max = dMax
        dMin = [...min]
        dMax = [...max]
      },
      clean() {
        dMin = [...min]
        dMax = [...max]
      },
      serialize(): string {
        return JSON.stringify({ min, max })
      },
      size,
    }
  }
}
