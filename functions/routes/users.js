const express = require("express");
const fs = require("fs");
const nodemailer = require("nodemailer");
const _ = require("lodash");

const router = express.Router();

// Register or Log in user
module.exports = db => {
  router.post("/", (req, res) => {
    res.set("Cache-Control", "public, max-age=300, s-maxage=600");

    console.log(req.body);

    const collection = db.collection("users");

    const {
      firstName,
      lastName,
      address,
      phoneNumber,
      emailAddress,
      role,
      action
    } = req.body;

    let verificationCode = _.random(1000, 9999);

    const user = {
      firstName,
      lastName,
      ...(address ? { address } : {}),
      ...(phoneNumber ? { phoneNumber } : {}),
      emailAddress,
      role,
      registered: false,
      verificationCode
    };

    if (action === "register") {
      const saveUser = () =>
        collection
          .add(user)
          .then(() => sendVerificationEmail("registration", user, res));

      collection
        .where("emailAddress", "==", emailAddress)
        .get()
        .then(snapshot => {
          if (snapshot.docs.length) {
            const result = snapshot.docs[0];
            if (result.data().registered) {
              res.send({
                success: false,
                message: "Email address has already been used."
              });
            } else {
              collection
                .doc(result.id)
                .delete()
                .then(saveUser);
            }
          } else {
            saveUser();
          }
        });
    }

    if (action === "log in") {
      collection
        .where("emailAddress", "==", emailAddress)
        .where("role", "==", role)
        .where("registered", "==", true)
        .get()
        .then(snapshot => {
          if (snapshot.docs.length) {
            const result = snapshot.docs[0];
            collection
              .doc(result.id)
              .update({ verificationCode })
              .then(() => sendVerificationEmail("login", user, res));
          } else {
            res.send({ success: false, message: "Unable to find user data." });
          }
        });
    }

    if (action === "verify") {
      verificationCode = req.body.verificationCode;

      collection
        .where("emailAddress", "==", emailAddress)
        .get()
        .then(snapshot => {
          if (snapshot.docs.length) {
            const result = snapshot.docs[0];
            if (
              result.data().verificationCode.toString() === verificationCode
            ) {
              collection
                .doc(result.id)
                .update({ registered: true })
                .then(() => res.send({ success: true }));
            } else {
              res.send({ success: false, message: "Unable to verify user." });
            }
          } else {
            // should not happen because user must have been saved in registration step or found in login step
            // unless, user has been deleted afterwards
            res.send({ success: false, message: "Unable to find user data." });
          }
        });
    }
  });

  return router;
};

const sendVerificationEmail = (action, user, res) => {
  const privateInfo = JSON.parse(fs.readFileSync("./privateInfo.json"));

  const transporter = nodemailer.createTransport({
    service: "gmail",
    port: 25,
    secure: false,
    auth: {
      user: "doc4you.app@gmail.com",
      pass: privateInfo.email_password
    },
    tls: {
      rejectUnauthorized: false
    }
  });

  const message = {
    from: "doc4you.app <doc4you.app@gmail.com>",
    to: user.emailAddress,
    subject: `${_.capitalize(action)} Verification Code`,
    html: `<p>Hello,</p><p>Your ${action} verification code is ${user.verificationCode}.</p>`
  };

  transporter.sendMail(message, (err, info) => {
    if (err) {
      console.log("Error occurred. " + err.message);
      res.send({
        success: false,
        message: "Unable to send verification email."
      });
    } else {
      console.log("Message sent: %s", info.messageId);
      res.send({ success: true });
    }
  });
};
