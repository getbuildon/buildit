"use server"

import { cookies } from "next/headers"

import {
  LOGIN_AUDIENCE_COOKIE,
  type LoginAudience,
  isLoginAudience,
} from "@/lib/auth/loginAudience"

export async function getLoginAudience(): Promise<LoginAudience | null> {
  const store = await cookies()
  const value = store.get(LOGIN_AUDIENCE_COOKIE)?.value
  return isLoginAudience(value) ? value : null
}

export async function setLoginAudience(audience: LoginAudience) {
  const store = await cookies()
  store.set(LOGIN_AUDIENCE_COOKIE, audience, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
    httpOnly: false,
  })
}

export async function clearLoginAudience() {
  const store = await cookies()
  store.delete(LOGIN_AUDIENCE_COOKIE)
}
