import { useState, useEffect } from "react";
import axios from "axios";
import { ShoppingCart, Check, Trash2 } from "lucide-react";
import { Toaster, toast } from "sonner";

const ProductOrderPage = () => {
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState({});
  const [orderList, setOrderList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [orderID, setOrderID] = useState(1);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await axios.get("http://127.0.0.1:8000/api/products/");
        setProducts(response.data);
        const orderResponse = await axios.post(
          "http://127.0.0.1:8000/api/orders/",
          { total_cost: 0 }
        );
        setOrderID(orderResponse.data.id);
        setLoading(false);
      } catch (error) {
        console.error("Failed to fetch products", error);
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const createOrder = (productId) => {
    const product = products.find((p) => p.id === productId);
    const quantity = (orders[productId] || 0) + 1;

    setOrders((prev) => ({
      ...prev,
      [productId]: quantity,
    }));

    const existingOrderIndex = orderList.findIndex(
      (item) => item.productId === productId
    );

    if (existingOrderIndex > -1) {
      const updatedOrderList = [...orderList];
      updatedOrderList[existingOrderIndex].quantity = quantity;
      setOrderList(updatedOrderList);
    } else {
      setOrderList([
        ...orderList,
        {
          productId,
          name: product.name,
          price: product.price,
          quantity,
        },
      ]);
    }

    toast.success(`Added ${product.name} to cart`, {
      description: `Quantity: ${quantity}`,
      duration: 2000,
    });
  };

  const submitOrder = async (productId, quantity) => {
    try {
      // const quantity = orders[productId] || 0;
      var response = await axios.post(
        "http://127.0.0.1:8000/api/order_details/",
        {
          product_id: productId,
          order_id: orderID,
          quantity: quantity,
        }
      );
      const product = products.find((p) => p.id === productId);

      if (response.status == 201) {
        console.log(response.data.id);
        product.order_id = response.data.id;
      }

      // const product = products.find((p) => p.id === productId);
      toast.success(`Order submitted for ${product.name}`, {
        description: `Quantity: ${quantity}`,
        duration: 2000,
      });
    } catch (error) {
      console.error("Failed to create order", error);
      toast.error("Failed to submit order");
    }
  };

  const removeOrderItem = async (productId) => {
    const product = products.find((p) => p.id === productId);
    console.log(product);
    await axios.delete(
      "http://127.0.0.1:8000/api/order_details/" + product.order_id + "/"
    );
    setOrders((prev) => {
      const newOrders = { ...prev };
      delete newOrders[productId];
      return newOrders;
    });

    setOrderList(orderList.filter((item) => item.productId !== productId));

    toast.info(`Removed ${product.name} from cart`, {
      duration: 2000,
    });
  };

  if (loading)
    return (
      <div className="flex justify-center items-center h-screen w-screen bg-gradient-to-br from-purple-100 to-indigo-200">
        <div className="text-2xl text-indigo-700 font-bold animate-pulse flex items-center">
          <ShoppingCart className="mr-4 animate-bounce" size={48} />
          Loading Products...
        </div>
      </div>
    );

  return (
    <div className="bg-gradient-to-br from-purple-50 to-indigo-100 min-h-screen min-w-screen py-12 px-4">
      <Toaster richColors position="top-right" />
      <div className="container mx-auto max-w-7xl flex flex-col lg:flex-row gap-8">
        {/* Products Grid */}
        <div className="flex-grow grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {products.map((product) => (
            <div
              key={product.id}
              className="bg-white rounded-2xl shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:scale-105 hover:-translate-y-2 p-6 border border-purple-100/50 relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-purple-500 to-indigo-500"></div>
              <div className="flex flex-col items-center text-center">
                <h2 className="text-3xl font-bold text-indigo-800 mb-3 tracking-tight">
                  {product.name}
                </h2>
                <p className="text-gray-500 mb-4 italic">{product.brand}</p>
                <p className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-indigo-600 mb-6">
                  ${product.price}
                </p>
              </div>
              <div className="flex flex-col space-y-4 mt-6">
                <button
                  onClick={() => createOrder(product.id)}
                  className="flex items-center justify-center w-full px-6 py-3 bg-purple-500 text-white font-semibold rounded-xl shadow-md hover:bg-purple-600 transition-colors group"
                >
                  <ShoppingCart
                    className="mr-2 group-hover:animate-bounce"
                    size={24}
                  />
                  Add to Order
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Order Summary Sidebar */}
        {orderList.length > 0 && (
          <div className="w-full lg:w-96 bg-white rounded-2xl shadow-xl p-6 h-fit">
            <h3 className="text-2xl font-bold text-indigo-800 mb-6 text-center">
              Order Summary
            </h3>
            {orderList.map((item) => (
              <div
                key={item.productId}
                className="flex justify-between items-center border-b py-3 last:border-b-0"
              >
                <div>
                  <p className="font-semibold text-gray-800">{item.name}</p>
                  <p className="text-sm text-gray-500">
                    ${item.price} × {item.quantity}
                  </p>
                </div>
                <div className="flex items-center space-x-4">
                  <span className="font-bold text-purple-600">
                    ${(item.price * item.quantity).toFixed(2)}
                  </span>
                  <button
                    onClick={() => removeOrderItem(item.productId)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 size={20} />
                  </button>
                  <button
                    onClick={() => submitOrder(item.productId, item.quantity)}
                    className="flex items-center"
                  >
                    <Check className=" group-hover:animate-pulse" size={24} />
                  </button>
                </div>
              </div>
            ))}
            <div className="mt-4 text-right">
              <p className="text-xl font-bold text-indigo-800">
                Total: $
                {orderList
                  .reduce(
                    (total, item) => total + item.price * item.quantity,
                    0
                  )
                  .toFixed(2)}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductOrderPage;
