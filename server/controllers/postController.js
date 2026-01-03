const { get } = require("http");
const user = require("../models/schema");
async function createPost(req, res) {
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
    await userexist.save();
    console.log(itemDetail.post_details);
    res.status(200).json({ itemDetail: itemDetail });
  } else {
    res.json({ error: "user does not exist" });
  }
}

async function getPostComments(req, res) {
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
}

module.exports = { createPost ,getPostComments };
