import { prisma } from "../services/prisma.js";
import { v4 as uuidv4 } from "uuid";
import { razorpay } from "../services/razorpay.js";
//crypto is a built-in Node.js module - used for HMAC-SHA256 hashing
//HMAC = Hash based Message Authentication Code
//SHA256 = the hashing algorithm
//crypto is used to recreate Razorpay's signature so you can verify the payment request is genuine and not tampered with.
import crypto from "crypto";

export const checkoutController = async (req, res) => {
  const { addressId, cartType } = req.body;
  const parsedAddressId = Number(addressId);
  const parsedCartType = cartType;

  const userId = Number(req.user.id);
  if (!addressId || !cartType) {
    return res.status(400).json({
      message: "All fields are required",
    });
  }

  //isNaN() stands for "is Not-a-Number".
  // It is a function used to check if a value is a mathematically valid number or not.

  if (isNaN(parsedAddressId)) {
    return res.status(400).json({
      message: "Invalid addressId",
    });
  }

  if (!["REGULAR", "BUY_NOW"].includes(parsedCartType)) {
    return res.status(400).json({ message: "Invalid cartType" });
  }

  try {
    const address = await prisma.address.findFirst({
      where: {
        id: parsedAddressId,
        userId: userId,
      },
    });

    if (!address) {
      return res.status(404).json({
        message: "Address not found",
      });
    }

    const cart = await prisma.cart.findFirst({
      where: {
        userId: userId,
        cartType: parsedCartType,
      },
    });

    if (!cart) {
      return res.status(404).json({
        message: "Cart not found",
      });
    }

    const cartItems = await prisma.cartItem.findMany({
      where: {
        cartId: cart.id,
      },
      include: {
        product: true,
      },
    });

    if (cartItems.length === 0) {
      return res.status(400).json({
        message: "Cart is empty",
      });
    }

    const existingPendingOrder = await prisma.order.findFirst({
      where: {
        userId,
        status: "PENDING",
        source: cartType === "BUY_NOW" ? "BUY_NOW" : "CART",
      },
      include: {
        payment: true,
      },
    });

    if (
      existingPendingOrder &&
      existingPendingOrder.payment &&
      !existingPendingOrder.payment.razorpayOrderId
    ) {
      try {
        const razorpayOrder = await razorpay.orders.create({
          amount: Math.round(Number(existingPendingOrder.totalAmount) * 100),
          currency: "INR",
          receipt: "order_" + existingPendingOrder.id,
        });

        await prisma.payment.update({
          where: { orderId: existingPendingOrder.id },
          data: { razorpayOrderId: razorpayOrder.id },
        });

        return res.status(200).json({
          message: "Retrying payment for existing order",
          data: {
            orderId: existingPendingOrder.id,
            razorpayOrderId: razorpayOrder.id,
            amount: existingPendingOrder.totalAmount,
            currency: "INR",
          },
        });
      } catch (retryError) {
        console.error(retryError);
        return res.status(500).json({
          message: "Payment retry failed. Please try again later.",
          orderId: existingPendingOrder.id,
        });
      }
    }

    //?. - only go deeper if the left side is not null/undefined, otherwise just return undefined quietly" instead of crashing
    if (existingPendingOrder && existingPendingOrder.payment?.razorpayOrderId) {
      return res.status(200).json({
        message: "Payment already initiated, please complete payment",
        data: {
          orderId: existingPendingOrder.id,
          razorpayOrderId: existingPendingOrder.payment.razorpayOrderId,
          amount: existingPendingOrder.totalAmount,
          currency: "INR",
        },
      });
    }

    let totalAmount = 0;

    for (let item of cartItems) {
      totalAmount = totalAmount + Number(item.product.price) * item.quantity;
    }

    if (totalAmount <= 0) {
      return res.status(400).json({
        message: "Invalid order amount",
      });
    }

    const result = await prisma.$transaction(async (tx) => {
      for (const item of cartItems) {
        if (item.quantity <= 0) {
          throw new Error(`Invalid quantity for product ${item.product.name}`);
        }

        // User A → transaction starts → locks inventory row
        //User B → transaction starts → tries to read inventory row → WAITS (row is locked)
        //User A → check stock → decrement → commit → releases lock
        //User B → now reads (stock = 0)
        //User B → 0 < quantity → throws error
        //User B → entire transaction ROLLS BACK
        const inventory = await tx.inventory.findFirst({
          where: {
            productId: item.productId,
          },
        });

        if (!inventory) {
          throw new Error(`Inventory not found for product ${item.id}`);
        }

        if (inventory.quantity < item.quantity) {
          throw new Error(
            `Only ${inventory.quantity} available for product ${item.product.name}`,
          );
        }
      }
      const order = await tx.order.create({
        data: {
          userId: userId,
          addressId: parsedAddressId,
          totalAmount: totalAmount,
          status: "PENDING",
          source: parsedCartType === "BUY_NOW" ? "BUY_NOW" : "CART",
        },
      });

      const createdOrderItems = [];
      for (const item of cartItems) {
        const orderItem = await tx.orderItem.create({
          data: {
            orderId: order.id,
            productId: item.productId,
            quantity: item.quantity,
            price: item.product.price,
            status: "PENDING",
          },
        });
        createdOrderItems.push(orderItem);
      }

      for (let item of cartItems) {
        await tx.inventory.update({
          where: {
            productId: item.productId,
          },
          data: {
            quantity: {
              decrement: item.quantity,
            },
          },
        });
      }

      //clear cart shipped to verify payment - because if at last if razorpay OrderId not saved issue
      //razorpayOrderId not saved - Cart is EMPTY - User tries checkout again → "Cart is empty"
      //Razorpay fails → cart still has items → user retries checkout
      //Payment verified → cart cleared

      // await tx.cartItem.deleteMany({
      //     where:{
      //         cartId:cart.id
      //     }
      // })

      const payment = await tx.payment.create({
        data: {
          orderId: order.id,
          amount: totalAmount,
          status: "PENDING",
        },
      });

      const today = new Date();
      //today.toISOString() - 2026-04-19T07:30:45.123Z
      //.slice(0, 10) - 2026-04-19
      //.replace(/-/g, "") - 20260419
      const datePart = today.toISOString().slice(0, 10).replace(/-/g, "");
      

      for(let item of createdOrderItems){
        const invoiceNumber = `INV-${datePart}-${uuidv4().slice(0, 6)}`; //INV-20260419-a3f9c1
        await tx.invoice.create({
        data: {
          orderId: order.id,
          orderItemId:item.id,
          paymentId: payment.id,
          invoiceNumber: invoiceNumber,
          status: "UNPAID",
        },
      });
      }

      return { order, payment };
    });

    //razorpay.orders.create() tells Razorpay:
    //"Hey Razorpay, I want to collect ₹500 from my user. Create a payment session for this."
    try {
      const razorpayOrder = await razorpay.orders.create({
        //(Math.round()): 876708.56 rounds to 876709 (Rounds up, >=.5) // 876708.46 rounds to 876708 (Rounds up, <=.5)

        amount: Math.round(totalAmount * 100),
        //Tells Razorpay which currency — Indian Rupees
        currency: "INR",
        //internal reference — like a label so you know which order this payment belongs to. Not shown to user, just for yourtracking
        receipt: "order_" + result.order.id,
      });

      //What Razorpay Returns
      //razorpayOrder = {
      // id: "order_xyz123",    ← razorpayOrderId (send to frontend)
      // amount: 50000,
      // currency: "INR",
      // status: "created"
      //} Frontend uses razorpayOrder.id to open payment modal

      await prisma.payment.update({
        where: {
          orderId: result.order.id,
        },
        data: {
          razorpayOrderId: razorpayOrder.id,
        },
      });

      return res.status(201).json({
        message: "Order placed successfully",
        data: {
          orderId: result.order.id,
          razorpayOrderId: razorpayOrder.id,
          amount: totalAmount,
          currency: "INR",
        },
      });
    } catch (razorpayError) {
      console.error(razorpayError);
      // Order exists in DB but payment failed
      // let user retry payment
      //frontend - go to payment failed page retry payment
      return res.status(500).json({
        message:
          "Order created but payment initiation failed. Please retry payment.",
        orderId: result.order.id, // ← return orderId so user can retry
      });
    }
  } catch (error) {
    console.error(error);
    if (
      error.message?.includes("available") ||
      error.message?.includes("Inventory") ||
      error.message?.includes("Invalid quantity")
    ) {
      return res.status(400).json({ message: error.message });
    }
    return res.status(500).json({
      message: "failed to checkout order",
    });
  }
};

export const verifyPaymentController = async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
    req.body;

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return res.status(400).json({
      message: "All fields are required",
    });
  }

  //It creates a secure hash using a secret key to verify data integrity, ensuring the payment details haven't been tampered with.
  //crypto.createHmac creates a unique digital fingerprint using a secret key to verify that data hasn't been tampered with.
  //crypto.createHmac() in Node.js creates and returns an HMAC (Hash-based Message Authentication Code) object, used for verifying both the integrity and authenticity of data using a secret key

  //createHmac(algorithm, secret)
  //What it does:
  //- Creates a HMAC machine/calculator
  //- Locks it with your SECRET_KEY
  //- "sha256" tells it which hashing algorithm to use
  //Think of it like:
  //You buy a locked calculator
  //The lock combination = your SECRET_KEY
  //Nobody else can use this exact calculator without the key

  //SHA-256 (Secure Hash Algorithm 256-bit) is a cryptographic "one-way" function
  //It takes any amount of data and turns it into a unique 256-bit (64-character) string.
  const expectedSignature = crypto
    //It create hmac machine and lock usibg secret key and feed the data like orderid and payId in machine
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    //What it does:(update)
    //- Feeds the data into the machine
    //- Data = "order_xyz|pay_abc"
    //- | is just a separator Razorpay chose — no special meaning

    //Think of it like:
    //You put the paper into the locked calculator
    //paper = "order_SR3qmm5yes1bmX|pay_test_dummy123"
    .update(razorpay_order_id + "|" + razorpay_payment_id)
    .digest("hex");
  // What it does:
  //- Runs the machine and produces the final output
  //- "hex" = format the output as hexadecimal string (0-9, a-f)

  //Next Step:
  //- Match → payment is real, came from Razorpay
  //- No match → someone tampered/faked the request → reject

  if (expectedSignature !== razorpay_signature) {
    return res.status(400).json({
      message: "Invalid payment signature",
    });
  }

  try {
    const payment = await prisma.payment.findUnique({
      where: {
        razorpayOrderId: razorpay_order_id,
      },
      include: {
        order: true,
      },
    });

    if (!payment) {
      return res.status(404).json({
        message: "Payment not found",
      });
    }

    if (payment.status === "PAID") {
      const invoice = await prisma.invoice.findMany({
        where: {
          orderId: payment.order.id,
        },
      });
      return res.status(400).json({
        message: "Payment already verified",
        data: {
          orderId: payment.order.id,
          razorpayPaymentId: payment.razorpayPaymentId,
          invoiceNumber: invoice.map(inv => inv.invoiceNumber),
          orderStatus: payment.order.status,
          amount: payment.amount,
        },
      });
    }

    const cart = await prisma.cart.findFirst({
      where: {
        userId: payment.order.userId,
        cartType: payment.order.source === "BUY_NOW" ? "BUY_NOW" : "REGULAR",
      },
    });

    const result = await prisma.$transaction(async (tx) => {
      await tx.payment.update({
        where: {
          id: payment.id,
        },
        data: {
          razorpayPaymentId: razorpay_payment_id,
          razorpaySignature: razorpay_signature,
          status: "PAID",
        },
      });

      await tx.order.update({
        where: {
          id: payment.order.id,
        },
        data: {
          status: "CONFIRMED",
        },
      });

      await tx.invoice.updateMany({
        where: {
          orderId: payment.order.id,
        },
        data: {
          status: "PAID",
          paidAt: new Date(),
        },
      });

      if (cart) {
        await tx.cartItem.deleteMany({
          where: {
            cartId: cart.id,
          },
        });
      }

      return {
        orderId: payment.order.id,
        razorpayPaymentId: razorpay_payment_id,
        orderStatus: "CONFIRMED",
        amount: payment.amount,
      };
    });

    return res.status(200).json({
      message: "Payment verified successfully",
      data: {
        orderId: result.orderId,
        razorpayPaymentId: result.razorpayPaymentId,
        orderStatus: result.orderStatus,
        amount: result.amount,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Failed to verify payment",
    });
  }
};

// What is Pagination?

//   Imagine you have 100 orders in the database. Sending all 100 at once is slow and wastes bandwidth. Pagination splits them
//   into pages — like a book.

//   Example: 10 orders per page
//   - Page 1 → orders 1–10
//   - Page 2 → orders 11–20
//   - Page 3 → orders 21–30

// Two query params come from the frontend:
//   - page — which page number (e.g. 1, 2, 3)
//   - limit — how many items per page (e.g. 10)
// The math:
//   skip = (page - 1) * limit

//   Page 1: skip = (1-1) * 10 = 0   → start from row 0
//   Page 2: skip = (2-1) * 10 = 10  → skip first 10, start from row 10
//   Page 3: skip = (3-1) * 10 = 20  → skip first 20, start from row 20
export const getMyOrdersController = async (req, res) => {
  const userId = Number(req.user.id);
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  try {
    const totalOrders = await prisma.order.count({
      where: {
        userId: userId,
      },
    });

    const orders = await prisma.order.findMany({
      where: {
        userId: userId,
      },
      include: {
        orderItem: {
          include: {
            product: true,
          },
        },
        address: true,
        payment: true,
        invoice: true,
      },
      orderBy: {
        createdAt: "desc",
      },
      skip: skip, //skip → how many records to ignore
      take: limit, //take → how many records to fetch
    });

    const totalPages = Math.ceil(totalOrders / limit);

    return res.status(200).json({
      message: "Orders fetched Successfully",
      data: orders,
      pagination: {
        totalOrders,
        totalPages,
        currentPage: page,
        limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Failed to fetch orders",
    });
  }
};
export const getMyOrderByIdController = async (req, res) => {
  const userId = Number(req.user.id);
  const orderId = Number(req.params.orderId);

  if (isNaN(orderId)) {
    return res.status(400).json({
      message: "Invalid orderId",
    });
  }
  try {
    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        userId: userId,
      },
      include: {
        orderItem: {
          include: {
            product: true,
          },
        },
        address: true,
        payment: true,
        invoice: true,
      },
    });

    if (!order) {
      return res.status(404).json({
        message: "Order not found",
      });
    }

    return res.status(200).json({
      message: "Order fetched successfully",
      data: order,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Failed to fetch order",
    });
  }
};

export const adminGetAllOrdersController = async (req, res) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const status = req.query.status;
  if (
    status &&
    ![
      "PENDING",
      "CONFIRMED",
      "PARTIALLY_DELIVERED",
      "DELIVERED",
      "PARTIALLY_CANCELLED",
      "CANCELLED",
    ].includes(status)
  ) {
    return res.status(400).json({
      message: "Invalid status",
    });
  }
  const userId = req.query.userId ? Number(req.query.userId) : null;
  if (req.query.userId && isNaN(userId)) {
    return res.status(400).json({
      message: "Invalid userId",
    });
  }

  try {
    const where = {};
    if (status) where.status = status;
    if (userId) where.userId = userId;
    const totalOrders = await prisma.order.count({ where });

    const order = await prisma.order.findMany({
      where: where,
      include: {
        orderItem: {
          include: {
            product: true,
          },
        },
        address: true,
        payment: true,
        invoice: true,
      },
      orderBy: {
        createdAt: "desc",
      },
      skip: skip,
      take: limit,
    });

    const totalPages = Math.ceil(totalOrders / limit);

    return res.status(200).json({
      message: "All Orders fetched successfully",
      data: order,
      pagination: {
        totalOrders,
        totalPages,
        currentPage: page,
        limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Failed to fetch all orders",
    });
  }
};
