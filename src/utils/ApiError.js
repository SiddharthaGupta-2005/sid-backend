class ApiError extends Error{
    constructor(
        statuscode,
        message = "something went wrong",
        stack = "",
        errors = []
    ){
        super(message)
        this.statuscode = statuscode
        this.data = null
        this.message = message
        this.success = false
        this.errors = errors
    }
}

export {ApiError}