import { HttpMiddleware, HttpRouter, HttpServerResponse } from "@effect-app/infra/api/http"

export function serverHealth(version: string) {
  return HttpRouter.get(
    "/.well-known/local/server-health",
    HttpServerResponse.unsafeJson({ version }).pipe(HttpMiddleware.withLoggerDisabled)
  )
}
