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
    return res.status(404).json({
      answer: "Product not found.",
      source: "recommendation",
    });
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
    .join("\n"); //combine all array items into ONE string
  //ID:3 | Nike Running Shoes | Sports | Nike | ₹3999
  // ID:4 | Levi's Jeans | Fashion | Levi's | ₹2499
  // ID:5 | Tata Salt 1kg | Groceries | Tata | ₹25
  console.log("recommend", productList);

  //giving product data + getting similar product IDs
  const prompt = `
From the list below, select ONLY products that are truly similar to "${product.name}" (${product.category.name}).

Strict rules:
- Must belong to the SAME category
- Must be logically similar product type
- Ignore unrelated items

${productList}

Return ONLY IDs as comma-separated values (e.g., 2,3)
Answer:
`;

  //send the prompt to AI
  const reply = await ollamaGenerate(prompt, {
    model: process.env.OLLAMA_MODEL,
    stream: false,
  });

  console.log("LLM raw reply:", reply);
  //   LLM raw reply: Here are the IDs of products that are most similar to "Samsung 55 incch TV" (Electronics):

  //     ID:2 - iPhone 15
  //     ID:3 - Nikes Running Shoes
  //     ID:4 - Levis Jeanes

  let recommendedIds = []; //store final IDs
  const numbers = reply?.match(/\b\d+\b/g); //match() - finds things in a string using a pattern
  ///\b\d+\b/g - Find all numbers in the text const numbers = ["2", "3", "4"];
  //regex pattern \d = digit (0–9) | + = one or more => 1, 23, 456
  // \b - word boundary (match full number only) ID:123abc 45 => 45
  // /g - Find ALL matches in the string(with g only first match)
  if (numbers) {
    recommendedIds = numbers.map(Number); //Convert strings → numbers
    //[2, 3, 4]
  }

  const validIds = otherProducts.map((p) => p.id); //Take all products from DB Extract only their IDs
//otherProducts = [{ id: 2 },{ id: 3 },{ id: 5 }]; => validIds = [2, 3, 5];
  const filteredIds = recommendedIds.filter((id) => validIds.includes(id)); //Keep only IDs that exist in DB
//recommendedIds = [2, 3, 4]
//validIds = [2, 3, 5]
//filteredIds = [2, 3];

  const recommendedProducts = await prisma.product.findMany({
    where: { id: { in: filteredIds }, is_active: true }, //id: { in: filteredIds } - Get products whose ID is in this list
    //Get products where id = 2 OR id = 3
    include: { category: true, inventory: true },
  });

  //Match products with IDs AND keep the same order as AI returned
  //   filteredIds = [3, 2];
  // recommendedProducts = [{ id: 2, name: "iPhone" },{ id: 3, name: "Shoes" }]; - keep ai order (3,2)
  // o => [{ id: 3, name: "Shoes" },{ id: 2, name: "iPhone" }]
  const sorted = filteredIds
    .map((id) => recommendedProducts.find((p) => p.id === id))
    .filter(Boolean);

  return {
    answer: sorted,
    source: "recommendation",
  };
}
