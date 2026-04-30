import { handleRecommendationQuery } from "../agents/recommendation.agent.js";

export const recommendationController = async (req, res) => {
  const { productId } = req.body;

  if (!productId) {
    return res.status(400).json({ message: "productId is required" });
  }

  try {
    const result = await handleRecommendationQuery(Number(productId));

    return res.status(200).json({
      reply: result.answer,
      source: result.source,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};
