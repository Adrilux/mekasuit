"use server"

import { z } from "zod"
import { headers } from "next/headers"
import { auth } from "@/lib/auth/better-auth-server-config"
import { requireSession } from "@/lib/auth/auth-session-helpers"
import { handleServerActionError, success } from "@/lib/errors/error-handler-server"

const schema = z.object({
  name: z.string().min(1, "Le nom est requis").max(100),
})

export async function actionUpdateProfile(input: unknown) {
  try {
    await requireSession()
    const { name } = schema.parse(input)

    await auth.api.updateUser({
      body: { name },
      headers: await headers(),
    })

    return success({})
  } catch (error) {
    return handleServerActionError(error)
  }
}
