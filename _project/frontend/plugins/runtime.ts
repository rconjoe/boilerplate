/* eslint-disable @typescript-eslint/no-explicit-any */
import { makeApiLayers, initializeSync } from "@effect-app/vue"
import * as Layer from "effect/Layer"
import * as Runtime from "effect/Runtime"
import { Effect, HttpClient, Option } from "@/utils/prelude"
import { WebSdkLive } from "~/utils/observability"
import type { ApiConfig } from "@effect-app/prelude/client"
import { installFluentExtensions } from "@effect-app/fluent-extensions"

export const versionMatch = ref(true)

export const runtime = ref<ReturnType<typeof makeRuntime>>()

function makeRuntime(feVersion: string, isRemote: boolean) {
  const apiLayers = Layer.provideMerge(
    Layer.effect(
      HttpClient.Client,
      Effect.map(
        HttpClient.Client,
        HttpClient.tap(r =>
          Effect.sync(() => {
            const remoteFeVersion = r.headers["x-fe-version"]
            if (remoteFeVersion) {
              versionMatch.value = feVersion === remoteFeVersion
            }
          }),
        ),
      ),
    ),
    makeApiLayers({ apiUrl: "/api/api", headers: Option.none }),
  )

  const rt: {
    runtime: Runtime.Runtime<RT>
    clean: () => void
  } = initializeSync(
    // TODO: tracing when deployed
    isRemote
      ? apiLayers
      : apiLayers.pipe(
          Layer.merge(
            WebSdkLive({
              serviceName: "effect-app-boilerplate-frontend",
              serviceVersion: feVersion,
            }),
          ),
        ),
  )
  return {
    ...rt,
    runFork: Runtime.runFork(rt.runtime),
    runSync: Runtime.runSync(rt.runtime),
    runPromise: Runtime.runPromise(rt.runtime),
    runCallback: Runtime.runCallback(rt.runtime),
  }
}

// TODO: make sure the runtime provides these
export type RT = ApiConfig | HttpClient.Client.Default

export default defineNuxtPlugin(_ => {
  const config = useRuntimeConfig()
  runtime.value = makeRuntime(
    config.public.feVersion,
    config.public.env !== "local-dev",
  )
  installFluentExtensions(runtime.value!.runtime)
})
