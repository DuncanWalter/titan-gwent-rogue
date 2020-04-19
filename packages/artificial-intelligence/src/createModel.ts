import { NeuralNet } from './neural-net'
import { rowZip } from './batchMath'

export type ModelConfiguration = {
  batch(epoch: number): { input: number[]; output: number[] }[]
  error: {
    // value(target: number, prediction: number): number
    derivative(target: number, prediction: number): number
  }
}

// TODO: batch needs to be a train param
// TODO: train should configure the throttle
export function createModel(
  net: NeuralNet,
  { batch, error }: ModelConfiguration,
) {
  let epoch = 0
  let cancel = true

  return {
    cancelTraining() {
      cancel = true
    },
    async train(epochs: number, log: (epoch: number) => void) {
      if (!cancel) {
        console.error('model.train() called on model which is already training')
      } else {
        cancel = false
      }
      const finalEpoch = epoch + epochs
      let lastLoggedEpoch = -Infinity
      let lastLogTime = 0

      function trainEpoch() {
        epoch += 1
        net.passBatchBack(
          batch(epoch).map(({ input, output: target }) => {
            const { trace, output: prediction } = net.passForward(input)
            return {
              trace,
              error: rowZip(target, prediction, error.derivative),
            }
          }),
        )

        if (!cancel && epoch < finalEpoch) {
          setTimeout(trainEpoch, 0)
        } else {
          log(epoch)
          cancel = true
          return
        }
        if (epoch - lastLoggedEpoch < 10) {
          return
        }
        if (Date.now() - lastLogTime < 1000) {
          return
        }
        lastLoggedEpoch = epoch
        lastLogTime = Date.now()
        log(epoch)
      }

      while (!cancel) {
        await Promise.resolve(trainEpoch())
      }
    },
  }
}
