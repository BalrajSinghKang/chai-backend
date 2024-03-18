import mongoose, { isValidObjectId } from "mongoose"
import {Tweet} from "../models/tweet.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const createTweet = asyncHandler(async (req, res) => {
    
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

    const validation = isValidObjectId(user[0]._id)

    if (!validation) {
        throw new ApiError(400, "User is Invalid")
    }

    const {content} = req.body

    if (!content) {
        throw new ApiError(400, "Content is required")
    }

    const {_id} = user[0]

    const owner = _id

    const tweet = await Tweet.create({
        content,
        owner
    })

    console.log(tweet._id);

    return res
    .status(200)
    .json(
        new ApiResponse(201, tweet, "Tweet posted successfully")
    )
})

const getUserTweets = asyncHandler(async (req, res) => {
    const {userId} =req.params

    if (!userId) {
        throw new ApiError(400, "Cannot find Tweet of the user")
    }

    const userTweets = await Tweet.find({owner:userId})

    if (!userTweets) {
        throw new ApiError(400, "error while finding")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, userTweets, "All twets fetched successfully")
    )
})

const updateTweet = asyncHandler(async (req, res) => {
    //TODO: update tweet

    const {tweetId} = req.params

    if (!tweetId) {
        throw new ApiError(400, "Cannot find Tweet")
    }

    const {content} = req.body

    if (!content) {
        throw new ApiError(400, "Content is rquired")
    }

    const updatedtweet = await Tweet.findByIdAndUpdate(
        tweetId,
        {
            content: content
        },

        {new:true}
    )

    if (!updateTweet) {
        throw new ApiError(400, "Something went wrongwhile updating tweet")
    }

    res.
    status(201)
    .json(
        new ApiResponse(200, "Tweet updated successfully")
    )


})

const deleteTweet = asyncHandler(async (req, res) => {
    //TODO: delete tweet

    const {tweetId} = req.params

    if (!tweetId) {
        throw new ApiError(400, "Cannot find Tweet")
    }

    const deleteTweet = await Tweet.findByIdAndDelete(
        tweetId,
    )

    if (!deleteTweet) {
        throw new ApiError(400, "Tweet does not get deleted")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, "Tweet deleted sucessfully")
    )
})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}