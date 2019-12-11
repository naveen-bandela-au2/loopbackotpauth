// Copyright IBM Corp. 2014,2019. All Rights Reserved.
// Node module: loopback-example-user-management
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

var config = require("../../server/config.json");
var path = require("path");
var utils = require("loopback/lib/utils");
//var bcrypt = require('bcrypt.js');
//var jwt = require('jsonwebtoken');
bcrypt = require("bcryptjs");
//Replace this address with your actual addresss
var senderAddress = "noreply@loopback.com";

function generateOTP() {
  var digits = "0123456789";
  let OTP = "";
  for (let i = 0; i < 6; i++) {
    OTP += digits[Math.floor(Math.random() * 10)];
  }
  return OTP;
}

module.exports = function(User) {
  User.on("resetPasswordRequest", async info => {
    var Id = info.accessToken.userId;
    var otp = generateOTP();
    console.log(otp, "otp");
    User.setPassword(Id, otp, function() {});

    User.findById(Id, (err, inst) => {
      User.upsertWithWhere(
        { email: inst.email },
        { date: Date.now() },
        () => {}
      );
      return inst;
    });

    User.app.models.Email.send(
      {
        to: info.email,
        from: "b.naveen2085@gmail.com",
        subject: "login otp",
        html: `you otp for login is ${otp}`
      },
      function(err) {
        if (err) return console.log("> error sending password reset email");
        console.log("> sending password reset email to:", info.email);
      }
    );
  });

  //scrap just wrote for praticing
  User.greet = async (msg, cb) => {
    User.app.models.Email.send(
      {
        to: "naveentechworld@gmail.com",
        from: "b.naveen2085@gmail.com",
        subject: "Password reset",
        html: msg
      },
      async err => {
        if (err) return console.log("> error sending password reset email");
        console.log("> sending password reset email to:", info.email);
      }
    );

    cb(null, "Greetings... " + msg);
  };

  User.remoteMethod("greet", {
    accepts: { arg: "msg", type: "string" },
    returns: { arg: "greeting", type: "string" },
    http: { path: "/hai", verb: "get" }
  });

  User.otp = async cb => {
    cb(null, generateOTP());
  };

  User.remoteMethod("otp", {
    returns: { arg: "OTP", type: "string" },
    http: { path: "/otp", verb: "get" }
  });

  User.t1 = function(cb) {
    User.accessToken.create({ name: "naveen", age: 200, ttl: 2154 }, function(
      err,
      suc
    ) {
      cb(null, suc);
    });
  };
  // this.accessTokens.create
  User.remoteMethod("t1", {
    returns: { arg: "token", type: "object" },
    http: { path: "/t1", verb: "get" }
  });

  User.t2 = function(cb) {
    User.find({ where: { realm: "naveen" } }, function(err, data) {
      bcrypt.compare("076409", data[0].password, function(err, isMatch) {
        if (err) return console.log(err);
        console.log(isMatch);
      });
    });
    console.log(Date.now(), "dateeee", config.app_config.otp_expiry);
    User.accessToken.create(
      {
        email: "naveentechworld@gmail.com",
        password: "592871",
        age: 200,
        ttl: 2154
      },
      function(err, suc) {
        cb(null, suc);
      }
    );
  };
  // this.accessTokens.create
  User.remoteMethod("t2", {
    returns: { arg: "token", type: "object" },
    http: { path: "/t2", verb: "get" }
  });
};
