const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const userModel = require("../model/userModel");
const authController = require("../controller/authController");
const formidable = require("formidable");
const fs = require("fs");

exports.register = function(req, res) {
  new formidable.IncomingForm().parse(req, (err, fields, files) => {
    if (err) {
      console.log(err);
      res.status(400).send({ message: "Your request is bad" });
    }
    const salt = bcrypt.genSaltSync(10);
    let data = fields;
    data.password = bcrypt.hashSync(data.password, salt);
    userModel.register(data, files, (error, databack) => {
      if (error) {
        console.log(error);
        res.status(400).send({ message: databack });
      } else {
        res.status(200).send({ message: "Successfully register" });
      }
    });
    // clear tmp file
    if (files.profilePicture) {
      fs.unlink(files.profilePicture.path, err => {
        if (err) console.log(err);
      });
    }
  });
};

exports.login = function(req, res) {
  userModel.getUserByUsername(req.body, (error, data) => {
    if (error) throw error;

    if (data.length == 0) {
      res.status(401).send({ message: "Your username or password are wrong" });
    } else {
      var user = data[0];

      bcrypt.compare(req.body.password, user.password, function(err, match) {
        if (err) {
          console.log(err);
          res.status(500).send({
            message: "The service is not available, please try again"
          });
        }
        if (match) {
          const token = jwt.sign(
            { username: user.username },
            process.env.SECRET
          );
          res.json({ token: token });
        } else {
          res
            .status(401)
            .send({ message: "Your username or password are wrong" });
        }
      });
    }
  });
};

exports.updateUser = function(req, res) {
  authController.verifyToken(req, res, function() {
    let data = req.body;
    userModel.updateUser(data, (error, databack) => {
      if (error) throw error;
      res.status(200).json(databack);
    });
  });
};

exports.retrieveUserData = function(req, res) {
  authController.verifyToken(req, res, function() {
    userModel.getUserByUsername(req.body, (err, databack) => {
      if (err) {
        console.log(err);
        res.status(401).json(err);
      } else {
        res.status(200).json(databack);
      }
    });
  });
};

exports.forgotPassword = function(req, res) {
  new formidable.IncomingForm().parse(req, (err, fields, files) => {
    if (err) {
      res.status(400).send({ message: "Your request is bad" });
    }
    let data = fields;
    userModel.forgotPassword(data, files, (error, databack) => {
      if (error) {
        res.status(400).send({ error: error });
      } else {
        res.status(200).send({
          message: "Successfully changed your password, please proceed to login"
        });
      }
    });
  });
};
