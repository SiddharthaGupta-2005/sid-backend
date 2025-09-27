import { asyncHandler } from "./asyncHandler";

class ApiResponse {
  constructor(statusCode, data, message = "Success") {
    this.statusCode = statusCode;
    this.data = data;
    this.message = message;
    this.success = statusCode < 400;
  }
}
const refreshToken = asyncHandler(async (req,res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken
    if(incomingRefreshToken)
    {
      throw new ApiError(401,"Unauthorized request")
    }

})

export { ApiResponse };
