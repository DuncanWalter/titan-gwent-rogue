import { Transformation, UniformTransformation } from '.'

function noop() {
  // no-op
}

export function regularize<H>(
  transform: Transformation<H, any>,
): UniformTransformation<H, any> {
  switch (transform.type) {
    case 'uniform': {
      return transform
    }
    case 'simplified': {
      const {
        serialize = () => 'null',
        applyLearning = noop,
        clean = noop,
        passForward,
        passBack,
        size,
      } = transform
      return {
        type: 'uniform',
        passForward(input, history) {
          const output = passForward(input)
          return {
            trace: { input, output, history },
            output,
          }
        },
        passBack(trace, error, handOff) {
          return handOff(
            trace.history,
            passBack(error, trace.input, trace.output),
          )
        },
        serialize,
        applyLearning,
        clean,
        size,
      }
    }
    default: {
      throw new Error(`Unrecognized transform definition type`)
    }
  }
}
