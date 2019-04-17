const axios = require("axios");
var jwt = require("jsonwebtoken");
const Profile = require("../models/profile.model.js");

const JWT_SECRET = process.env.JWT_SECRET || "verySecret$%#$%@#!#!$!!";

// Create and Save a new user
exports.fbSignin = (req, res) => {
  axios
    .post(
      "https://graph.facebook.com/me?fields=id,name,email,picture.width(800).height(800)&access_token=" +
        req.query.accessToken
    )
    .then(fbResponse => {
      const fbUser = fbResponse.data;

      // find user or create one
      findUserinDB(fbUser, res);
    })
    .catch(err => {
      res.status(500).send({
        message: err.message || "Some error occurred while creating the user."
      });
    });
};

function findUserinDB(fbUser, res) {
  Profile.findOne({ fbId: fbUser.id })
    .then(profile => {
      if (profile == null || !profile.length) {
        //profile not found. Create one
        return createFBUser(fbUser, res);
      }
      res.send(profile);
    })
    .catch(err => {
      console.log(err);
      return res.status(500).send({
        message: "Error retrieving user with fb id " + fbUser.id
      });
    });
}

function createFBUser(fbUser, res) {
  var token = jwt.sign({ email: fbUser.email }, JWT_SECRET);

  const profile = new Profile({
    name: fbUser.name,
    profilePic: fbUser.profilePic,
    email: fbUser.email,
    social: fbUser.social,
    skills: fbUser.skills,
    confAttended: fbUser.confAttended,
    confUpcoming: fbUser.confUpcoming,
    meetupAttended: fbUser.meetupAttended,
    meetupUpcoming: fbUser.meetupUpcoming,
    fbId: fbUser.id,
    authToken: token
  });

  // Save profile in the database
  return profile
    .save()
    .then(data => {
      res.send(data);
    })
    .catch(err => {
      res.status(500).send({
        message: err.message || "Some error occurred while creating the user."
      });
    });
}

// Create and Save a new profile
exports.create = (req, res) => {
  const profile = new Profile({
    name: req.body.name,
    profilePic: req.body.profilePic,
    email: req.body.email,
    social: req.body.social,
    skills: req.body.skills,
    confAttended: req.body.confAttended,
    confUpcoming: req.body.confUpcoming,
    meetupAttended: req.body.meetupAttended,
    meetupUpcoming: req.body.meetupUpcoming
  });

  console.log(profile);
  // Save profile in the database
  profile
    .save()
    .then(data => {
      res.send(data);
    })
    .catch(err => {
      res.status(500).send({
        message:
          err.message || "Some error occurred while creating the profile."
      });
    });
};

// Retrieve and return all profiles from the database.
exports.findAll = (req, res) => {
  Profile.find()
    .then(profiles => {
      res.send(profiles);
    })
    .catch(err => {
      res.status(500).send({
        message: err.message || "Some error occurred while retrieving profiles."
      });
    });
};

// Find a single profile with a id
exports.findOne = (req, res) => {
  Profile.findById(req.params.id)
    .then(profile => {
      if (!profile) {
        return res.status(404).send({
          message: "profile not found with id " + req.params.id
        });
      }
      res.send(profile);
    })
    .catch(err => {
      if (err.kind === "ObjectId") {
        return res.status(404).send({
          message: "profile not found with id " + req.params.id
        });
      }
      return res.status(500).send({
        message: "Error retrieving profile with id " + req.params.id
      });
    });
};

exports.me = (req, res) => {
  const email = req.user.email;
  Profile.findOne({ email: email })
    .then(profile => {
      if (!profile) {
        return res.status(404).send({
          message: "profile not found with email " + email
        });
      }
      res.send(profile);
    })
    .catch(err => {
      if (err.kind === "ObjectId") {
        return res.status(404).send({
          message: "profile not found with email " + email
        });
      }
      return res.status(500).send({
        message: "Error retrieving profile with email " + email
      });
    });
};

// Update a profile identified by the id in the request
exports.update = (req, res) => {
  Profile.findByIdAndUpdate(
    req.params.id,
    {
      name: req.body.name,
      profilePic: req.body.profilePic,
      email: req.body.email,
      social: req.body.social,
      skills: req.body.skills,
      confAttended: req.body.confAttended,
      confUpcoming: req.body.confUpcoming,
      meetupAttended: req.body.meetupAttended,
      meetupUpcoming: req.body.meetupUpcoming
    },
    { new: true }
  )
    .then(profile => {
      if (!profile) {
        return res.status(404).send({
          message: "profile not found with id " + req.params.id
        });
      }
      res.send(profile);
    })
    .catch(err => {
      if (err.kind === "ObjectId") {
        return res.status(404).send({
          message: "profile not found with id " + req.params.id
        });
      }
      return res.status(500).send({
        message: "Error updating profile with id " + req.params.id
      });
    });
};

// Delete a profile with the specified id in the request
exports.delete = (req, res) => {
  Profile.findByIdAndRemove(req.params.id)
    .then(profile => {
      if (!profile) {
        return res.status(404).send({
          message: "profile not found with id " + req.params.id
        });
      }
      res.send({ message: "profile deleted successfully!" });
    })
    .catch(err => {
      if (err.kind === "ObjectId" || err.name === "NotFound") {
        return res.status(404).send({
          message: "profile not found with id " + req.params.id
        });
      }
      return res.status(500).send({
        message: "Could not delete profile with id " + req.params.id
      });
    });
};