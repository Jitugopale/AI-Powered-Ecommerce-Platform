import { prisma } from "../services/prisma.js";

export const addCategoryController = async (req, res) => {
  const { name } = req.body;

  if (!name) {
    return res.status(400).json({
      message: "Category name is required",
    });
  }

  try {
    const caregoryExists = await prisma.categories.findFirst({
      where: {
        name: name,
      },
    });

    if (caregoryExists) {
      return res.status(400).json({
        message: "Category already exits",
      });
    }
    const Category = await prisma.categories.create({
      data: {
        name: name,
      },
    });

    return res.status(201).json({
      message: "Category added Successfully",
      data: Category,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Failed to add category",
    });
  }
};

export const getAllCategoriesController = async (req, res) => {
  try {
    const categories = await prisma.categories.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.status(200).json({
      message: "Categories fetched successfully",
      data: categories,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Failed to fetch categories",
    });
  }
};

export const updateCategoryController = async (req, res) => {
  try {
    const categoryId = Number(req.params.categoryId);

    if (isNaN(categoryId)) {
      return res.status(400).json({
        message: "Invalid categoryId",
      });
    }
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({
        message: "name is required",
      });
    }

    const category = await prisma.categories.findUnique({
      where: {
        id: categoryId,
      },
    });

    if (!category) {
      return res.status(404).json({
        message: "Category not found",
      });
    }

    const updatedCategory = await prisma.categories.update({
      where: {
        id: categoryId,
      },
      data: {
        name: name,
      },
    });

    return res.status(200).json({
      message: "Category updated successfully",
      data: updatedCategory,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Failed to update category",
    });
  }
};

export const deleteCategoryController = async (req, res) => {
  try {
    const categoryId = Number(req.params.categoryId);

    if (isNaN(categoryId)) {
      return res.status(400).json({
        message: "Invalid categoryId",
      });
    }

    const category = await prisma.categories.findUnique({
      where: {
        id: categoryId,
      },
    });

    if (!category) {
      return res.status(404).json({
        message: "Category not found",
      });
    }

    const deleteCategory = await prisma.categories.delete({
      where: {
        id: categoryId,
      },
    });

    return res.status(200).json({
      message: "Category deleted successfully",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Failed to delete category",
    });
  }
};
