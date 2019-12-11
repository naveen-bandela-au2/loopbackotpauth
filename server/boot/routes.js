// Copyright IBM Corp. 2014,2017. All Rights Reserved.
// Node module: loopback-example-user-management
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT
var config = require("../config.json");
var dsConfig = require("../datasources.json");
var path = require("path");
module.exports = function(app) {
  var User = app.models.user;

  //login home page
  app.get("/", async (req, res) => {
    var credentials = dsConfig.emailDs.transports[0].auth;
    res.render("login", {
      email: "naveentechworld@gmail.com",
      password: ""
    });
  });

  //log a user in
  app.post("/login", async (req, res) => {
    User.find({ where: { email: req.body.email } }, function(err, data) {
      if (data.length > 0) var time = Date.now() - data[0].date;
      if (time < config.app_config.otp_expiry || time == undefined) {
        User.login(
          {
            email: req.body.email,
            password: req.body.password
          },
          "user",
          function(err, token) {
            if (err) {
              if (time == undefined) {
                res.json({ error: "Email id not exists" });
              } else {
                res.json({ error: "Entered wrong otp" });
              }
              return;
            }
            User.upsertWithWhere(
              { email: req.body.email },
              { date: Date.now() - config.app_config.otp_expiry * 2 },
              async () => {}
            );
            res.render("home", {
              email: req.body.email,
              accessToken: token.id,
              redirectUrl: "/api/users/change-password?access_token=" + token.id
            });
          }
        );
      } else {
        res.json({ error: "otp expired" });
      }
    });
  });

  //logout the user with settin a different password
  app.get("/logout", async (req, res, next) => {
    User.findById(req.accessToken.userId, async (err, inst) => {
      User.upsertWithWhere(
        { email: inst.email },
        { date: Date.now() - config.app_config.otp_expiry * 2 },
        async () => {}
      );
    });
    if (!req.accessToken) return res.sendStatus(401);
    User.logout(req.accessToken.id, function(err) {
      if (err) return next(err);
      res.redirect("/");
    });
  });

  //callin the inbuilt user method for password reset
  app.post("/request-password-reset", async (req, res, next) => {
    User.resetPassword(
      {
        email: req.body.email
      },
      function(err) {
        if (err) return res.status(401).send(err);
        res.json({ status: "otp sent sucessfully" });
      }
    );
  });
};
