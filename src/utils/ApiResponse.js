class ApiResponse{
    constructor(
        satutsCode,data,message = "Success"
    )
    {
        this.satutsCode = satutsCode
        this.data  = data
        this.message = message
        this.success = statusCode<400

    }
}