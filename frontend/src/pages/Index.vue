<template>
  <q-page class='flex flex-center'>
  </q-page>
</template>

<script>
import Nouns from './Game/decks/Codenames'
import Adjectives from './Game/decks/Adjectives'

export default {
  name: 'PageIndex',

  setup (initProps, setupContext) {
    const $router = setupContext.root.$router
    const noun = Nouns().drawOne()
    const adj = Adjectives().drawOne()
    const key = `${adj}-${noun}`.toLowerCase()
    $router.push({ name: 'game', params: { code: key } })
    return {}
  }
}
</script>
