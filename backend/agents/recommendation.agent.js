import { ollamaGenerate } from "../services/ollama.js";
import { prisma } from "../services/prisma.js";
import dotenv from "dotenv";
dotenv.config();

export async function handleRecommendationQuery(productId) {
  const product = await prisma.product.findFirst({
    where: { id: productId, is_active: true },
    include: { category: true },
  });

  if (!product) {
    return {
      answer: "Product not found.",
      source: "recommendation",
    };
  }

  const otherProducts = await prisma.product.findMany({
    where: { is_active: true, id: { not: productId } },
    include: { category: true },
    take: 20,
  });

  if (otherProducts.length === 0) {
    return {
      answer: [],
      source: "recommendation",
    };
  }

  const productList = otherProducts
    .map(
      (p) =>
        `ID:${p.id} | ${p.name} | ${p.category.name} | ${p.brand} | ₹${p.price}`,
    )
    .join("\n");

  const prompt = `Which product IDs from this list are most similar to "${product.name}" (${product.category.name})?

${productList}

Reply with only the IDs as numbers separated by commas. Example: 2,3,4
Answer:`;

  const reply = await ollamaGenerate(prompt, {
    model: process.env.OLLAMA_MODEL,
    stream: false,
  });

  console.log("LLM raw reply:", reply);

  // extract all numbers found anywhere in the response
  let recommendedIds = [];
  const numbers = reply?.match(/\b\d+\b/g);
  if (numbers) {
    recommendedIds = numbers.map(Number);
  }

  const validIds = otherProducts.map((p) => p.id);
  const filteredIds = recommendedIds.filter((id) => validIds.includes(id));

  const recommendedProducts = await prisma.product.findMany({
    where: { id: { in: filteredIds }, is_active: true },
    include: { category: true, inventory: true },
  });

  const sorted = filteredIds
    .map((id) => recommendedProducts.find((p) => p.id === id))
    .filter(Boolean);

  return {
    answer: sorted,
    source: "recommendation",
  };
}
