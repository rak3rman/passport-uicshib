Passport-UICShib
===============

> Project is in active development where the master branch may be unstable. Head over to Releases in Github or use npm to snag a stable copy of passport-uicshib. Thanks!

Forked from [passport-uwshib](https://github.com/drstearns/passport-uwshib) by Dave Stearns

Passport authentication strategy that works with the University of Illinois Chicago's Shibboleth single-sign on service. This uses the fabulous [passport-saml](https://github.com/bergie/passport-saml) module for all the heavy lifting, but sets all the default options so that it works properly with the UIC Shibboleth Identity Provider (IdP).

Note that in order to use the UIC IdP for authentication, **you must [register your server](https://itrust.illinois.edu/federationregistry) with the UI I-Trust Federation Registry as a Service Provider**. During the registration process, under Advanced SAML 2 Registration, this package only requires the `Assertion Consuming Service (Post)` attribute to be defined as `https://test.uic.edu/login/callback`, with respect to your subdomain.

While registering, you must also specify which user profile attributes you want. See [https://shibtest.uic.edu/test](https://shibtest.uic.edu/test/) for all available profile attributes (you must be logged in). All possible attributes are included with the library, so whatever attributes are passed from Identity Provider will be accessible through the req.user object.

## Installation

    npm install passport-uicshib

## Usage

There is a fully-working example server script in [/example/server.js](https://github.com/rak3rman/passport-uicshib/blob/master/example/server.js), and an associated [package.json](ttps://github.com/rak3rman/passport-uicshib/blob/master/example/package.json), which you can use to install all the necessary packages to make the example script run (express, express middleware, passport, etc.).
If you are starting a new project and like how the `/example` folder is organized, feel free to copy that directory and plop it into your repository.

This module provides a Strategy for the [Passport](http://passportjs.org/) framework, which is typically used with [Express](http://expressjs.com/). Thus, there are several modules you need to require in your server script in addition to this module. All of these recommended modules are included with the example script.

### Command line

The example script then gets the server's domain name and application secret from an environment variable. This allows you to run the example script without modification. Simply export a value for `DOMAIN` and `SECRET` and run the script. You can also override the default SHIBALIKE, HTTP, and HTTPS configurations if you wish by specifying `SHIBALIKE`, `HTTPPORT` and/or `HTTPSPORT` environment variables.

    export DOMAIN=test.uic.edu SECRET=CHANGE_TO_RANDOM_STRING
    node server.js

### PM2

The example script is also ready to go with **pm2**. Modify the values defined in `/example/ecosystem.config.js` and pm2 will use them automatically on startup. By default, pm2 will watch for file changes and restart the application if needed.

    {
        name: "passport-uicshib",
        script: "server.js",
        watch: true,
        ignore_watch : ["node_modules", "vue"],
        env: {
            "DOMAIN": "test.uic.edu",            // domain that we are serving the application from
            "SHIBALIKE": false,                  // use shibalike? uses passport-local instead of Shibboleth
            "SECRET": "CHANGE_TO_RANDOM_STRING", // application secret, should be updated with a random string
            "HTTPPORT": 3010,                    // http port we are listening on
            "HTTPSPORT": 3011                    // https port we are listening on
        }
    }

Once the env variables are set to your liking, start the pm2 process using:

    pm2 start ecosystem.config.js --env env

If you change the configuration in `/example/ecosystem.config.js`, you must delete the process using `pm2 delete passport-uicshib` and start it again using the command above.

### Routes

The following routes are provided by default in `example/server.js`. 
Adjust these as needed to conform with your UI I-Trust Service Provider configuration.
Routes are used on the backend only with both Shibalike and the Shibboleth SSO.

    const preAuthUrl = ''; // appended to beginning of authentication routes, optional, ex: '/shibboleth'
    const loginUrl = '/api/login'; // where we will redirect if the user is not logged in
    const loginCallbackUrl = '/api/login/callback'; // where shibboleth should redirect upon successful auth
    const logoutUrl = '/api/logout'; // url endpoint that will log a user out
    const userUrl = '/api/user'; // url endpoint that will return user details

## Shibalike (development)

Trying to authenticate through the Shibboleth SSO on your local machine is extremely difficult and impractical.
Shibalike imitates the Shibboleth SSO using passport-local and dummy metadata passed along into the user object.
You can choose to enable Shibalike in the env configuration, and the example script will flip all settings to act like Shibboleth.
Once the dummy user is authenticated, the application should act exactly as if the user was authenticated through Shibboleth.

**A couple important notes in `example/server.js`**

- Activated if the env variable in command line or pm2 is `SHIBALIKE=true`
- Uses passport-local with a modified object of user attributes
- Dummy users are stored in `shibalike-users.json` with all associated attributes
  - Users can log in on `/login` with their NetID (user.uid) and the static password "pass" (ex. NetID: "jdoe", Password: "pass")
  - Users are then redirected to `/` with a fancy print out of all attributes
- Only listens for **http** requests on the defined port, not **https**

## Shibboleth SSO (production)

If Shibalike is disabled, the full functionality of passport-uicshib will be enabled. 
If a user tries to access a secured route, they will be redirected to `/login` then to Shibboleth's login page using SAML.
Once the user is authenticated on Shibboleth's end, they will be redirected to `/login/callback` along with the user metadata.
Now the user is authenticated as far as the application is aware. This method will only work on production servers that are registered with the UI I-Trust Federation Registry as a Service Provider.

**A couple important notes in `example/server.js`**

- Activated if the env variable in command line or pm2 is `SHIBALIKE=false` (is default)
- Leverages passport-saml and passport-uicshib
- User data is retrieved from the Shibboleth SSO on callback 
    - Unauthenticated users are redirected to `/login` then to Shibboleth, returns to the application on the callback route
    - Users are then redirected to `/` with a fancy print out of all attributes
- Listens for requests on **https**, all **http** requests are redirected to **https**
  - A public certificate `publicCert` and private key `privateKey` are required to secure traffic
    - Certs/keys should match those defined in the Shibboleth Identity Provider configuration
    - Expected to be in a security folder at `../../security` from the location of `server.js` by default in pem format

## Vue.js frontend

A sample Vue.js project is provided to help users authenticate with Shibalike.
This frontend was based on the [Vite + Vue 3 + Tailwinds CSS Starter Template](https://github.com/web2033/vite-vue3-tailwind-starter).
In the `example` folder, the Vite project is ready-to-go in both a development sense using `npm run dev` and compiled for production using `npm run build`.

### Development

Start the **Node.js backend** and watch for changes on default port **3010**

    cd example    
    pm2 start ecosystem.config.js --env env

Start the **Vue.js frontend** and watch for changes on default port **3000**

    cd vue
    npm run dev

### Production

Build the **Vue.js frontend** into the `example/vue/dist` folder

    cd example/vue
    npm run build

Start the **Node.js backend** and watch for changes on default port **3010**

    cd ..    
    pm2 start ecosystem.config.js --env env

