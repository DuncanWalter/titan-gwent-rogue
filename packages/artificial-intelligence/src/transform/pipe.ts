import { TransformationFactory, Transformation } from '.'
import { identityTransform } from './identity'
import { regularize } from './regularize'
import '../utils/arrayScan'

export type PipeTrace<H> = {
  history: H
  transformations: unknown[]
}

export function pipeTransform<
  H,
  TFs extends TransformationFactory<Transformation<any, any>>[]
>(
  ...transformFactories: TFs
): TransformationFactory<Transformation<H, PipeTrace<H>>> {
  if (transformFactories.length === 0) {
    return identityTransform()
  }
  return function({
    size,
    serializedContent,
  }: {
    size: number
    serializedContent?: string
  }) {
    const content = serializedContent ? JSON.parse(serializedContent) : []
    const transformations = transformFactories.scan(
      ({ size }, transformFactory, i) => {
        return regularize(
          transformFactory({ size, serializedContent: content[i] }),
        )
      },
      { size },
    )
    return {
      type: 'uniform',
      passForward(input: number[], history) {
        const trace = {
          history,
          transformations: new Array(transformations.length),
        }
        let output = input
        for (let i = 0; i < transformations.length; i++) {
          const tuple = transformations[i].passForward(output, trace)
          trace.transformations[i] = tuple.trace
          output = tuple.output
        }
        return {
          trace,
          output,
        }
      },
      passBack(trace, error, handOff) {
        transformations.reduce<(trace: PipeTrace<H>, error: number[]) => void>(
          (acc, transformation, i) => (trace, error) =>
            transformation.passBack(trace.transformations[i], error, acc),
          (trace, error) => handOff(trace.history, error),
        )(trace, error)
      },
      applyLearning() {
        for (const transformation of transformations) {
          transformation.applyLearning()
        }
      },
      clean() {
        for (const transformation of transformations) {
          transformation.clean()
        }
      },
      serialize() {
        return JSON.stringify(
          transformations.map(transformation => {
            return transformation.serialize()
          }),
        )
      },
      size: transformations[transformations.length - 1].size,
    }
  }
}
