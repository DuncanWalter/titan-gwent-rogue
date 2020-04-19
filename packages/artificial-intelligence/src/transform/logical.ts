import { pipeTransform } from './pipe'
import { biasTransform, BiasConfig } from './bias'
import { denseTransform, DenseConfig } from './dense'
import { swoopTransform } from './swoop'
import { dropoutTransform, DropoutConfig } from './dropout'

export function logicalTransform({
  outputSize,
  trainingConfig,
}: {
  outputSize: number
  trainingConfig: DenseConfig & BiasConfig & DropoutConfig
}) {
  return pipeTransform(
    denseTransform({ outputSize, config: trainingConfig }),
    biasTransform({ config: trainingConfig }),
    swoopTransform(),
    dropoutTransform({ frequency: 0.5, totality: 1, config: trainingConfig }),
  )
}
