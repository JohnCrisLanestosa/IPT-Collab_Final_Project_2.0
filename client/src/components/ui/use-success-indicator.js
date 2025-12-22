// Success indicator hook - similar to toast but for center screen display
import * as React from "react"

const SUCCESS_INDICATOR_DURATION = 2000 // 2 seconds

const actionTypes = {
  SHOW_SUCCESS: "SHOW_SUCCESS",
  HIDE_SUCCESS: "HIDE_SUCCESS",
}

let count = 0

function genId() {
  count = (count + 1) % Number.MAX_SAFE_INTEGER
  return count.toString();
}

let timeoutId = null

const listeners = []

let memoryState = { isVisible: false, message: "" }

function dispatch(action) {
  memoryState = reducer(memoryState, action)
  listeners.forEach((listener) => {
    listener(memoryState)
  })
}

function reducer(state, action) {
  switch (action.type) {
    case "SHOW_SUCCESS":
      // Clear any existing timeout
      if (timeoutId) {
        clearTimeout(timeoutId)
        timeoutId = null
      }
      
      // Set new timeout to auto-hide
      timeoutId = setTimeout(() => {
        dispatch({ type: "HIDE_SUCCESS" })
      }, SUCCESS_INDICATOR_DURATION)
      
      return {
        ...state,
        isVisible: true,
        message: action.message || "Product is added to cart",
      }

    case "HIDE_SUCCESS":
      if (timeoutId) {
        clearTimeout(timeoutId)
        timeoutId = null
      }
      return {
        ...state,
        isVisible: false,
        message: "",
      }

    default:
      return state
  }
}

function showSuccess(message) {
  dispatch({
    type: "SHOW_SUCCESS",
    message: message || "Product is added to cart",
  })
}

function hideSuccess() {
  dispatch({ type: "HIDE_SUCCESS" })
}

function useSuccessIndicator() {
  const [state, setState] = React.useState(memoryState)

  React.useEffect(() => {
    listeners.push(setState)
    return () => {
      const index = listeners.indexOf(setState)
      if (index > -1) {
        listeners.splice(index, 1)
      }
    };
  }, [state])

  return {
    ...state,
    showSuccess,
    hideSuccess,
  };
}

export { useSuccessIndicator, showSuccess, hideSuccess }

