'use strict';

/*
    Example script for the passport-uicshib module

    This should be run on a server that will be or
    already has been registered with the UIC Shibboleth
    Identity Provider (IdP).
*/

const preAuthUrl = ''; // appended to beginning of authentication routes, optional, ex: '/shibboleth'
const loginUrl = '/login'; // where we will redirect if the user is not logged in
const loginCallbackUrl = '/api/login/callback'; // where shibboleth should redirect upon successful auth
const logoutUrl = '/logout'; // url endpoint that will log a user out
const userUrl = '/api/user'; // url endpoint that will return user details

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
let passLocal = require('passport-local');  // Passport local auth strategy

///////////////////////////////////////////////////////////////////////////////
// load files and read environment variables
//

// get server's domain name from environment variable
// this is necessary as the passport-saml library requires
// this when we create the Strategy
let domain = process.env.DOMAIN;
if (!domain || domain.length === 0)
    throw new Error('You must specify the domain name of this server via the DOMAIN environment variable!');

let appSecret = process.env.SECRET;
if (!appSecret || appSecret.length === 0)
    throw new Error('You must specify an application secret for this server via the SECRET environment variable!');

let shibalike = process.env.SHIBALIKE === "true";
let httpPort = process.env.HTTPPORT || 80;
let httpsPort = process.env.HTTPSPORT || 443;

let publicRoot = './vue/dist'; // absolute path to vue compiled dist
let shibaUsers = require('./shibalike-users.json');

// load public certificate and private key
// used for HTTPS and for signing SAML requests
// put these in a /security subdirectory with the following names,
// or edit the paths used in the following lines
let publicCert, privateKey;
if (!shibalike) {
    publicCert = fs.readFileSync('../../security/sp-cert.pem', 'utf-8');
    privateKey = fs.readFileSync('../../security/sp-key.pem', 'utf-8');
}

///////////////////////////////////////////////////////////////////////////////
// setup express application and register middleware
//
let app = express();
app.use(morgan({
    format: process.env.LOGFORMAT || 'dev'
}));
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json({type: 'application/json'}));
app.use(cookieParser());
app.use(session({
    secret: appSecret,
    cookie: {secret: true}
}));
app.use(express.static(publicRoot))
app.use(passport.initialize());
app.use(passport.session());

// Declare UIC Shibboleth Strategy
let uicshibStrategy = new uicshib.Strategy({
    // UIC Shibboleth wants the full website URL as the entity ID
    // so add the `https://` protocol to your domain name
    entityId: 'https://' + domain + preAuthUrl,
    privateKey: privateKey,
    callbackUrl: loginCallbackUrl,
    domain: domain + preAuthUrl
    // If your server is not using the same authoritative
    // time-server as the Shibboleth's (including if your
    // server is running within the NetID domain!), add
    // the following property setting. This will allow
    // for a small amount of skew between the clocks of
    // the client and the server.
    //
    // acceptedClockSkewMs: 200
});

// Declare Passport Local Strategy
let shibalikeStrategy = new passLocal(
    {
        usernameField: "email",
        passwordField: "password"
    },
    (username, password, done) => {
        // Checks user/pass for one hardcoded user and returns user
        // NEVER hard code values like this, it is awful practice
        let target = shibaUsers.find((user) => {
            return user.uid === username && "pass" === password;
        })
        if (target) {
            done(null, target)
        } else {
            done(null, false, { message: "Incorrect username or password, please try again" })
        }
    }
);

// Choose which strategy we are using
// shibalike for testing or uicshib for production
if (shibalike) {
    passport.use(shibalikeStrategy);
} else {
    passport.use(uicshibStrategy);
}

// These functions are called to serialize the user
// to session state and reconstitute the user on the
// next request. Normally, you'd save only the netID
// and read the full user profile from your database
// during deserializeUser, but for this vite-example, we
// will save the entire user just to keep it simple
passport.serializeUser(function(user, done){
    done(null, user);
});

passport.deserializeUser(function(user, done){
    done(null, user);
});

///////////////////////////////////////////////////////////////////////////////
// login, login callback, and metadata routes
//
if (shibalike) {
    // Shibalike authentication routes
    app.get(loginUrl, (req, res, next) => {
        res.sendFile("index.html", { root: publicRoot });
    })
    app.post(loginUrl, (req, res, next) => {
        passport.authenticate("local", (err, user, info) => {
            if (err) return next(err);
            if (!user) return res.status(400).send([user, "Cannot log in", info]);
            req.login(user, err => {
                res.send("Logged in");
            });
        })(req, res, next);
    });
} else {
    // UIC Shibboleth authentication routes
    app.get(loginUrl, passport.authenticate(uicshibStrategy.name), uicshib.backToUrl());
    app.post(preAuthUrl + loginCallbackUrl, passport.authenticate(uicshibStrategy.name), uicshib.backToUrl());
    app.get(uicshib.urls.metadata, uicshib.metadataRoute(uicshibStrategy, publicCert));
}

// Universal logout route
app.get(logoutUrl, (req, res) => {
    req.logout(function(err) {
        if (err) { return next(err); }
        res.redirect('/login');
    });
});

///////////////////////////////////////////////////////////////////////////////
// application routes
//

// User details route
app.get(userUrl, uicshib.ensureAuth(), (req, res) => {
    res.send({ user: req.user });
})

// general error handler
// if any route throws, this will be called
app.use(function(err, req, res, next){
    console.error(err.stack || err.message);
    res.send(500, 'Server Error! ' + err.message);
});

///////////////////////////////////////////////////////////////////////////////
// web server creation and startup
//

// Create https and http server variables
let httpsServer, httpServer;

// Set configurations based on Shibalike/Shibboleth
if (shibalike) {
    // Setup https server
    httpServer = http.createServer(app);
} else {
    // Setup https server with declared certs
    httpsServer = https.createServer({
        key: privateKey,
        cert: publicCert
    }, app);

    // Start https server
    httpsServer.listen(httpsPort, function(){
        console.log('Listening for HTTPS requests on port ' + httpsServer.address().port);
    });

    // Setup http server that redirects to https
    httpServer = http.createServer(function(req, res) {
        let redirUrl = 'https://' + domain;
        if (httpsPort != 443)
            redirUrl += ':' + httpsPort;
        redirUrl += req.url;

        res.writeHead(301, {'Location': redirUrl});
        res.end();
    });
}

// Start http server
httpServer.listen(httpPort, function() {
    console.log('Listening for HTTP requests on port ' + httpServer.address().port);
});

