import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Navigate } from "react-router-dom";
import { useState } from "react";
import { Pencil, Trash2, Plus } from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "../../contexts/LanguageContext";

export default function AdminCategories() {
  const { t } = useLanguage();
  const isAdmin = useQuery(api.auth.isAdmin);
  const categories = useQuery(api.categories.list);
  const createCategory = useMutation(api.admin.createCategory);
  const updateCategory = useMutation(api.admin.updateCategory);
  const deleteCategory = useMutation(api.admin.deleteCategory);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
  });

  if (isAdmin === undefined || categories === undefined) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return <Navigate to="/" />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await updateCategory({ id: editingId as any, ...formData });
        toast.success(t("categoryUpdated"));
      } else {
        await createCategory(formData);
        toast.success(t("categoryCreated"));
      }

      setShowForm(false);
      setEditingId(null);
      setFormData({ name: "", slug: "", description: "" });
    } catch (error: any) {
      toast.error(error.message || t("failedToSaveCategory"));
    }
  };

  const handleEdit = (category: any) => {
    setEditingId(category._id);
    setFormData({
      name: category.name,
      slug: category.slug,
      description: category.description || "",
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t("confirmDeleteCategory"))) return;
    try {
      await deleteCategory({ id: id as any });
      toast.success(t("categoryDeleted"));
    } catch (error: any) {
      toast.error(error.message || t("failedToDeleteCategory"));
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold">{t("manageCategories")}</h1>
        <button
          onClick={() => {
            setShowForm(!showForm);
            setEditingId(null);
            setFormData({ name: "", slug: "", description: "" });
          }}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors"
        >
          <Plus className="w-5 h-5" />
          {t("addCategory")}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-xl shadow p-6 mb-8 space-y-4"
        >
          <h2 className="text-2xl font-bold">
            {editingId ? t("editCategory") : t("newCategory")}
          </h2>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-2">
                {t("name")}
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:border-primary focus:ring-1 focus:ring-primary outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">
                {t("slug")}
              </label>
              <input
                type="text"
                required
                value={formData.slug}
                onChange={(e) =>
                  setFormData({ ...formData, slug: e.target.value })
                }
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:border-primary focus:ring-1 focus:ring-primary outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">
              {t("description")}
            </label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:border-primary focus:ring-1 focus:ring-primary outline-none"
            />
          </div>

          <div className="flex gap-4">
            <button
              type="submit"
              className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors"
            >
              {editingId ? t("update") : t("create")}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setEditingId(null);
              }}
              className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              {t("cancel")}
            </button>
          </div>
        </form>
      )}

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.map((category) => (
          <div key={category._id} className="bg-white rounded-xl shadow p-6">
            <h3 className="text-xl font-bold mb-2">{category.name}</h3>
            <p className="text-sm text-gray-600 mb-1">
              {t("slug")} : {category.slug}
            </p>
            <p className="text-sm text-gray-600 mb-4">{category.description}</p>
            <div className="flex gap-2">
              <button
                onClick={() => handleEdit(category)}
                className="flex items-center gap-1 px-3 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors text-sm"
              >
                <Pencil className="w-4 h-4" />
                {t("editCategory")}
              </button>
              <button
                onClick={() => handleDelete(category._id)}
                className="flex items-center gap-1 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
              >
                <Trash2 className="w-4 h-4" />
                {t("delete")}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
