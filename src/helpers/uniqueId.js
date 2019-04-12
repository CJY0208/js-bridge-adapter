let uuid = 0

const uniqueId = (prefix = '') =>
  `${prefix}_${++uuid}_${Date.now()}_${Math.floor(Math.random() * 1000000)}`

export default uniqueId
