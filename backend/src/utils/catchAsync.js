// Wraps an async controller so any rejected promise (thrown error) is
// automatically passed to next(err) instead of crashing the process or
// requiring a try/catch in every single controller.
function catchAsync(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

module.exports = catchAsync;
