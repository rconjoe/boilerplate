<script setup lang="ts">
import { HelloWorldRsc } from "@effect-app-boilerplate/resources"
import { buildFormFromSchema } from "@effect-app/vue/form"
import { S } from "~/utils/prelude"

const helloWorldClient = clientFor(HelloWorldRsc)
const schema = S.struct({
  title: S.NonEmptyString255,
  name: S.NonEmptyString2k,
  age: S.NonNegativeInt,
  email: S.Email,
})

const state = ref<S.Schema.From<typeof schema>>({
  title: "",
  name: "",
  age: 0,
  email: "",
})

const form = buildFormFromSchema(schema, state, v =>
  Promise.resolve(confirm("submitting: " + JSON.stringify(v))),
)

// TODO
const [result, latestSuccess, execute] = useSafeQueryWithArg(
  helloWorldClient.get,
  () => ({
    echo: "Echo me at: " + new Date().getTime(),
  }),
)

onMounted(() => {
  const t = setInterval(() => execute().catch(console.error), 2000)
  return () => clearInterval(t)
})
</script>

<template>
  <div>
    Hi world!
    <v-form @submit.prevent="form.submit">
      <template v-for="(field, name) in form.fields" :key="name">
        <!-- TODO: field.type text, or via length, or is multiLine -->
        <!-- <TextArea
          v-if="field.type === 'text' && name === 'name'"
          rows="2"
          :label="name"
          placeholder="name, or company and next line: name"
          v-model="state[name]"
          :field="field"
        /> -->
        <TextField
          :label="name"
          :placeholder="name"
          v-model="state[name]"
          :field="field"
        />
      </template>
    </v-form>

    <div>
      <div v-if="result._tag === 'Initial' || result._tag === 'Loading'">
        Loading...
      </div>
      <div v-else>
        <pre
          v-if="latestSuccess"
          v-html="JSON.stringify(latestSuccess, undefined, 2)"
        />
        <pre
          v-if="result.current._tag === 'Left'"
          v-html="JSON.stringify(result.current.left, undefined, 2)"
        />
        <div v-if="result._tag === 'Refreshing'">Refreshing...</div>
      </div>
    </div>
  </div>
</template>
