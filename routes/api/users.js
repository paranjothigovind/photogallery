const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const keys = require("../../config/keys");
const passport = require("passport");

// Load input validation
const validateRegisterInput = require("../../validation/register");
const validateLoginInput = require("../../validation/login");

// Load User model
const User = require("../../models/User");

// @route POST api/users/register
// @desc Register user
// @access Public
router.post("/register", (req, res) => {
  // Form validation

  const { errors, isValid } = validateRegisterInput(req.body);

  // Check validation
  if (!isValid) {
    return res.status(400).json(errors);
  }

  User.findOne({ email: req.body.email }).then(user => {
    if (user) {
      return res.status(400).json({ email: "Email already exists" });
    } else {
      const newUser = new User({
        name: req.body.name,
        email: req.body.email,
        password: req.body.password
      });

      // Hash password before saving in database
      bcrypt.genSalt(10, (err, salt) => {
        bcrypt.hash(newUser.password, salt, (err, hash) => {
          if (err) throw err;
          newUser.password = hash;
          newUser
            .save()
            .then(user => res.json(user))
            .catch(err => console.log(err));
        });
      });
    }
  });
});

// @route POST api/users/login
// @desc Login user and return JWT token
// @access Public
router.post("/login", (req, res) => {
  // Form validation

  const { errors, isValid } = validateLoginInput(req.body);

  // Check validation
  if (!isValid) {
    return res.status(400).json(errors);
  }

  const email = req.body.email;
  const password = req.body.password;
  const photo=req.body.photo;
  const post=req.body.post;
  const comment=req.body.comment;

  // Find user by email
  User.findOne({ email }).then(user => {
    // Check if user exists
    if (!user) {
      return res.status(404).json({ emailnotfound: "Email not found" });
    }

    // Check password
    bcrypt.compare(password, user.password).then(isMatch => {
      if (isMatch) {
        // User matched
        // Create JWT Payload
        const payload = {
          id: user.id,
          name: user.name
        };

        // Sign token
        jwt.sign(
          payload,
          keys.secretOrKey,
          {
            expiresIn: 31556926 // 1 year in seconds
          },
          (err, token) => {
            res.json({
              success: true,
              token: "Bearer " + token
            });
          }
        );
      } else {
        return res
          .status(400)
          .json({ passwordincorrect: "Password incorrect" });
      }
    });
  });
});

router.put('/updatePhoto/:id',(req,res) => {
  const id = req.params.id;

  User.findByIdAndUpdate(id, {photo:req.body.photo}, { useFindAndModify: false })
    .then(data => {
      if (!data) {
        res.status(404).send({
          message: `CANNOT_UPDATE${id}_MAY_BE_ID_NOT_FOUND`
        });
      } else res.send({ message: "DETAILS_UPDATED" });
    })
    .catch(err => {
      res.status(500).send({
        message: "ERROR_UPDATING" + id
      });
    });
})

router.put('/addComment/:id',(req,res) => {
  const id = req.params.id;
  const postId=req.params.postId;

  User.findByIdAndUpdate(id, {
    $push: {
      comment:req.body.comment
    }
  }, { useFindAndModify: false })
    .then(data => {
      if (!data) {
        res.status(404).send({
          message: `CANNOT_UPDATE_COMMENT_${id}_MAY_BE_NOT_FOUND!`
        });
      } else res.send({ message: "DETAILS_UPDATED" });
    })
    .catch(err => {
      res.status(500).send({
        message: "ERROR_UPDATING_DETAILS_ID" + id
      });
    });
})

router.put('/removePost/:id',(req,res) => {
  const id = req.params.id;

  User.findByIdAndUpdate(id, {
    photo:'',
    comment:''
  }, { useFindAndModify: false })
    .then(data => {
      if (!data) {
        res.status(404).send({
          message: `CANNOT_UPDATE_COMMENT_${id}_MAY_BE_NOT_FOUND!`
        });
      } else res.send({ message: "DETAILS_UPDATED" });
    })
    .catch(err => {
      res.status(500).send({
        message: "ERROR_UPDATING_DETAILS_ID" + id
      });
    });
})

module.exports = router;
