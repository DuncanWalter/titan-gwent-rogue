import React from 'react'
import { render } from 'react-dom'
import {
  Provider,
  createPersistMiddleware,
  createDraftStateMiddleware,
} from 'store'

import { App } from './app'

const anchorElement = document.getElementById('anchor')

if (anchorElement) {
  render(
    <Provider
      configureStore={createStore => {
        if (process.env.NODE_ENV === 'development') {
          return createStore(
            createPersistMiddleware(),
            createDraftStateMiddleware(),
          )
        } else {
          return createStore(createDraftStateMiddleware())
        }
      }}
    >
      <App />
    </Provider>,
    anchorElement,
  )
} else {
  console.error('No anchor element provided')
}
