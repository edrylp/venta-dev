const errorHandler = (err, req, res, next) => {
  const isProd = process.env.NODE_ENV === "production";
  const status = err.statusCode || 500;

  if (status >= 500) console.error(err); 

  res.status(status).json({
    success: false,
    message: status >= 500 && isProd ? "Something went wrong" : err.message,
  });
};

export default errorHandler;