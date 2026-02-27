// Forme standardisée des réponses des Server Actions
// Toujours { success: true, data } ou { success: false, error, code }

export type ActionSuccess<T = void> = {
  success: true
  data: T extends void ? undefined : T
}

export type ActionError = {
  success: false
  error: string
  code: string
}

export type ActionResult<T = void> = ActionSuccess<T> | ActionError
