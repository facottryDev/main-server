// CHECK LOGIN
export const isAuth = (req, res, next) => {
  if (!req.session.username && !req.user) {
    return res.status(401).json("Not Logged In");
  }

  next();
};