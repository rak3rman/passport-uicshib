<template>
  <div class="bg-white min-h-full flex flex-col lg:relative">
    <div class="flex-grow flex flex-col">
      <main class="flex-grow flex flex-col bg-white">
        <div class="flex-grow mx-auto max-w-7xl w-full flex flex-col px-4 sm:px-6 lg:px-8">
          <div class="flex-shrink-0 pt-10 sm:pt-16">
            <a href="/" class="inline-flex">
              <span class="sr-only">Workflow</span>
              <img class="h-12 w-auto" src="/uic_logo.png" alt="" />
            </a>
          </div>
          <div class="flex-shrink-0 my-auto py-16 sm:py-32">
            <p class="text-sm font-semibold text-red-600 uppercase tracking-wide">404 error</p>
            <h1 class="mt-2 text-4xl font-extrabold text-gray-900 tracking-tight sm:text-5xl">Page not found</h1>
            <p class="mt-2 text-base text-gray-500">Sorry, we couldn’t find the page you’re looking for.</p>
            <div class="mt-6">
              <a href="/" class="text-base font-medium text-red-600 hover:text-red-500">Go back home<span aria-hidden="true"> &rarr;</span></a>
            </div>
          </div>
        </div>
      </main>
      <footer class="flex-shrink-0 bg-gray-50">
        <div class="mx-auto max-w-7xl w-full px-4 py-16 sm:px-6 lg:px-8">
          <nav class="flex space-x-4">
            <a href="https://github.com/rak3rman/passport-uicshib" class="text-sm font-medium text-gray-500 hover:text-gray-600">passport-uicshib</a>
            <span class="inline-block border-l border-gray-300" aria-hidden="true" />
            <a href="https://engineering.uic.edu" class="text-sm font-medium text-gray-500 hover:text-gray-600">engineering.uic.edu</a>
          </nav>
        </div>
      </footer>
    </div>
    <div class="hidden lg:block lg:absolute lg:inset-y-0 lg:right-0 lg:w-1/2">
      <img class="absolute inset-0 h-full w-full object-cover" src="/uic_arc2.jpeg" alt="" />
    </div>
  </div>
</template>

