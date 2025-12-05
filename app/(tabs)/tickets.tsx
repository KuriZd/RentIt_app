// app/(tabs)/tickets.tsx
import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useMemo } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useColorScheme,
} from "react-native";
import QRCode from "react-native-qrcode-svg";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type TicketParams = {
  articleId?: string;
};

export default function TicketScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const { articleId } = useLocalSearchParams<TicketParams>();

  const COLORS = useMemo(
    () => ({
      pill: isDark ? "#27272a" : "#f3f4f6",
      icon: isDark ? "#e5e7eb" : "#111827",
      iconMuted: isDark ? "#a1a1aa" : "#6b7280",
      ring: isDark ? "#3f3f46" : "#e5e7eb",
      overlay: "rgba(0,0,0,0.30)",
    }),
    [isDark]
  );

  const screenBg = isDark ? "#020617" : "#f3f4f6";
  const ticketBg = isDark ? "#18181b" : "#f9fafb";

  const ticket = {
    date: "10 Oct",
    name: "Oscar Zamudio",
    phone: "+52 4433693514",
    article: "Chainsaw",
    duration: "2 Days",
    lessorName: "Silvia atreides",
    lessorPhone: "+52 4435593514",
    pickupAddress: "6391 Eigth St. Celina",
    articleId: articleId ?? null,
  };

  const qrValue = useMemo(
    () =>
      JSON.stringify({
        type: "rentit_ticket",
        version: 1,
        ...ticket,
      }),
    [articleId]
  );

  return (
    <View
      style={[
        styles.screen,
        {
          backgroundColor: screenBg,
          paddingTop: insets.top + 12,
          paddingBottom: insets.bottom + 16,
        },
      ]}
    >
      <View style={styles.headerRow}>
        <Pressable
          onPress={() => router.back()}
          style={[styles.iconButton, { backgroundColor: COLORS.pill }]}
        >
          <Feather name="chevron-left" size={22} color={COLORS.icon} />
        </Pressable>

        <Text style={[styles.headerTitle, { color: COLORS.icon }]}>
          E-Ticket
        </Text>

        <Pressable
          onPress={() => {}}
          style={[styles.iconButton, { backgroundColor: COLORS.pill }]}
        >
          <Feather name="share-2" size={20} color={COLORS.icon} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: "center",
          paddingVertical: 24,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View
          style={[
            styles.ticketCard,
            {
              backgroundColor: ticketBg,
              shadowColor: isDark ? "#000000" : "#000000",
            },
          ]}
        >
          <View
            style={[
              styles.cutLeft,
              {
                backgroundColor: screenBg,
              },
            ]}
          />
          <View
            style={[
              styles.cutRight,
              {
                backgroundColor: screenBg,
              },
            ]}
          />
          <View
            style={[
              styles.notchTop,
              {
                backgroundColor: ticketBg,
              },
            ]}
          />

          <View style={styles.ticketTop}>
            <View
              style={[
                styles.logoContainer,
                {
                  backgroundColor: isDark ? "#020617" : "#ffffff",
                  borderColor: COLORS.ring,
                },
              ]}
            >
              <Text style={styles.logoText}>Logo</Text>
            </View>

            <Text style={[styles.dateText, { color: COLORS.icon }]}>
              {ticket.date}
            </Text>
          </View>

          <View style={styles.infoGrid}>
            <View style={styles.infoColumn}>
              <Text style={[styles.label, { color: COLORS.iconMuted }]}>
                Name
              </Text>
              <Text style={[styles.value, { color: COLORS.icon }]}>
                {ticket.name}
              </Text>

              <Text style={[styles.label, { color: COLORS.iconMuted }]}>
                Article
              </Text>
              <Text style={[styles.value, { color: COLORS.icon }]}>
                {ticket.article}
              </Text>

              <Text style={[styles.label, { color: COLORS.iconMuted }]}>
                lessor&apos;s name
              </Text>
              <Text style={[styles.value, { color: COLORS.icon }]}>
                {ticket.lessorName}
              </Text>

              <Text style={[styles.label, { color: COLORS.iconMuted }]}>
                Pick up address
              </Text>
              <Text style={[styles.valueSmall, { color: COLORS.icon }]}>
                {ticket.pickupAddress}
              </Text>
            </View>

            <View style={styles.infoColumn}>
              <Text style={[styles.label, { color: COLORS.iconMuted }]}>
                Phone
              </Text>
              <Text style={[styles.value, { color: COLORS.icon }]}>
                {ticket.phone}
              </Text>

              <Text style={[styles.label, { color: COLORS.iconMuted }]}>
                Duration
              </Text>
              <Text style={[styles.value, { color: COLORS.icon }]}>
                {ticket.duration}
              </Text>

              <Text style={[styles.label, { color: COLORS.iconMuted }]}>
                lessor&apos;s phone
              </Text>
              <Text style={[styles.value, { color: COLORS.icon }]}>
                {ticket.lessorPhone}
              </Text>

              {articleId && (
                <>
                  <Text style={[styles.label, { color: COLORS.iconMuted }]}>
                    Article ID
                  </Text>
                  <Text style={[styles.value, { color: COLORS.icon }]}>
                    {articleId}
                  </Text>
                </>
              )}
            </View>
          </View>

          <View
            style={[
              styles.dashedLine,
              {
                borderColor: COLORS.ring,
              },
            ]}
          />

          <View style={styles.qrWrapper}>
            <View
              style={[
                styles.qrInner,
                {
                  backgroundColor: isDark ? "#020617" : "#ffffff",
                  borderColor: COLORS.ring,
                },
              ]}
            >
              <QRCode value={qrValue} size={140} />
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    paddingHorizontal: 20,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  ticketCard: {
    borderRadius: 28,
    paddingVertical: 24,
    paddingHorizontal: 24,
    position: "relative",
    shadowOpacity: 0.1,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6,
  },
  cutLeft: {
    position: "absolute",
    top: "48%",
    left: -18,
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  cutRight: {
    position: "absolute",
    top: "48%",
    right: -18,
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  notchTop: {
    position: "absolute",
    top: -16,
    left: "50%",
    width: 52,
    height: 32,
    marginLeft: -26,
    borderBottomLeftRadius: 26,
    borderBottomRightRadius: 26,
  },
  ticketTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  logoContainer: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  logoText: {
    fontSize: 12,
    fontWeight: "600",
  },
  dateText: {
    fontSize: 16,
    fontWeight: "500",
  },
  infoGrid: {
    flexDirection: "row",
    gap: 24,
  },
  infoColumn: {
    flex: 1,
    gap: 12,
  },
  label: {
    fontSize: 11,
  },
  value: {
    fontSize: 13,
    fontWeight: "500",
    marginBottom: 4,
  },
  valueSmall: {
    fontSize: 12,
    fontWeight: "400",
    marginTop: 2,
  },
  dashedLine: {
    borderStyle: "dashed",
    borderTopWidth: 1,
    marginTop: 24,
    marginBottom: 24,
  },
  qrWrapper: {
    alignItems: "center",
    justifyContent: "center",
  },
  qrInner: {
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
  },
});
