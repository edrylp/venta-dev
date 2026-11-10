const validate =
  (validator, source = "body") =>
  async (req, _res, next) => {
    try {
      req.validated ??= {};
      req.validated[source] = await validator.validate(req[source]);
      next();
    } catch (err) {
      next(err);
    }
  };

export default validate;