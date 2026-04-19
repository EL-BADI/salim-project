import { useLanguage } from "../contexts/LanguageContext";
import { Globe } from "lucide-react";

export function LanguageSwitcher() {
  const { language, setLanguage, t } = useLanguage();

  return (
    <div className="relative group">
      <button className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors">
        <Globe className="w-5 h-5 text-gray-700" />
        <span className="text-sm font-medium">{language === "en" ? "EN" : "ع"}</span>
      </button>
      <div className="absolute top-full right-0 mt-0 bg-white rounded-lg shadow-lg border hidden group-hover:block min-w-[120px] z-50">
        <button
          onClick={() => setLanguage("en")}
          className={`w-full px-4 py-2 text-left hover:bg-gray-100 transition-colors ${
            language === "en" ? "bg-gray-50 font-semibold" : ""
          }`}
        >
          {t("english")}
        </button>
        <button
          onClick={() => setLanguage("ar")}
          className={`w-full px-4 py-2 text-left hover:bg-gray-100 transition-colors ${
            language === "ar" ? "bg-gray-50 font-semibold" : ""
          }`}
        >
          {t("arabic")}
        </button>
      </div>
    </div>
  );
}
