module.exports = {
    apps : [
        {
            name: "passport-uicshib",
            script: "./server.js",
            watch: true,
            env: {
                "DOMAIN": "enga-vm7.engr.uic.edu/shibboleth",
                "HTTPPORT": 3010,
                "HTTPSPORT": 3011
            }
        }
    ]
}
