"use strict";
/**
 * UIC Shibboleth Passport Authentication Module
 *
 * This module exposes a passport Strategy object that is pre-configured to work with the UIC's Shibboleth
 * Identity Provider (IdP). To use this, you must register your server with the UIC IdP. For details, see
 * https://github.com/drstearns/passport-uicshib
 *
 * @module passport-uicshib
 * @author Dave Stearns
 * @author Radison Akerman
 */

var saml = require('passport-saml');
var util = require('util');

var uicIdPCert = 'MIIDDTCCAfWgAwIBAgIJAJmphosislTSMA0GCSqGSIb3DQEBCwUAMB0xGzAZBgNV\n' +
    'BAMMEnNoaWJib2xldGgudWljLmVkdTAeFw0yMTA2MTkxNTU3MDFaFw0zNzA3MTUx\n' +
    'NTU3MDFaMB0xGzAZBgNVBAMMEnNoaWJib2xldGgudWljLmVkdTCCASIwDQYJKoZI\n' +
    'hvcNAQEBBQADggEPADCCAQoCggEBALfOyXJ43aA1cI/CmNbjrfOATCdwFqrMsx3I\n' +
    'KSUOy7rIGMXGnlLeW4d3vNpiy/bUdEUQA0Utc/S8EM/dl/mrNinGvnNGg3v2XnPl\n' +
    'YTpmXcHyOg0efDLsysqYuDM6hcBs8vsrwgC4CZc+qu9wOOyeXecoueQYDVGKjiTR\n' +
    'yy4eHmP+fQVwJi3nL+aID3VmFJ3hcl85p/kgiGyrvyWdlgK+TWv5xD2/BscjHXDJ\n' +
    'WyfZ1LPJiW1DDEE4OCl+mrg/DQmr3Km+MsvnuqFgcpWqeZdl+LkzTz4FpS7O2iaK\n' +
    't7qgbWWeilhN3jvFJY713j/wJr5yho1xbYWp3UTbHg84orUGlgECAwEAAaNQME4w\n' +
    'HQYDVR0OBBYEFP1f4OS9LtMlqAZIL6ZjKCztc05NMB8GA1UdIwQYMBaAFP1f4OS9\n' +
    'LtMlqAZIL6ZjKCztc05NMAwGA1UdEwQFMAMBAf8wDQYJKoZIhvcNAQELBQADggEB\n' +
    'AGdHNshrGRnpgYQM6JbGKz91DxifQf4EcMnh/yFeHz/POLTCrs6MdChtmBN8zA5I\n' +
    'gh323Un2qyMORfqa5qaIfHpsJOMb8LVrn/L0YvVWDKpt2immdvzdNCJS6N6NptaX\n' +
    'FbejyzMRYwKj05GDM/N6eR84xRLuJTsy6kbEOOfn7RDSSNv0DhatYy3bLbIcs8sA\n' +
    'mYelMWDJkpSQW1T0KKPekz9jWaoCs/CNVeg1FNiBmQpHUKoB7C5hd46RmxwK+INM\n' +
    'HOqqcZ4k8BmZfx4Qu3mBey2mTqZIG84ACbAc3cuY9MoR7YN+hJtOkA1hKG2jGTGu\n' +
    'Gx/8MsJK04MCRuHZNR9vpqE=\n';
var uicIdPEntryPoint = 'https://shibboleth.uic.edu/idp/profile/SAML2/Redirect/SSO';
var strategyName = 'uicsaml';

/**
 * Standard URLs for Shibboleth Metadata route and the UIC Logout page
 * You can use the urls.metadata in conjunction with the metadataRoute
 * function to create your server's metadata route implementation.
 *
 * @type {{metadata: string, uicLogoutUrl: string}}
 */
module.exports.urls = {
    metadata: '/Shibboleth.sso/Metadata',
    uicLogoutUrl: 'https://shibboleth.uic.edu/idp/cgi-bin/shib-logout.cgi?return=https://shibboleth.uic.edu/shibboleth-logout.html'
};

//map of possible profile attributes and what name
//we should give them on the resulting user object
//add to this with other attrs if you request them
var profileAttrs = {
    'urn:oid:0.9.2342.19200300.100.1.1': 'netId',
    'urn:oid:2.16.840.1.113730.3.1.241': 'displayName',
    'urn:oid:1.3.6.1.4.1.5923.1.1.1.1': 'affiliation',
    'urn:oid:2.5.4.3': 'cn',
    'urn:oid:0.9.2342.19200300.100.1.3': 'email',
    'urn:oid:2.16.840.1.113730.3.1.3': 'empNum',
    'urn:oid:1.3.6.1.4.1.5923.1.1.1.6': 'principalName',
    'urn:oid:2.5.4.42': 'givenName',
    'urn:oid:2.5.4.18': 'box',
    'urn:oid:2.5.4.20': 'phone',
    'urn:oid:2.5.4.4': 'surname',
    'urn:oid:2.5.4.12': 'title',
    'urn:oid:1.2.840.113994.200.21': 'studentId',
    'urn:oid:1.2.840.113994.200.24': 'regId',
    'urn:oid:1.3.6.1.4.1.5923.1.5.1.1': 'gwsGroups'
};

function verifyProfile(profile, done) {
    if (!profile) {
        return done(new Error('Empty SAML profile returned!'));
    }
    return done(null, convertProfileToUser(profile));
}

function convertProfileToUser(profile) {
    var user = {};
    var niceName;
    var idx;
    var keys = Object.keys(profile);
    var key;

    for (idx = 0; idx < keys.length; ++idx) {
        key = keys[idx];
        niceName = profileAttrs[key];
        if (niceName) {
            user[niceName] = profile[key];
        }
    }

    return user;
}

/**
 * Passport Strategy for UIC Shibboleth Authentication
 *
 * This class extends passport-saml.Strategy, providing the necessary options for the UIC Shibboleth IdP
 * and converting the returned profile into a user object with sensible property names.
 *
 * @param {Object} options - Configuration options
 * @param {string} options.entityId - Your server's entity id (often same as domain name)
 * @param {string} options.domain - Your server's domain name
 * @param {string} options.callbackUrl - Relative URL for the login callback (we will add https:// and domain)
 * @param {string} options.privateKey - Optional private key for signing SAML requests
 * @constructor
 */
module.exports.Strategy = function (options) {
    options = options || {};
    options.entryPoint = options.entryPoint || uicIdPEntryPoint;
    options.cert = options.cert || uicIdPCert;
    options.identifierFormat = null;
    options.issuer = options.issuer || options.entityId || options.domain;
    options.callbackUrl = 'https://' + options.domain + options.callbackUrl;
    options.decryptionPvk = options.privateKey;
    options.privateCert = options.privateKey;

    let strat = new saml.Strategy(options, verifyProfile);
    this._verify = verifyProfile;
    this._saml = strat._saml;
    this._passReqToCallback = strat._passReqToCallback;
    this.name = strategyName;
};

util.inherits(module.exports.Strategy, saml.Strategy);

/*
    Route implementation for the standard Shibboleth metadata route
    usage:
        var uicshib = require(...);
        var strategy = new uicshib.Strategy({...});
        app.get(uicshib.urls.metadata, uicshib.metadataRoute(strategy, myPublicCert));
*/

/**
 * Returns a route implementation for the standard Shibboleth metadata route.
 * common usage:
 *  var uicshib = reuqire('passport-uicshib');
 *  var myPublicCert = //...read public cert PEM file
 *  var strategy = new uicshib.Strategy({...});
 *  app.get(uicshib.urls.metadata, uicshib.metadataRoute(strategy, myPublicCert));
 *
 * @param strategy - The new Strategy object from this module
 * @param publicCert - Your server's public certificate (typically loaded from a PEM file)
 * @returns {Function} - Route implementation suitable for handing to app.get()
 */
module.exports.metadataRoute = function(strategy, publicCert) {
    return function(req, res) {
        res.type('application/xml');
        res.status(200).send(strategy.generateServiceProviderMetadata(publicCert, publicCert));
    };
}; //metadataRoute

/**
 * Middleware for ensuring that the user has authenticated.
 * You can use this in two different ways. If you pass this to app.use(), it will secure all routes
 * that are added to the app after that. Or you can use this selectively on routes by adding it as
 * the first route handler function, like so:
 *  app.get('/secure/route', ensureAuth(loginUrl), function(req, res) {...});
 *
 * @param loginUrl - The URL to redirect to if the user is not authenticated
 * @returns {Function} - Middleware function that ensures authentication
 */
module.exports.ensureAuth = function(loginUrl) {
    return function(req, res, next) {
        if (req.isAuthenticated())
            return next();
        else {
            if (req.session) {
                req.session.authRedirectUrl = req.originalUrl;
            }
            else {
                console.warn('passport-uicshib: No session property on request!'
                    + ' Is your session store unreachable?');

            }
            res.redirect(loginUrl);
        }
    };
};

/*
    Middleware for redirecting back to the originally requested URL after
    a successful authentication. The ensureAuth() middleware above will
    capture the current URL in session state, and when your callback route
    is called, you can use this to get back to the originally-requested URL.
    usage:
        var uicshib = require(...);
        var strategy = new uicshib.Strategy({...});
        app.get('/login', passport.authenticate(strategy.name));
        app.post('/login/callback', passport.authenticate(strategy.name), uicshib.backtoUrl());
        app.use(uicshib.ensureAuth('/login'));
*/
/**
 * Middleware for redirecting back to the originally requested URL after a successful authentication.
 * The ensureAuth() middleware in this same module will capture the current URL in session state, and
 * you can use this method to get back to the originally-requested URL during your login callback route.
 * Usage:
 *  var uicshib = require('passport-uicshib');
 *  var strategy = new uicshib.Strategy({...});
 *  app.get('/login', passport.authenticate(strategy.name));
 *  app.post('/login/callback', passport.authenticate(strategy.name), uicshib.backToUrl());
 *  app.use(uicshib.ensureAuth('/login'));
 *  //...rest of routes
 *
 * @param defaultUrl - Optional default URL to use if no redirect URL is in session state (defaults to '/')
 * @returns {Function} - Middleware function that redirects back to originally requested URL
 */
module.exports.backToUrl = function(defaultUrl) {
    return function(req, res) {
        var url = defaultUrl || '/';
        if (req.session) {
            url = req.session.authRedirectUrl;
            delete req.session.authRedirectUrl;
        }
        res.redirect(url);
    };
};

