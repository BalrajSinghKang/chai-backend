import mongoose, {isValidObjectId, set} from "mongoose"
import {Video} from "../models/video.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"


const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = await Video.find().sort({title: 1}).limit(10)
    console.log(page, limit, sortBy);
    // TODO: get all videos based on query, sort, pagination

    const { videoId } = req.params


    const video = await Video.find({owner:videoId})

    if (!video) {
        throw new ApiError(400, "video does not exits ")
    }

    console.log(video);

    return res
    .status(201)
    .json(
        new ApiResponse(201, video, "video found sucessfully")
    )



})

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description} = req.body
    // TODO: get video, upload to cloudinary, create video
    if (
        [title, description, ].some((field) => field?.trim() === "")
    ) {
        throw new ApiError(400, "All fields are required")
    }
    
    const user = await User.aggregate([

        {
            $match: {
                _id: new mongoose.Types.ObjectId(req.user._id)
            }
        },
        
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner"   
            }
        
        },
        {
            $addFields: {
                owner: {
                    $first: "$owner"
                }
            }
        },
        
        {
            $project: {
                username: 1,
                avatar: 1,
                owner: 1
            }
        },
    ])
    
    const videoLocalPath = req.files?.videoFile[0]?.path;
    
    const {avatar, fullName, _id} = user[0]

    // const owner = _id
    const thumbnailLocalPath = req.files?.thumbnail[0]?.path;
    // console.log(videoLocalPath);

    if (!videoLocalPath) {
        throw new ApiError(400, "Video file is required")
    }
    if (!thumbnailLocalPath) {
        throw new ApiError(400, "Thumbnail file is required")
    }

    const videoFile = await uploadOnCloudinary(videoLocalPath)
    console.log(videoFile);
    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath)

    

    if (!videoFile && !thumbnail) {
        throw new ApiError(400, "Something went wrong while uploading files")
    }

    const video = await Video.create({
        title,
        description,
        videoFile: videoFile.url,
        thumbnail: thumbnail?.url,
        duration: videoFile?.duration,
        owner: _id,
        avatar: avatar,
        name: fullName
    })

    

    return res
        .status(201)
        .json(
        new ApiResponse(200, video,  "Files Uploaded Successfully")
    )
})

const getVideoById = asyncHandler(async (req, res) => {

    const { videoId } = req.params


    const video = await Video.findById(videoId)

    if (!video) {
        throw new ApiError(400, "video does not exits ")
    }

    console.log(video);

    return res
    .status(201)
    .json(
        new ApiResponse(201, video, "video found sucessfully")
    )



});
    

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: update video details like title, description, thumbnail

    if(!videoId){
        throw new ApiError(400, "Video not found")
    }

    const thumbnailLocalPath = req.file?.path

    const {title, description} = req.body

    if (!title && !description) {
        throw new ApiError(400, "All fields are required")
    }

    if (!thumbnailLocalPath) {
        throw new ApiError(400, "Avatar file is missing")
    }



    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath)
    if (!thumbnail.url) {
        throw new ApiError(400, "Error while uploading on avatar")
    }

    const video = await Video.findByIdAndUpdate(
        videoId,
        {
            $set:{
                thumbnail: thumbnail.url,
                title,
                description
            }
        },
        {new: true}
    )

    return res
    .status(200)
    .json(
        new ApiResponse(200, video, "Thumbnail updated successfully" )
    )


})


const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    await Video.findByIdAndDelete(videoId)

    return res
    .status(200)
    .json(
        new ApiResponse(200, "Video Deleted successfully" )
    )
})


const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    const {isPublished} = await Video.findById(videoId)

    // if (!isPublished) {
    //     throw new ApiError(400, "Video does not exists")
    // }

    const publishStatus = await Video.findByIdAndUpdate(
        videoId,
        { 
            $set:{
                isPublished: !isPublished
            } 
         },
        {new: true}
    )

    if (!publishStatus) {
        throw new ApiError(400, "Status does not updated")

    } 

    return res
    .status(201)
    .json(
        new ApiResponse(200, publishStatus, "video fetched sucesfully")
    )
    
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}