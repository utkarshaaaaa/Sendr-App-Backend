//npm run dev
const express = require("express");
const { body, param, validationResult } = require("express-validator");

const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const short = require("short-uuid");
const coolkieSession = require("cookie-session");
const passport = require("passport");
const asynchandler = require("express-async-handler");
const router = express.Router();
const user = require("../models/schema");
const { fileURLToPath } = require("url");
const { error } = require("console");

const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};
router.route("/reg:email").post(
  asynchandler(async (req, res) => {
    const { name, email, password, postData } = req.body;
    const userexist = await user.findOne({ email: email });

    //updating the data
    if (userexist) {
      const pEmail = req.params.email;
      const userPostData = await user.findOne({ email: pEmail });

      const prevDet = [...userPostData.post_details];
      console.log(prevDet);

      const user_name = await user.findOneAndUpdate(
        { email: pEmail },
        { post_details: [...prevDet, postData] },
        { new: true }
      );
      res.status(200).json({ user: user_name });

      const dat = user_name.post_details.filter((e) => {
        return e.postId == 123;
      });
    } else {
      const actualuser = await user.create({
        User_name: name,
        email: email,
        password: password,
        post_details: postData,
      });
      if (actualuser) {
        const tokenreg = jwt.sign(
          { email: actualuser.email, id: actualuser._id },
          SECRET_KET
        );
        res.status(200).json({ user: actualuser, token: tokenreg });
      }
    }
  })
);
//Create Post

router.route("/Createpost:email").post(
  asynchandler(async (req, res) => {
    const { postData } = req.body;
    
    const pEmail = req.params.email;
    const userexist = await user.findOne({ email: pEmail });
    
    //updating the data
    if (userexist) {
      const userPostData = await user.findOne({ email: pEmail });

      const prevDet = [...userPostData.post_details];

      const itemDetail = await user.findOneAndUpdate(
        { email: pEmail },
        { post_details: [...prevDet, postData] },
        { new: true }
      );
      console.log(itemDetail.post_details)
      res.status(200).json({ itemDetail: itemDetail });
    } else {
      res.json({ error: "user does not exist" });
    }
  })
);

//User name and email ID
router.route("/user_name:email").post(async (req, res) => {
  const user_id_creation = () => {
    const Id = Math.floor(Math.random() * (10000 - 1)) + 9999;
    return Id;
  };
  const Id = Math.floor(Math.random() * (10000 - 1)) + 9999;

  const { userName } = req.body;
  try {
    const userName_in_db = await user.findOne({ User_name: userName });

    const userId_in_db = await user.findOne({ User_id: Id });

    if (req.params.email === null) {
      throw new Error("Email required");
    }
    if (userName_in_db || userId_in_db) {
      res.json({ message: "User name exist" });
      user_id_creation();
    } else {
      if (userName == " ") {
        throw new Error("Please enter User name");
      } else {
        const user_name = await user.findOneAndUpdate(
          { email: req.params.email },
          { User_id: Id, User_name: userName },
          { new: true }
        );
        res.status(200).json({ user: user_name });
        console.log(user_name);
      }
    }
  } catch (error) {
    res.status(404);
  }
});

//Time period
router.route("/time_removal").post((req, res) => {});

//Create  post
router.route("/create_post:post_id").put(async (req, res) => {
  const { picname, description, TimeCreated, TimeRemoval } = req.body;
  const id = req.params.post_id;

  try {
    const post = await user.findByIdAndUpdate(
      { id: id },
      {
        description: description,
        Picname: picname,
        TimeCreated: TimeCreated,
        TimeRemove: TimeRemoval,
      },
      { new: true }
    );
    res.status(200).json({ postData: post });
  } catch (error) {
    res.status(500).json({ error: error });
  }
});

//Get user data

router.get("/user_data:userEmail", async (req, res) => {
  try {
    const userData = await user.findOne({ email: req.params.userEmail });
    if (!userData) {
      return res.status(404).json({ error: "User not found" });
    }
    return res.status(200).json({ data: userData });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
//Get user Following
router.route("/user_Following:userEmail").get(async (req, res) => {
  try {
    const User_details = await user.findOne({ email: req.params.userEmail });

    if (!User_details) {
      throw new error("User not found");
    }

    if (User_details) {
      res.status(200).json({ Following: User_details.Following });
    } else {
      res.json({ error: "Invalid User Id " });
    }
  } catch (error) {
    res.status(400).json({ error: error });
  }
});

//login user

router.route("/login").post(
  asynchandler(async (req, res) => {
    const { User_name, User_id, password } = req.body;

    const User_in_db = await user.findOne({
      User_id: User_id,
      User_name: User_name,
    });

    if (!User_in_db) {
      return res.status(404).json({ message: " User not found" });
    }
    const matchpassword = await bcrypt.compare(password, User_in_db.password);

    if (!matchpassword) {
      return res.status(400).json({ message: "invalid_password" });
    } else {
      const token = jwt.sign(
        { email: User_in_db.email, id: User_in_db._id },
        SECRET_KET
      );
      res.status(201).json({ user: User_in_db, token: token });
    }
  })
);

//get Post details
router.route("/post_details:email").get(async (req, res) => {
  try {
    const userEmail = req.params.email;
    if (!userEmail) {
      res.status(400).json({ error: "Email not provided" });
    }
    const user_data = await user.findOne({ email: userEmail });
    res.status(200).json({
      pic: user_data.pic,
    });
  } catch (error) {
    res.status(400).json({ error: error });
    //changes
  }
});

//Get all post data

router.route("/get_posts").get(async (req, res) => {
  try {
    const posts = await user.find();
    res.status(200).json({
      post: posts,
    });
    console.log(posts);
  } catch (error) {
    res.status(400).json({ error: error });
  }
});


//Get all users data
router.route("/get_user_data").get(async (req, res) => {
  try {
    const userData = await user.find();
    res.status(200).json({
      users: userData,
    });

  } catch (error) {
    console.log(error)
  }
});


//Sharing post
router.route("/shared:Share_email").post(async (req, res) => {
  try {
    const { shareData, sendersEmail, postUserName, postUserProfileImage } =
      req.body;
    const pEmail = req.params.Share_email;
    if(!pEmail){
         new Error("No email found")
    }

    const shareUserDetails = await user.findOne({ email: pEmail });
    const senderDetails = await user.findOne({ email: sendersEmail });
    const resData = {
      ...shareData,
      postUserName: postUserName,
      senderName: senderDetails.User_name,
      senderPic: senderDetails.profile_image,
      postUserProfileImage: postUserProfileImage,
    };

    const updatedSharedPost = await user.findOneAndUpdate(
      { email: pEmail },
      { Shared: [...shareUserDetails.Shared, resData] },
      { new: true }
    );
    res.status(200).json({ sharedPostData: updatedSharedPost.Shared });
  } catch (error) {
    res.status(400).json({ err: error });
  }
});

//get Shared Data in the inbox
router.route("/getSharedData:email").get(async (req, res) => {
  try {
    const pEmail = req.params.email;
    const findUser = await user.findOne({ email: pEmail });
    if (!findUser) {
      throw new error("user not found");
      
    }

    res.status(200).json({ postData: [findUser.Shared] });
  } catch (error) {
    res.json({ error: error });
  }
});
//following

router.route("/following:email").post(async (req, res) => {
  try {
    const senderEmail = req.params.email;

    const { userEmail } = req.body;
    const findAccounts = await user.findOne({ email: senderEmail });
    if (!findAccounts) {
      
      res.json({ message: "User not found" });
      
    }
    const findUserAccounts = await user.findOne({ email: userEmail });

    console.log(findAccounts?._id?.toString());

    const accId = findUserAccounts?._id?.toString();

    await user.findOneAndUpdate(
      { email: senderEmail },
      {
        Following: [
          ...findAccounts.Following,
          {
            userName: findUserAccounts.User_name,
            email: findUserAccounts.email,
            id: accId,
            pic: findUserAccounts.profile_image,
          },
        ],
      },
      { new: true }
    );
    res.json({email:findUserAccounts.email,following:findAccounts.Following})
    
  } catch (error) {
    console.log(error)
  }
});

//get User following data
router.route("/getFollowingData:userEmail").get(async (req, res) => {
  try {
    const Pemail = req.params.userEmail;
 

    const findUserData = await user.findOne({ email: Pemail });
    if (!findUserData) {
      res.json({ message: "user not found" });
    }
    const followingData = findUserData.Following?.map((follData, id) => {
      return follData;
    });

    res.status(200).json({ data: followingData });
  } catch (error) {
    res.status(400).json({ error: error });
  }
});
//Get likes of Individual post

router.route("/getLikes:_id").post(async (req, res) => {
  const Id = req.params._id;

  const { postId } = req.body;

  const SinglePostLikes = await user.findOne({ _id: Id });
  if (!SinglePostLikes) {
    console.log("post not found");
  }

  const postLikes = SinglePostLikes.post_details
    .map((prop) => {
      return prop;
    })
    .filter((elements) => {
      return elements.postId == postId;
    });

  res.status(200).json({ post: postLikes });
});
router.route("/getAllLikes:_id").post(async (req, res) => {
  const Id = req.params._id;

  const SinglePostLikes = await user.findOne({ _id: Id });

  const postLikes = SinglePostLikes.post_details.map((prop) => {
    return prop.likes;
  });

  res.status(200).json({ post: postLikes });
});

//Increase or decrease the likes
//Increase Likes
router.route("/Inclikes:email").post(async (req, res) => {
  try {
    const emailParams = req.params.email;
    const { postId } = req.body;

    if (!emailParams) {
      res.status(400).json({ error: "Email Required" });
    }

    const userDetails = await user.findOne({ email: emailParams });

    if (userDetails == null) {
      res.status(400).json({ error: "cannot find email" });
    }

    let userPostDetails = userDetails.post_details;

    const findPost = userDetails.post_details.filter((post, id) => {
      return post.postId == postId;
    });

    const findPostLikes = userDetails.post_details
      .filter((post, id) => {
        return post.postId == postId;
      })
      .map((e, id) => {
        return e.likes;
      });

    let updatedPostLike = Number(findPostLikes) + 1;

    findPost.every((element) => (element.likes = updatedPostLike));

    console.log(userPostDetails);

    console.log("Updating a single post", findPost);

    const updatedLikes = await user.findOneAndUpdate(
      { email: emailParams },

      { post_details: [...userPostDetails] },
      { new: true }
    );
    res.status(200).json({ user: updatedLikes });
  } catch (error) {
    res.status(400).json({ err: error });
  }
});

//Decrease Likes
router.route("/Declikes:email").post(async (req, res) => {
  try {
    const emailParams = req.params.email;
    const { postId } = req.body;

    if (!emailParams) {
      res.status(400).json({ error: "Email Required" });
    }

    const userDetails = await user.findOne({ email: emailParams });

    if (userDetails == null) {
      res.status(400).json({ error: "cannot find Email" });
    }

    let userPostDetails = userDetails.post_details;

    const findPost = userDetails.post_details.filter((post, id) => {
      return post.postId == postId;
    });

    const findPostLikes = userDetails.post_details
      .filter((post, id) => {
        return post.postId == postId;
      })
      .map((e, id) => {
        return e.likes;
      });

    let updatedPostLike = Number(findPostLikes) - 1;

    if (updatedPostLike < 0) {
      updatedPostLike = 0;
    }

    findPost.every((element) => (element.likes = updatedPostLike));

    console.log(userPostDetails);

    console.log("Updating a single post", findPost);

    const updatedLikes = await user.findOneAndUpdate(
      { email: emailParams },

      { post_details: [...userPostDetails] },
      { new: true }
    );
    res.status(200).json({ user: updatedLikes });
  } catch (error) {
    res.status(400).json({ "error": `Internal server error ${error}` });
  }
});

//User's Post
router.route("/userPost:userEmail").get(async (req, res) => {
  try {
    const userEmail = req.params.userEmail;
    const posts = await user.find({ email: userEmail });
    if (!posts) {
      throw new error("post not found");
    }

    res.status(200).json({
      post: posts,
    });
  } catch (error) {
    res.json({ error: error });
  }
});

//add comments in the post using postId

// router.route("/addComment:userEmail").post(async (req, res) => {

//   try {
//     const { postDetails, postId } = req.body;
//     const userEmail = req.params.userEmail;

//     const userPost = await user.findOne({ email: userEmail });
//     let userPostDetails = userPost.post_details;

//     const findPost = userPost.post_details.filter((post, id) => {
//       return post.postId == postId;
//     });

//     const filterPostComment = userPost.post_details
//       .filter((postDetails, id) => {
//         return postDetails.postId == postId;
//       })
//       .map((data, id) => {
//         return data.comment;
//       });

//     const prevData=[...filterPostComment]

//     const updateComment = [
//        ...prevData,
//       postDetails,
//     ];
//     // console.log(updateComment);

//     //  const upcomment=[...updateComment]
//     // // retrive data
//     //  const data=upcomment.map((dat)=>{
//     //   return dat.map((e)=>{
//     //     return e.comment

//     //   })
//     // })
//     // console.log(data)

//     findPost.every((element) => (element.comment = updateComment));
//     console.log(...userPostDetails);

//     const updatePostComment = await user.findOneAndUpdate(
//       { email: userEmail },

//       { post_details: [...userPostDetails] },
//       { new: true }
//     );

//     res.status(200).json({ userPost: updateComment });

//   } catch (error) {

//     res.status(400).json({ err: error });
//   }
// });

router.route("/addComment:email").post(async (req, res) => {
  const { desc, userId, postId } = req.body;

  const userEmail = req.params.email;
  const findUser = await user.findOne({ email: userEmail });

  const findUserName = await user.findOne({ _id: userId });
  if (!findUserName) {
    res.status(400).json({ error: "user does not exist" });
  }

  console.log(findUserName.User_name);
  const userName = findUser.User_name;
  const updateComment = await user.findOneAndUpdate(
    { email: findUserName.email },

    {
      comment: [
        ...findUserName.comment,
        {
          desc: desc,
          userName: userName,
          postId: postId,
          userPic: findUser.profile_image,
        },
      ],
    },
    { new: true }
  );

  console.log(findUser);
  res.status(200).json({ comment: updateComment });
});

//get individual post comment
router.route("/getComments:email").post(async (req, res) => {
  // const{postId}=req.body
  // const userEmail=req.params.email
  // const userPost = await user.findOne({ email: userEmail });
  // let userPostDetails = userPost.post_details;

  // const findPost = userPost.post_details.filter((post, id) => {
  //   return post.postId == postId;
  // });

  // const filterPostComment = userPost.post_details
  //   .filter((postDetails, id) => {
  //     return postDetails.postId == postId;
  //   })
  //   .map((data, id) => {
  //     return data.comment;
  //   })

  //   console.log(...filterPostComment)

  try {
    const userEmail = req.params.email;
    const { postId } = req.body;
    const findUser = await user.findOne({ email: userEmail });
    if (!findUser) {
      throw new error("user not found");
    }

    const comments = findUser.comment.filter((postComment) => {
      return postComment.postId == postId;
    });
    console.log(comments, "comments");
    res.status(200).json({ comment: comments });
  } catch (error) {
    res.status(400).json({ error: error });
  }
});

//save post data

router.route("/savePost").post((req, res) => {});
//get all the followers

router.route("/getFollower:user_email").get(async (req, res) => {
  const userEmail = req.params.user_email;
  const findUser = await user.findOne({ email: userEmail });
  if (!findUser) {
    throw new error("user not found");
  }

  res.json({ data: findUser.Followers });

});
//Get user following
router.route("/getFollowing:user_email").get(async (req, res) => {
  const userEmail = req.params.user_email;

  const findUser = await user.findOne({ email: userEmail });
  if (!findUser) {
    throw new error("user not found");
  }

  res.json({ data: findUser.Followers });
});


module.exports = router;
