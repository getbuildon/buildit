import {
  getLoginAudienceFromDocument,
  loginPathForAudience,
} from "@/lib/auth/loginAudience"

export function postLogoutPath() {
  return loginPathForAudience(getLoginAudienceFromDocument() ?? "equipo")
}
