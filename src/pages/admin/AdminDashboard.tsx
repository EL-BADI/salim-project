import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Link, Navigate } from "react-router-dom";
import { Package, ShoppingBag, DollarSign, FolderOpen } from "lucide-react";

export default function AdminDashboard() {
  const isAdmin = useQuery(api.auth.isAdmin);
  const stats = useQuery(api.admin.getStats);

  if (isAdmin === undefined || stats === undefined) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return <Navigate to="/" />;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8">Admin Dashboard</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-gray-600 font-semibold">Total Products</h3>
            <Package className="w-8 h-8 text-primary" />
          </div>
          <p className="text-3xl font-bold">{stats.totalProducts}</p>
          <p className="text-sm text-gray-500 mt-1">
            {stats.activeProducts} active
          </p>
        </div>

        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-gray-600 font-semibold">Total Orders</h3>
            <ShoppingBag className="w-8 h-8 text-blue-600" />
          </div>
          <p className="text-3xl font-bold">{stats.totalOrders}</p>
        </div>

        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-gray-600 font-semibold">Total Revenue</h3>
            <DollarSign className="w-8 h-8 text-green-600" />
          </div>
          <p className="text-3xl font-bold">${stats.totalRevenue.toFixed(2)}</p>
        </div>

        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-gray-600 font-semibold">Categories</h3>
            <FolderOpen className="w-8 h-8 text-accent" />
          </div>
          <p className="text-3xl font-bold">{stats.totalCategories}</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-3 gap-6">
        <Link
          to="/admin/products"
          className="bg-white rounded-xl shadow p-8 hover:shadow-lg transition-shadow text-center"
        >
          <Package className="w-12 h-12 text-primary mx-auto mb-4" />
          <h3 className="text-xl font-bold mb-2">Manage Products</h3>
          <p className="text-gray-600">Add, edit, or remove products</p>
        </Link>

        <Link
          to="/admin/categories"
          className="bg-white rounded-xl shadow p-8 hover:shadow-lg transition-shadow text-center"
        >
          <FolderOpen className="w-12 h-12 text-accent mx-auto mb-4" />
          <h3 className="text-xl font-bold mb-2">Manage Categories</h3>
          <p className="text-gray-600">Organize product categories</p>
        </Link>

        <Link
          to="/admin/orders"
          className="bg-white rounded-xl shadow p-8 hover:shadow-lg transition-shadow text-center"
        >
          <ShoppingBag className="w-12 h-12 text-blue-600 mx-auto mb-4" />
          <h3 className="text-xl font-bold mb-2">Manage Orders</h3>
          <p className="text-gray-600">View and update order status</p>
        </Link>
      </div>
    </div>
  );
}
