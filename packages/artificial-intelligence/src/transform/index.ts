/**
 * Transforms are the bread and butter of our NNs. In fact, a net is a thin
 * facade over the pipe transform, which composes other transforms together.
 * Most of the transforms are not so fancy- the dense, bias, sigmoid, and relu
 * transforms all do exactly what you'd expect. Additionally, we have the guard
 * transform which normalizes net inputs, the split transform which allows
 * multiple transforms to be run on a single input,
 * and a few other goodies for conciseness and performance.
 */

export type UniformTransformation<Hist, Trace = number[]> = {
  type: 'uniform'
  serialize(): string
  applyLearning(): void
  clean(): void
  passForward(
    input: number[],
    history: Hist,
  ): { output: number[]; trace: Trace }
  passBack(
    trace: Trace,
    error: number[],
    handOff: (trace: Hist, error: number[]) => void,
  ): void
  size: number
}

export type SimplifiedTransformation = {
  type: 'simplified'
  serialize?(): string
  applyLearning?(): void
  clean?(): void
  passForward(input: number[]): number[]
  passBack(error: number[], input: number[], output: number[]): number[]
  size: number
}

export type Transformation<H, T> =
  | UniformTransformation<H, T>
  | SimplifiedTransformation

export type TransformationFactory<
  T extends Transformation<any, any> = Transformation<unknown, unknown>
> = (context: { size: number; serializedContent?: string }) => T

export { biasTransform } from './bias'
export { denseTransform } from './dense'
export { dropoutTransform } from './dropout'
export { guardTransform } from './guard'
export { identityTransform } from './identity'
export { leakyReluTransform } from './leakyRelu'
export { logicalTransform } from './logical'
export { pipeTransform } from './pipe'
export { sharpTanhTransform } from './sharpTanh'
export { sigmoidTransform } from './sigmoid'
export { splitTransform } from './split'
export { swoopTransform } from './swoop'
