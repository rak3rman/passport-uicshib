module.exports = {
    apps : [
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
    ]
}
