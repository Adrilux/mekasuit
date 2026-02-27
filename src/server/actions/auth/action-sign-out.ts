"use server"

import { auth } from "@/lib/auth/better-auth-server-config"
import { headers } from "next/headers"
import { handleServerActionError, success } from "@/lib/errors/error-handler-server"

export async function actionSignOut() {
  try {
    await auth.api.signOut({ headers: await headers() })
    return success(undefined)
  } catch (error) {
    return handleServerActionError(error)
  }
}
