const asynchandler = require("express-async-handler");
const user = require("../models/schema");
const express = require("express");
const { model } = require("mongoose");
async function registerUser(req, res) {
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
}

module.exports = { registerUser };