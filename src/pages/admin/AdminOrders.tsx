import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Navigate } from "react-router-dom";
import { toast } from "sonner";

export default function AdminOrders() {
  const isAdmin = useQuery(api.auth.isAdmin);
  const orders = useQuery(api.admin.getAllOrders);
  const updateStatus = useMutation(api.admin.updateOrderStatus);

  if (isAdmin === undefined || orders === undefined) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return <Navigate to="/" />;
  }

  const handleStatusChange = async (orderId: string, status: string) => {
    try {
      await updateStatus({ orderId: orderId as any, status: status as any });
      toast.success("Order status updated!");
    } catch (error: any) {
      toast.error(error.message || "Failed to update status");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "delivered":
        return "bg-green-100 text-green-800";
      case "shipped":
        return "bg-blue-100 text-blue-800";
      case "processing":
        return "bg-yellow-100 text-yellow-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8">Manage Orders</h1>

      <div className="space-y-6">
        {orders.map((order) => (
          <div key={order._id} className="bg-white rounded-xl shadow p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-sm text-gray-600">
                  Order placed: {new Date(order._creationTime).toLocaleDateString()}
                </p>
                <p className="text-sm text-gray-600">Order ID: {order._id}</p>
                <p className="text-sm text-gray-600">User ID: {order.userId}</p>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Status</label>
                <select
                  value={order.status}
                  onChange={(e) => handleStatusChange(order._id, e.target.value)}
                  className={`px-3 py-2 rounded-lg font-semibold ${getStatusColor(
                    order.status
                  )}`}
                >
                  <option value="pending">PENDING</option>
                  <option value="processing">PROCESSING</option>
                  <option value="shipped">SHIPPED</option>
                  <option value="delivered">DELIVERED</option>
                  <option value="cancelled">CANCELLED</option>
                </select>
              </div>
            </div>

            <div className="space-y-3 mb-4">
              {order.items.map((item, idx) => (
                <div key={idx} className="flex gap-4">
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className="w-20 h-20 object-cover rounded"
                  />
                  <div className="flex-1">
                    <p className="font-semibold">{item.name}</p>
                    <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                    <p className="text-sm font-semibold text-primary">
                      ${item.price.toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t pt-4 grid md:grid-cols-2 gap-4">
              <div className="text-sm text-gray-600">
                <p className="font-semibold mb-2">Shipping Address:</p>
                <p>{order.shippingAddress.name}</p>
                <p>
                  {order.shippingAddress.line1}
                  {order.shippingAddress.line2 && `, ${order.shippingAddress.line2}`}
                </p>
                <p>
                  {order.shippingAddress.city}, {order.shippingAddress.state}{" "}
                  {order.shippingAddress.zip}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">Subtotal: ${order.subtotal.toFixed(2)}</p>
                <p className="text-sm text-gray-600">Shipping: ${order.shipping.toFixed(2)}</p>
                <p className="text-2xl font-bold text-primary mt-2">
                  Total: ${order.total.toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
