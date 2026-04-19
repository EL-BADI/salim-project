import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Link } from "react-router-dom";
import { Package } from "lucide-react";
import { useLanguage } from "../contexts/LanguageContext";

export default function OrdersPage() {
  const { t } = useLanguage();
  const orders = useQuery(api.orders.list);

  if (orders === undefined) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 text-center">
        <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h1 className="text-3xl font-bold mb-4">{t("noOrdersYet")}</h1>
        <p className="text-gray-600 mb-8">{t("startShopping")}</p>
        <Link
          to="/products"
          className="inline-block px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors"
        >
          {t("browseProducts")}
        </Link>
      </div>
    );
  }

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
      <h1 className="text-4xl font-bold mb-8">{t("myOrders")}</h1>

      <div className="space-y-6">
        {orders.map((order) => (
          <div key={order._id} className="bg-white rounded-xl shadow p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-sm text-gray-600">
                  {t("orderPlaced")} :{" "}
                  {new Date(order._creationTime).toLocaleDateString()}
                </p>
                <p className="text-sm text-gray-600">
                  {t("orderId")} : {order._id.slice(-8)}
                </p>
              </div>
              <span
                className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(
                  order.status,
                )}`}
              >
                {t(order.status)}
              </span>
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
                    <p className="text-sm text-gray-600">
                      {t("quantity")} : {item.quantity}
                    </p>
                    <p className="text-sm font-semibold text-primary">
                      ${item.price.toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t pt-4 flex justify-between items-center">
              <div className="text-sm text-gray-600">
                <p>{order.shippingAddress.name}</p>
                <p>
                  {order.shippingAddress.line1}
                  {order.shippingAddress.line2 &&
                    `, ${order.shippingAddress.line2}`}
                </p>
                <p>
                  {order.shippingAddress.city}, {order.shippingAddress.state}{" "}
                  {order.shippingAddress.zip}
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-primary">
                  ${order.total.toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
