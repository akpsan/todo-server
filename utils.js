import { OAuth2Client } from "google-auth-library";
import jwt from "jsonwebtoken";

const OAuthClient = new OAuth2Client(process.env.GOOGLE_OAUTH_CLIENT_ID);

export const isAuthenticated = (req, res, next) => {
  const bearerHeader = req.headers.authorization;
  if (bearerHeader) {
    const parts = bearerHeader.split(" ");
    if (parts.length === 2) {
      const scheme = parts[0];
      const token = parts[1];
      if (/^Bearer$/i.test(scheme)) {
        jwt.verify(token, process.env.MY_SERVER_SECRET, function (err) {
          if (err) {
            console.log(err);
            res.sendStatus(401);
          } else {
            console.log("Auth success");
            next();
          }
        });
      }
    } else {
      res.sendStatus(401);
    }
  } else {
    res.sendStatus(401);
  }
};

export const verifyOAuth = async (oAuthToken) => {
  let ticket;
  try {
    ticket = await OAuthClient.verifyIdToken({
      idToken: oAuthToken,
      audience: process.env.GOOGLE_OAUTH_CLIENT_ID,
    });
    console.log("Auth success");
    const payload = ticket.getPayload();
    const userid = payload["sub"];
    if (userid) return { userid, payload };
    else return {};
  } catch (e) {
    console.log(e);
    return {};
  }
};

export const getUserDetailsFromToken = (token) => {
  if (token) {
    const parts = token.split(" ");
    if (parts.length === 2) {
      const scheme = parts[0];
      const token = parts[1];
      if (/^Bearer$/i.test(scheme)) {
        const user = jwt.decode(token, process.env.MY_SERVER_SECRET);
        if (user) return user;
        else return null;
      }
    }
  } else {
    return null;
  }
};
