Passport-UICShib
===============

Forked from [passport-uwshib](https://github.com/drstearns/passport-uwshib) by Dave Stearns

Passport authentication strategy that works with the University of Illinois Chicago's Shibboleth single-sign on service. This uses the fabulous [passport-saml](https://github.com/bergie/passport-saml) module for all the heavy lifting, but sets all the default options so that it works properly with the UIC Shibboleth Identity Provider (IdP).

Note that in order to use the UIC IdP for authentication, **you must [register your server](https://itrust.illinois.edu/federationregistry) with the UI I-Trust Federation Registry as a Service Provider**. During the registration process, under Advanced SAML 2 Registration, this package only requires the `Assertion Consuming Service (Post)` attribute to be defined as `https://test.uic.edu/login/callback`, with respect to your subdomain.

While registering, you must also specify which user profile attributes you want. See the [https://shibtest.uic.edu/test](https://shibtest.uic.edu/test/) for all available profile attributes (you must be logged in).

Installation
------------
    npm install passport-uicshib

Usage
-----
There is a fully-working example server script in [/example/server.js](https://github.com/rak3rman/passport-uicshib/blob/master/example/server.js), and an associated [package.json](ttps://github.com/rak3rman/passport-uicshib/blob/master/example/package.json), which you can use to install all the necessary packages to make the example script run (express, express middleware, passport, etc.). Refer to that as I explain what it is doing.

This module provides a Strategy for the [Passport](http://passportjs.org/) framework, which is typically used with [Express](http://expressjs.com/). Thus, there are several modules you need to require in your server script in addition to this module.

    let http = require('http');                     // http server
    let https = require('https');                   // https server
    let fs = require('fs');                         // file system
    let express = require("express");               // express middleware
    let morgan = require('morgan');                 // logger for express
    let bodyParser = require('body-parser');        // body parsing middleware
    let cookieParser = require('cookie-parser');    // cookie parsing middleware
    let session = require('express-session');       // express session management
    let passport = require('passport');             // authentication middleware
    let uicshib = require('passport-uicshib');      // UIC Shibboleth auth strategy

### Command line

The example script then gets the server's domain name from an environment variable. This allows you to run the example script without modification. Simply export a value for `DOMAIN` and run the script. You can also override the default HTTP and HTTPS ports if you wish by specifying `HTTPPORT` and `HTTPSPORT` environment variables.

    export DOMAIN=mydomain.uic.edu
    node server.js

### PM2

The example script is also ready to go with **pm2**. Modify the values defined in `/example/ecosystem.config.js` and pm2 will use them automatically on startup. By default, pm2 will watch for file changes and restart the application if needed.

    {
        name: "passport-uicshib",
        script: "./server.js",
        watch: true,
        env: {
            "DOMAIN": "test.uic.edu",
            "HTTPPORT": 3010,
            "HTTPSPORT": 3011
        }    
    } 

Once the env variables are set to your liking, start the pm2 process using:

    pm2 start ecosystem.config.js --env env

### Configuration Breakdown

The example script then loads a public certificate and associated private key from two files in a `/security` subdirectory.

    let publicCert = fs.readFileSync('../../security/sp-cert.pem', 'utf-8');
    let privateKey = fs.readFileSync('../../security/sp-key.pem', 'utf-8');

These are used not only for the HTTPS server, but also to sign requests sent to the UIC IdP. You can use [openssl](http://www.sslshopper.com/article-most-common-openssl-commands.html) to generate keys and certificate signing requests. The UIC IdP seems to require that your server responds to HTTPS requests, so you should get a signed certificate for your server before trying to register it.

The script continues by creating a typical Express application and registering the typical middleware. For more information on this, see the [Passport.js site](http://passportjs.org/).

Then the script creates the UIC Shibboleth Strategy, and tells Passport to use it.

    //create the UIC Shibboleth Strategy and tell Passport to use it
    var strategy = new uicshib.Strategy({
        entityId: domain,
        privateKey: privateKey,
        callbackUrl: loginCallbackUrl,
        domain: domain
    });

    passport.use(strategy);

In addition to the properties shown above, you may also pass any [configuration properties accepted by the passport-saml library](https://github.com/bergie/passport-saml/blob/master/README.md#configure-strategy).

**Note:** When the UIC IdP sends back Shibboleth assertions, they contain timestamps that declare when and for how long those assertions are valid. The passport-saml library will compare these timestamps against your server's clock, and will not allow any time skewing by default. If your server's clock is not synchronized with the UIC IdP server, you may want to add the `acceptedClockSkewMs` property to the object you pass to the `uicshib.Strategy()` constructor. This property is defined and interpreted by the passport-saml library, and may be set to a number of milliseconds that the clocks are allowed to be off from one another. If you don't want any timestamp checking at all, you may set this property to `-1`. See the [passport-saml configuration properties](https://github.com/bergie/passport-saml/blob/master/README.md#configure-strategy) for more details.

The name of the strategy is `'uicsaml'`, but you can use the `.name` property of the Strategy to refer to that.

You will typically want to use sessions to allow users to authenticate only once per-sesion. The next functions are called by Passport to serialize and deserialize the user to the session. As noted in the comments, you would typically want to serialize only the unique ID (`.netID`) and reconstitute the user from your database during deserialzie. But to keep things simple, the script serializes the entire user and deserializes it again.

    passport.serializeUser(function(user, done){
        done(null, user);
    });

    passport.deserializeUser(function(user, done){
        done(null, user);
    });

Next, the script registers a few routes to handle login, the login callback, and the standard metadata. This module provides implementations for the metadata route, and you use passport.authenticate for the login and login callback routes. The login route will redirect the user to the UIC single sign-on page, and the UIC IdP will then redirect the user back to the login callback route.

    app.get(loginUrl, passport.authenticate(strategy.name), uicshib.backToUrl());
    app.post(preAuthUrl + loginCallbackUrl, passport.authenticate(strategy.name), uicshib.backToUrl());
    app.get(uicshib.urls.metadata, uicshib.metadataRoute(strategy, publicCert));

The `uicshib.backToUrl()` is a convenience middleware that will redirect the browser back to the URL that was originally requested before authentication.

Lastly, the script tells Express to use the `ensureAuth()` middleware provided by this module to secure all routes declared after this.

    app.use(uicshib.ensureAuth(loginUrl));

Any route requested after this middleware will require authentication. When requested, those routes will automatically redirect to the `loginUrl` if the user has not already authenticated. After successful authentication, the browser will be redirected back to the original URL, and the user information will be available via the `req.user` object.

Note that `ensureAuth` can also be used to selectively secure routes. For example:

    app.get('protected/resource', ensureAuth(loginUrl), function(req, res) {
        // user has authenticated, do normal route processing
        // user is available via req.user
    });
