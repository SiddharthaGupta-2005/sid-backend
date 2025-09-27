import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/user.models.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import jwt from "jsonwebtoken";

const generateAccessAndRefreshTokens = async (userId) =>
{
  try {
    const user = await User.findById(userId)
    const accessToken = user.generateAccessToken()
    const refreshToken = user.generateRefreshToken()

    user.refreshToken = refreshToken
    await user.save({ validateBeforeSave: false})
    return {accessToken, refreshToken}
  } catch (error) {
    throw new ApiError(500,"Something went wrong while generating access and refresh token")
  }
};

  const registerUser = asyncHandler(async (req, res) => {
  const { fullname, email, username, password } = req.body;

  // 1. Check all required fields
  if ([fullname, email, username, password].some(field => !field || field.trim() === "")) {
    throw new ApiError(400, "All fields are compulsory and required");
  }

  // 2. Check if user already exists
  const existedUser = await User.findOne({
    $or: [{ username }, { email }]
  });
  if (existedUser) {
    throw new ApiError(409, "User already exists with same username or email");
  }

  // 3. Handle file uploads (multer must use upload.fields([...]))
  const avatarLocalPath = req.files?.avatar?.[0]?.path;
  const coverImageLocalPath = req.files?.coverImage?.[0]?.path;

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is required");
  }

  // 4. Upload files to Cloudinary
  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = coverImageLocalPath ? await uploadOnCloudinary(coverImageLocalPath) : null;

  if (!avatar) {
    throw new ApiError(400, "Avatar file upload failed");
  }

  // 5. Create user in DB
  const newUser = await User.create({
    fullname,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    email,
    password,
    username: username.toLowerCase()
  });

  // 6. Fetch newly created user (without password & refreshToken)
  const createdUser = await User.findById(newUser._id).select(
    "-password -refreshToken"
  );

  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while registering user");
  }

  // 7. Success response
  return res.status(201).json(
    new ApiResponse(201, createdUser, "New user created successfully")
  );
});

const loginUser = asyncHandler(async(req,res) =>
{
  //loginuser:
  
   //1.req -> body
  const {email,password,username } = req.body
  
   //2. username or email
  if(!(email || username))
    {
      throw new ApiError(400,"Username or email is required")
    }
    
    //3. Find the user
    const user = await User.findOne({
      $or: [{username,email}]
    })
    if(!user)
      {
        throw new ApiError(400,"User does not exist")
      }
      
    //4. Password check
      const isPasswordValid = await user.isPasswordCorrect(password);
      
      if(!isPasswordValid)
        {
          throw new ApiError(401,"Password is wrong")
        }
        
    //5. Access and Refresh Token
        const {accessToken,refreshToken} = await generateAccessAndRefreshTokens(user._id)

        const loggedInUser = await User.findById(user._id).select("-password -refreshToken")
        
        //6. send cookie
        const options = {
          httpOnly: true,
          secure: true,
        }
        return res.status(200).cookie("accessToken",accessToken,options).cookie("refreshToken",refreshToken,options).json(
          new ApiResponse(
            200,
            {
              user: loggedInUser,accessToken,refreshToken
            },
            "User logged in successfully"
          ))
          
});
const logoutUser = asyncHandler(async (req,res) => {
        await User.findByIdAndUpdate(
          req.user._id,
          {
            $set:
            {
              refreshToken: undefined
            }
          },
          {new : true} 
        )
         const options = {
          httpOnly: true,
          secure: true,
        }
        return res
        .status(200)
        .clearCookie("accessToken",options)
        .clearCookie("refreshToken",options)
        .json(new ApiResponse(200,{},"user logged out successfully!"))
});

const refreshAccessToken = asyncHandler(async (req,res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken
    if(!incomingRefreshToken)
        {throw new ApiError(401,"Unauthorize request")}

   try {
     const decodedToken = jwt.verify(incomingRefreshToken,process.env.REFRESH_TOKEN_SECRET)
     const user = await User.findById(decodedToken?._id)
 
      if(!user)
           {throw new ApiError(401,"Invalid refresh Token!")}
 
      if(incomingRefreshToken !== user?.refreshToken)
           {throw new ApiError(401,"Refresh Token is expired or used")}
   const options = {
           httpOnly: true,
           secure: true
         }
         const {accessToken,newRefreshToken} = await generateAccessAndRefreshTokens(user._id)
 
         return res
         .status(200)
         .clearCookie("accessToken",accessToken,options)
         .clearCookie("refreshToken",refreshToken,options)
         .json(
           new ApiResponse(
             200,
             {accessToken,refreshToken: newRefreshToken},"Access Token Refreshed successfully!"))
 
   } catch (error) {
    throw new ApiError(401,"unauthorized request");
    
   }

})

const changeUserPassword = asyncHandler(async (req,res) => {
  //1. req -> body
  const {oldPassword,newPassword} = req.body;
  //2. find the user
  const user = await User.findById(req.user?._id)
  //3. old password check
  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)
  if(!isPasswordCorrect)
    {
      throw new ApiError(400,"Old password is incorrect")
    }
    //4. update new password
    user.password = newPassword;
    await user.save({validateBeforeSave: false});
    //5. success response
    return res.status(200).json(new ApiResponse(200,{},"Password changed successfully"));
})

const getCurrentUser = asyncHandler(async (req,res) => {
  return res.status(200).json(200,req.user,"user fetched successfully")
})

const updateAccountDetails = asyncHandler(async (req,res) =>{
  //1. get fullName , email from req-> body
  const {fullName,email} = req.body
  //2.check if fullName or email is availabel
  if(!fullName || !email)
  {
    throw new ApiError(400,"All fields are required.")
  }
  //3.find the user
  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: 
      {
        fullName: fullName,
        email: email
      }
    },
    // After Updation new value will be return
    {new: true}
  ).select("-password")
  //4.Success response
  return res.status(200)
  .json(new ApiResponse(200, user, "Account detailes updated successfulllyy"))
})
      export { 
        registerUser,
        loginUser,  
        logoutUser,
        refreshAccessToken,
        changeUserPassword,
        getCurrentUser,
        updateAccountDetails
};
