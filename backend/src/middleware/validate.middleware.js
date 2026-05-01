import AppError from "../utils/app-error.js";

function validateWith(schema) {
  return function validationMiddleware(request, _response, next) {
    const result = schema(request.body);

    if (!result.success) {
      return next(new AppError("Validation failed", 422, result.errors));
    }

    request.validatedBody = result.data;
    return next();
  };
}

export default validateWith;
