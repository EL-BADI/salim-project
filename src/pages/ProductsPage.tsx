import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Link, useSearchParams } from "react-router-dom";
import { useState } from "react";
import { Search, Filter } from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "../contexts/LanguageContext";

export default function ProductsPage() {
  const { t } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(searchParams.get("search") || "");
  const categorySlug = searchParams.get("category");
  
  const categories = useQuery(api.categories.list);
  const selectedCategory = categories?.find((c) => c.slug === categorySlug);
  
  const products = useQuery(api.products.list, {
    categoryId: selectedCategory?._id,
    search: searchTerm || undefined,
  });
  
  const trackInteraction = useMutation(api.interactions.track);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm) {
      setSearchParams({ search: searchTerm });
    } else {
      setSearchParams({});
    }
  };

  const handleCategoryFilter = (slug: string | null) => {
    if (slug) {
      setSearchParams({ category: slug });
    } else {
      setSearchParams({});
    }
    setSearchTerm("");
  };

  const handleProductClick = async (productId: any) => {
    try {
      await trackInteraction({ productId, type: "view" });
    } catch (error) {
      // Silent fail
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8">{t("products")}</h1>

      {/* Search and Filters */}
      <div className="mb-8 space-y-4">
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t("searchProducts")}
              className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 focus:border-primary focus:ring-1 focus:ring-primary outline-none"
            />
          </div>
          <button
            type="submit"
            className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors"
          >
            {t("search")}
          </button>
        </form>

        {/* Category Filter */}
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="w-5 h-5 text-gray-600" />
          <button
            onClick={() => handleCategoryFilter(null)}
            className={`px-4 py-2 rounded-lg transition-colors ${
              !categorySlug
                ? "bg-primary text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            {t("all")}
          </button>
          {categories?.map((cat) => (
            <button
              key={cat._id}
              onClick={() => handleCategoryFilter(cat.slug)}
              className={`px-4 py-2 rounded-lg transition-colors ${
                categorySlug === cat.slug
                  ? "bg-primary text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Products Grid */}
      {products === undefined ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-xl text-gray-600">{t("noProductsFound")}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map((product) => (
            <Link
              key={product._id}
              to={`/products/${product.slug}`}
              onClick={() => handleProductClick(product._id)}
              className="bg-white rounded-xl shadow hover:shadow-xl transition-shadow overflow-hidden"
            >
              <img
                src={product.imageUrl}
                alt={product.name}
                className="w-full h-56 object-cover"
              />
              <div className="p-4">
                <h3 className="font-semibold text-lg mb-2 line-clamp-2">
                  {product.name}
                </h3>
                <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                  {product.description}
                </p>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-2xl font-bold text-primary">
                    ${product.price.toFixed(2)}
                  </span>
                  {product.compareAtPrice && (
                    <span className="text-sm text-gray-500 line-through">
                      ${product.compareAtPrice.toFixed(2)}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span>⭐ {product.rating?.toFixed(1)}</span>
                  <span>({product.reviewCount} {t("reviews")})</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
