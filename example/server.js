'use strict';

/*
    Example script for the passport-uicshib module

    This should be run on a server that will be or
    already has been registered with the UIC Shibboleth
    Identity Provider (IdP).
*/

const preAuthUrl = ''; // appended to beginning of authentication routes, optional, ex: '/shibboleth'
const loginUrl = '/login'; // where we will redirect if the user is not logged in
const loginCallbackUrl = '/login/callback'; // where shibboleth should redirect upon successful auth

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

///////////////////////////////////////////////////////////////////////////////
// load files and read environment variables
//

// get server's domain name from environment variable
// this is necessary as the passport-saml library requires
// this when we create the Strategy
let domain = process.env.DOMAIN;
if (!domain || domain.length == 0)
    throw new Error('You must specify the domain name of this server via the DOMAIN environment variable!');

let httpPort = process.env.HTTPPORT || 80;
let httpsPort = process.env.HTTPSPORT || 443;

// load public certificate and private key
// used for HTTPS and for signing SAML requests
// put these in a /security subdirectory with the following names,
// or edit the paths used in the following lines
let publicCert = fs.readFileSync('../../security/sp-cert.pem', 'utf-8');
let privateKey = fs.readFileSync('../../security/sp-key.pem', 'utf-8');

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
    secret: fs.readFileSync('../../security/session-secret.txt', 'utf-8'),
    cookie: {secret: true}
}));
app.use(passport.initialize());
app.use(passport.session());

// create the UIC Shibboleth Strategy and tell Passport to use it
let strategy = new uicshib.Strategy({
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

passport.use(strategy);

// These functions are called to serialize the user
// to session state and reconstitute the user on the
// next request. Normally, you'd save only the netID
// and read the full user profile from your database
// during deserializeUser, but for this example, we
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
app.get(loginUrl, passport.authenticate(strategy.name), uicshib.backToUrl());
app.post(preAuthUrl + loginCallbackUrl, passport.authenticate(strategy.name), uicshib.backToUrl());
app.get(uicshib.urls.metadata, uicshib.metadataRoute(strategy, publicCert));

// secure all routes following this
// alternatively, you can use ensureAuth as middleware on specific routes
// example:
//  app.get('/protected/resource', uicshib.ensureAuth(loginUrl), function(req, res) {
//      //route code
//  });
app.use(uicshib.ensureAuth(loginUrl));


///////////////////////////////////////////////////////////////////////////////
// application routes
//

// root resource
// just say hello!
// eventually this will be a static middleware that returns our UI pages
app.get('/', 
    function(req, res) {
        // req.user will contain the user object sent on by the
        // passport.deserializeUser() function above
        res.send('<p>Hello ' + req.user.displayName + '!</p>' +
            '<p>Shibboleth\'s IdP Attributes:</p>' +
            '<code style="white-space: pre">' + JSON.stringify(req.user, null, 4) + '</code>');
    }
);

// general error handler
// if any route throws, this will be called
app.use(function(err, req, res, next){
    console.error(err.stack || err.message);
    res.send(500, 'Server Error! ' + err.message);
});

///////////////////////////////////////////////////////////////////////////////
// web server creation and startup
//

// create the HTTPS server and pass the express app as the handler
let httpsServer = https.createServer({
    key: privateKey,
    cert: publicCert
}, app);

httpsServer.listen(httpsPort, function(){
    console.log('Listening for HTTPS requests on port %d', httpsServer.address().port)
});

// create an HTTP server that always redirects the user to HTTPS
let httpServer = http.createServer(function(req, res) {
    let redirUrl = 'https://' + domain;
    if (httpsPort != 443)
        redirUrl += ':' + httpsPort;
    redirUrl += req.url;

    res.writeHead(301, {'Location': redirUrl});
    res.end();
});

httpServer.listen(httpPort, function() {
    console.log('Listening for HTTP requests on port %d, but will auto-redirect to HTTPS', httpServer.address().port);
});

