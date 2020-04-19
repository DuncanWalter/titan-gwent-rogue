import { createNeuralNet } from './neural-net'
import {
  denseTransform,
  guardTransform,
  logicalTransform,
  pipeTransform,
} from './transform'
import { rowZip } from './batchMath'
import { createModel } from './createModel'
const { random, floor } = Math

// Allow tests to run longer than
// the default 5000ms without calling
// the done function when async
jest.setTimeout(1000000)

// Numeric versions of all arity-2
// boolean functions for generating
// NN evaluation functions.
const not = (a: number) => 1 - a
const and = (a: number, b: number) => Math.sqrt(a * b)
const or = (a: number, b: number) => (a + b) / (1 + a * b)
const imp = (a: number, b: number) => or(not(a), b)
const nimp = (a: number, b: number) => not(imp(b, a))
const xor = (a: number, b: number) => or(a, b) - and(a, b)
const eq = (a: number, b: number) => not(xor(a, b))
const ops = [and, or, imp, nimp, xor, eq]

// Preserve a reasonable distribution
// of outputs in high-arity operations
// to enable more expressive evaluations
function sharpen(x: number) {
  const scale = Math.abs(2 * x - 1) ** 0.5
  return x > 0.5 ? scale : 1 - scale
}

// Generate a higher arity numeric
// operator to test the expressiveness
// and stability of neural nets
function createOperation(arity: number): (input: number[]) => number {
  if (arity === 1) {
    return (input: number[]) => input[0]
  }

  const op = ops[floor(random() * ops.length)]

  if (arity === 2) {
    return (input: number[]) => sharpen(op(input[0], input[1]))
  }

  const split = 1 + floor(random() * (arity - 1))
  const left = createOperation(split)
  const right = createOperation(arity - split)

  return (input: number[]) => {
    return sharpen(
      op(left(input.slice(0, split)), right(input.slice(split, arity))),
    )
  }
}

function mean(xs: number[]) {
  let sum = 0
  for (const x of xs) {
    sum += x
  }
  return sum / xs.length
}

test('Creating, training, and validating a model runs without crashing', done => {
  const arity = 3
  const samples = 32
  const operation = createOperation(arity)

  function sampleOperation() {
    return new Array(samples)
      .fill(null)
      .map(() => new Array(arity).fill(null).map(() => random()))
      .map(input => ({
        input,
        output: [operation(input)],
      }))
  }

  const validationData = sampleOperation()
  console.log(validationData.map(({ output: [error] }) => error))

  // A baseline random model for
  // evaluating model success.
  console.log(
    'Random:',
    `10e${Math.log10(
      mean(
        validationData
          .map(datum => datum.output[0])
          .map(x => Math.abs(random() - x)),
      ),
    ).toPrecision(3)}`,
  )

  const trainingConfig = {
    inertia: 0.92,
    learningRate: 0.02,
    training: true,
  }

  const net = createNeuralNet({
    inputSize: arity,
    transformation: pipeTransform(
      guardTransform(),
      // logicalTransform({ outputSize: 64, trainingConfig }),
      // logicalTransform({ outputSize: 64, trainingConfig }),
      // logicalTransform({ outputSize: 48, trainingConfig }),
      logicalTransform({ outputSize: 32, trainingConfig }),
      logicalTransform({ outputSize: 16, trainingConfig }),
      denseTransform({ outputSize: 1, config: trainingConfig }),
    ),
  })

  // const config = { learningRate: 0.02, inertia: 0.92 }
  const predict = (input: number[]) => net.passForward(input).output
  const model = createModel(net, {
    batch: sampleOperation,
    error: {
      // value: (target, prediction) => 0.5 * (target - prediction) ** 2,
      derivative: (target, prediction) => target - prediction,
    },
  })

  function validate(epoch: number) {
    trainingConfig.training = false
    console.log(
      `Epoch ${epoch} error: 10e${Math.log10(
        mean(
          rowZip(
            validationData.map(pair => pair.output),
            validationData.map(pair => pair.input).map(predict),
            (t, p) => rowZip(t, p, (ti, pi) => 0.5 * (ti - pi) ** 2),
          ).map(mean),
        ),
      ).toPrecision(3)}`,
    )
    trainingConfig.training = true
  }

  model.train(500, validate).then(done)
})
