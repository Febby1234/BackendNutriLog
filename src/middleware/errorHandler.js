export const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  if (err.type === 'validation_error') {
    return res.status(400).json({
      message: 'Validation Error',
      errors: err.details,
    });
  }

  if (err.code === 'DUPLICATE_KEY') {
    return res.status(409).json({
      message: 'Data sudah terdaftar',
    });
  }

  res.status(err.status || 500).json({
    message: err.message || 'Terjadi kesalahan server',
  });
};

export default errorHandler;
