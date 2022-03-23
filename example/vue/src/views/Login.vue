<template>
  <div class="min-h-full flex">
    <div class="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:flex-none lg:px-20 xl:px-24">
      <div class="mx-auto w-full max-w-sm lg:w-96">
        <div>
          <img class="h-12 w-auto" src="/uic_logo.png" alt="Workflow" />
          <h2 class="mt-6 text-3xl font-extrabold text-gray-900">Sign in to your account</h2>
          <p class="mt-2 text-sm text-gray-600">
            Using Shibalike from
            {{ ' ' }}
            <a href="https://github.com/rak3rman/passport-uicshib" class="font-medium text-red-600 hover:text-red-500"> passport-uicshib </a>
          </p>
        </div>

        <div class="mt-8">
          <div class="mt-6">
            <form v-on:submit="login" class="space-y-6">
              <div>
                <label for="netid" class="block text-sm font-medium text-gray-700"> NetID </label>
                <div class="mt-1">
                  <input id="netid" name="netid" type="text" autocomplete="text" required="" class="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm" />
                </div>
              </div>

              <div class="space-y-1">
                <label for="password" class="block text-sm font-medium text-gray-700"> Password </label>
                <div class="mt-1">
                  <input id="password" name="password" type="password" autocomplete="current-password" required="" class="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm" />
                </div>
              </div>

              <div>
                <button type="submit" class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500">Sign in</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
    <div class="hidden lg:block relative w-0 flex-1">
      <img class="absolute inset-0 h-full w-full object-cover" src="/uic_arc1.jpeg" alt="" />
    </div>
  </div>
</template>
<script>
import axios from 'axios'
export default {
  name: 'Login',
  methods: {
    login: (e) => {
      e.preventDefault()
      let email = e.target.elements.netid.value
      let password = e.target.elements.password.value
      let login = () => {
        let data = {
          email: email,
          password: password
        }
        axios.post('/api/login', data)
            .then((response) => {
              console.log('Logged in')
              window.location.href = '/'
            })
            .catch((errors) => {
              console.log('Cannot log in')
            })
      }
      login()
    }
  }
}
</script>