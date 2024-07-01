const express = require("express");
const SECRET_KET = "NOTES";
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const short = require("short-uuid");
const asynchandler = require("express-async-handler");
const router = express.Router();

const user = require("../models/schema");
const { fileURLToPath } = require("url");
//npm run dev

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

//User name and ID
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

router.route("/user_data:userEmail").get(async (req, res) => {
  try {
    const User_details = await user.findOne({ email: req.params.userEmail });

    if (User_details) {
      res.status(200).json({ data: User_details });
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
    const user_data = await user.findOne({ email: req.params.email });
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
  } catch (error) {
    res.json({ error: error });
  }
});

//Sharing post
router.route("/share:Share_email").post(async (req, res) => {
  try {
    const { postId } = req.body;
    const pEmail = req.params.Share_email;

    const shareUserDetails = await user.findOne({ email: pEmail });

    const UpdateshareUserDetails = await user.findOneAndUpdate(
      { email: pEmail },
      { Sharing: [...shareUserDetails.Sharing, postId] },
      { new: true }
    );
    res.status(200).json({ user: user_name, sharedBy: shareUserDetails._id });
  } catch (error) {
    res.status(400).json({ err: error });
  }
});

//following

router.route("/following:email").post(async (req, res) => {
  try {
    const Pemail = req.params.email;

    const { userEmail } = req.body;
    const findAccounts = await user.findOne({ email: Pemail });
    const findUserAccounts = await user.findOne({ email: userEmail });

    console.log(findAccounts._id.toString());

    const accId = findAccounts._id.toString();

    const updateUserFollowing = await user.findOneAndUpdate(
      { email: userEmail },
      { Following: [...findUserAccounts.Following, accId] },
      { new: true }
    );
   
  } catch (error) {
    res.status(400).json({ error: error });
  }
});
//Get likes of Individual post

router.route("/getLikes:_id").post(async (req, res) => {
  const Id = req.params._id;

  const { postId } = req.body;

  const SinglePostLikes = await user.findOne({ _id: Id });

  const postLikes = SinglePostLikes.post_details
    .map((prop) => {
      return prop;
    })
    .filter((elements) => {
      return elements.postId == postId;
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
    res.status(400).json({ err: error });
  }
});

//User's Post
router.route("/userPost:userEmail").get(async (req, res) => {
  try {
    const userEmail = req.params.userEmail;
    const posts = await user.find({ email: userEmail });
    res.status(200).json({
      post: posts,
    });
  } catch (error) {
    res.json({ error: error });
  }
});

//add comments in the post using postId

router.route("/addComment:userEmail").post(async (req, res) => {

  try {
    const { desc, userId, postId } = req.body;
    const userEmail = req.params.userEmail;

    const userPost = await user.findOne({ email: userEmail });
    let userPostDetails = userPost.post_details;

    const findPost = userPost.post_details.filter((post, id) => {
      return post.postId == postId;
    });

    const filterPostComment = userPost.post_details
      .filter((postDetails, id) => {
        return postDetails.postId == postId;
      })
      .map((data, id) => {
        return data.comment;
      });

    const updateComment = [
      ...filterPostComment,
      [{ desc: desc, userId: userId }],
    ];
    console.log(updateComment);

    //retrive data
    // const da=updateComment.map((dat)=>{
    //   return dat.map((e)=>{
    //     return e.desc

    //   })
    // })
    // console.log(da)

    findPost.every((element) => (element.comment = updateComment));
    console.log(userPostDetails);

    const updatePostComment = await user.findOneAndUpdate(
      { email: userEmail },

      { post_details: [...userPostDetails] },
      { new: true }
    );

    console.log(updatePostComment)

    res.status(200).json({ userPost: updateComment });

  } catch (error) {

    res.status(400).json({ err: error });
  }
});
//get individual post comment
router.route("/getComments").post((req,res)=>{
  
})
module.exports = router;
