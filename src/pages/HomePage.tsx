import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Link } from "react-router-dom";
import { Unauthenticated, Authenticated } from "convex/react";
import { SignInForm } from "../SignInForm";
import { ArrowRight, TrendingUp, Sparkles } from "lucide-react";
import type { Doc } from "../../convex/_generated/dataModel";
import { useLanguage } from "../contexts/LanguageContext";

export default function HomePage() {
  const { t } = useLanguage();
  const loggedInUser = useQuery(api.auth.loggedInUser);
  const trending = useQuery(api.products.getTrending, { limit: 4 }) as (Doc<"products"> | null)[] | undefined;
  const recommendations = useQuery(api.recommendations.getForUser, { limit: 4 }) as (Doc<"products"> | null)[] | undefined;
  const categories = useQuery(api.categories.list);
  const trackInteraction = useMutation(api.interactions.track);

  const handleProductClick = async (productId: any) => {
    try {
      await trackInteraction({ productId, type: "view" });
    } catch (error) {
      // Silent fail
    }
  };

  return (
    <div className="min-h-screen">
      <Unauthenticated>
        <div className="max-w-4xl mx-auto px-4 py-16">
          <div className="text-center mb-12">
            <h1 className="text-6xl font-bold text-primary mb-4">{t("welcomeToShopHub")}</h1>
            <p className="text-xl text-gray-600 mb-8">
              {t("personalizedShopping")}
            </p>
          </div>
          <div className="max-w-md mx-auto">
            <SignInForm />
          </div>
        </div>
      </Unauthenticated>

      <Authenticated>
        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Hero Section */}
          <div className="bg-gradient-to-r from-primary to-accent rounded-2xl p-12 mb-12 text-white">
            <h1 className="text-5xl font-bold mb-4">
              {t("welcomeBack")}, {loggedInUser?.name || "friend"}!
            </h1>
            <p className="text-xl mb-6 opacity-90">
              {t("discoverProducts")}
            </p>
            <Link
              to="/products"
              className="inline-flex items-center gap-2 bg-white text-primary px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition-shadow"
            >
              {t("shopNow")} <ArrowRight className="w-5 h-5" />
            </Link>
          </div>

          {/* Categories */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold mb-6">{t("shopByCategory")}</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {categories?.map((cat) => (
                <Link
                  key={cat._id}
                  to={`/products?category=${cat.slug}`}
                  className="bg-white p-6 rounded-xl shadow hover:shadow-lg transition-shadow text-center"
                >
                  <h3 className="font-semibold text-lg">{cat.name}</h3>
                  <p className="text-sm text-gray-500 mt-1">{cat.description}</p>
                </Link>
              ))}
            </div>
          </section>

          {/* Trending Products */}
          <section className="mb-12">
            <div className="flex items-center gap-2 mb-6">
              <TrendingUp className="w-8 h-8 text-primary" />
              <h2 className="text-3xl font-bold">{t("trendingNow")}</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {trending?.map((product) => product && (
                <Link
                  key={product._id}
                  to={`/products/${product.slug}`}
                  onClick={() => handleProductClick(product._id)}
                  className="bg-white rounded-xl shadow hover:shadow-xl transition-shadow overflow-hidden"
                >
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    className="w-full h-48 object-cover"
                  />
                  <div className="p-4">
                    <h3 className="font-semibold text-lg mb-2 line-clamp-2">
                      {product.name}
                    </h3>
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold text-primary">
                        ${product.price.toFixed(2)}
                      </span>
                      {product.compareAtPrice && (
                        <span className="text-sm text-gray-500 line-through">
                          ${product.compareAtPrice.toFixed(2)}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>

          {/* Recommended for You */}
          {recommendations && recommendations.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-6">
                <Sparkles className="w-8 h-8 text-accent" />
                <h2 className="text-3xl font-bold">{t("recommendedForYou")}</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {recommendations.map((product) => product && (
                  <Link
                    key={product._id}
                    to={`/products/${product.slug}`}
                    onClick={() => handleProductClick(product._id)}
                    className="bg-white rounded-xl shadow hover:shadow-xl transition-shadow overflow-hidden"
                  >
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      className="w-full h-48 object-cover"
                    />
                    <div className="p-4">
                      <h3 className="font-semibold text-lg mb-2 line-clamp-2">
                        {product.name}
                      </h3>
                      <div className="flex items-center justify-between">
                        <span className="text-2xl font-bold text-primary">
                          ${product.price.toFixed(2)}
                        </span>
                        {product.compareAtPrice && (
                          <span className="text-sm text-gray-500 line-through">
                            ${product.compareAtPrice.toFixed(2)}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
      </Authenticated>
    </div>
  );
}
