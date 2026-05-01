import asyncHandler from "../utils/async-handler.js";
import { getHiringAnalytics } from "../services/analytics.service.js";

export const hiring = asyncHandler(async (request, response) => {
  const result = await getHiringAnalytics(request.query);
  response.status(200).json(result);
});
