import { TransformationFactory } from '.'

export function identityTransform(): TransformationFactory {
  return ({ size }) => ({
    type: 'simplified',
    passForward(input) {
      return input
    },
    passBack(error) {
      return error
    },
    size,
  })
}
