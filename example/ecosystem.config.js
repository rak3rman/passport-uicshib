module.exports = {
    apps : [
        {
            name: "passport-uicshib",
            script: "./server.js",
            watch: true,
            env: {
                "DOMAIN": "enga-vm7.engr.uic.edu",
                "HTTPPORT": 3010,
                "HTTPSPORT": 3011
            },
            env_production: {
                "DOMAIN": "enga-vm7.engr.uic.edu",
                "HTTPPORT": 3010,
                "HTTPSPORT": 3011
            }
        }
    ]
}
