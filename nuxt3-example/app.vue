<template>
  <div class="h-full">
    <NuxtLayout>
      <NuxtPage/>
    </NuxtLayout>
  </div>
</template>

<script>
export default {
  setup () {
    useHead({
      title: 'passport-uicshib',
      htmlAttrs: {
        lang: 'en',
        class: 'h-full'
      },
      bodyAttrs: {
        class: 'h-full'
      },
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { hid: 'description', name: 'description', content: 'A real-time status monitor for RAkerman services' },
        { name: 'og:description', content: 'A real-time status monitor for RAkerman services' },
        { name: 'og:site_name', content: 'RAkerman Status' },
        { name: 'og:title', content: 'RAkerman Status' },
        { name: 'og:type', content: 'website' },
        { name: 'og:url', content: 'https://status.rakerman.com/' },
        { name: 'og:image', content: 'https://status.rakerman.com/images/bg5.jpeg' },
        { name: 'author', content: 'Radison Akerman' },
        { name: 'publisher', content: 'Radison Akerman' }
      ],
      link: [
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
        { rel: 'stylesheet', href: '/css/custom.css' }
      ]
    })
  }
}
</script>
