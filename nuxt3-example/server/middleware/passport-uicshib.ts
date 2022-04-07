//
// passport-uicshib middleware
// ensures all requests are authenticated
//

console.log("passport-uicshib: instantiated")

export default async (req, res) => {
    const isNotHandledByThisMiddleware = req.url.includes('/login/')
    if (isNotHandledByThisMiddleware) {
        return
    }

    console.log("passport-uicshib: in middleware")
}
