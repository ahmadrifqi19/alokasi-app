import { COPY } from "@/lib/copy";

export const OTHER_CATEGORY_OPTION_ID = "__other_category__";
export const CUSTOM_CATEGORY_PREFIX = "custom:";

export interface CategoryOption {
  id: string;
  nama: string;
}

export const DEFAULT_CATEGORY_OPTIONS: CategoryOption[] = [
  { id: "k1", nama: COPY.categories.food },
  { id: "k2", nama: COPY.categories.personal },
  { id: "k3", nama: COPY.categories.shopping },
  { id: "k4", nama: COPY.categories.income },
  { id: "k5", nama: COPY.categories.transport },
  { id: "k6", nama: COPY.categories.bills },
  { id: "k7", nama: COPY.categories.daily },
];

export function createOrFindCategoryOption(
  name: string,
  options: CategoryOption[],
): CategoryOption {
  const trimmedName = name.trim();
  const normalizedName = trimmedName.toLocaleLowerCase("id-ID");
  const existingOption = options.find(
    (option) => option.nama.trim().toLocaleLowerCase("id-ID") === normalizedName,
  );

  return existingOption ?? {
    id: `${CUSTOM_CATEGORY_PREFIX}${trimmedName}`,
    nama: trimmedName,
  };
}

export function getCategoryName(
  categoryId?: string,
  customCategories: CategoryOption[] = [],
): string {
  if (!categoryId) return "";

  return (
    customCategories.find((category) => category.id === categoryId)?.nama ??
    DEFAULT_CATEGORY_OPTIONS.find((category) => category.id === categoryId)?.nama ??
    (categoryId.startsWith(CUSTOM_CATEGORY_PREFIX)
      ? categoryId.slice(CUSTOM_CATEGORY_PREFIX.length)
      : COPY.categories.other)
  );
}