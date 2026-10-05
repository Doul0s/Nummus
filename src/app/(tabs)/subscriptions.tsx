import { useTranslation } from "react-i18next";
import { ScrollView } from "react-native";

import { EmptyState, ScreenHeader } from "@/components/ui";

export default function Subscriptions() {
  const { t } = useTranslation();

  return (
    <ScrollView>
      <ScreenHeader title={t("subscriptions.title")} />
      <EmptyState title={t("subscriptions.empty")} hint={t("subscriptions.emptyHint")} />
    </ScrollView>
  );
}
