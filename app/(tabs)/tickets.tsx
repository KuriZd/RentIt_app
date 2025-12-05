// app/(tabs)/tickets.tsx
import { supabase } from "@/utils/supabase";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
  useColorScheme,
} from "react-native";
import QRCode from "react-native-qrcode-svg";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type ReservationRow = {
  id: number;
  id_usuario: string;
  id_articulo: number | null;
  fecha_inicio: string;
  fecha_fin: string;
  total: number | null;
  estado_reservacion: string | null;
  creado_en: string | null;
  ticket_validado: boolean;
  articulos:
  | {
    id: number;
    titulo: string | null;
    url_publica: string | null;
    id_propietario: string | null;
  }[]
  | null;
};

type UiReservation = {
  id: number;
  articuloId: number | null;
  titulo: string;
  imageUrl: string | null;
  fechaInicio: string;
  fechaFin: string;
  total: number | null;
  estado: string | null;
  ticketCode: string;
  qrPayload: string;
};

function formatDateRange(startIso: string, endIso: string) {
  const start = new Date(startIso);
  const end = new Date(endIso);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return {
      rangeLabel: "",
      nightsLabel: "",
    };
  }

  const opts: Intl.DateTimeFormatOptions = {
    day: "2-digit",
    month: "short",
    year: "numeric",
  };

  const startLabel = start.toLocaleDateString("es-MX", opts);
  const endLabel = end.toLocaleDateString("es-MX", opts);

  const diffMs = end.getTime() - start.getTime();
  const diffDays = Math.max(1, Math.round(diffMs / (1000 * 60 * 60 * 24)));

  return {
    rangeLabel: `${startLabel} – ${endLabel}`,
    nightsLabel: `${diffDays} ${diffDays === 1 ? "noche" : "noches"}`,
  };
}

export default function TicketScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

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

  const [loading, setLoading] = useState(true);
  const [reservations, setReservations] = useState<UiReservation[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [hasOwnerTickets, setHasOwnerTickets] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadReservations = async () => {
      try {
        setLoading(true);
        setErrorMsg(null);

        const { data: authData, error: authError } =
          await supabase.auth.getUser();
        if (authError || !authData?.user) {
          setErrorMsg("Debes iniciar sesión para ver tus tickets.");
          return;
        }

        const userId = authData.user.id;

        const { data, error } = await supabase
          .from("reservaciones")
          .select(
            `
          id,
          id_usuario,
          id_articulo,
          fecha_inicio,
          fecha_fin,
          total,
          estado_reservacion,
          creado_en,
          ticket_validado,
          articulos (
            id,
            titulo,
            url_publica,
            id_propietario
          )
        `
          )
          .eq("id_usuario", userId)
          .eq("ticket_validado", false)
          .order("creado_en", { ascending: false });

        if (error) throw error;

        const rows = (data ?? []) as ReservationRow[];

        const ui: UiReservation[] = rows.map((row) => {
          const art = row.articulos?.[0];
          const ticketCode = `RES-${row.id}`;
          const qrPayload = JSON.stringify({ reservationId: row.id });

          return {
            id: row.id,
            articuloId: row.id_articulo,
            titulo: art?.titulo ?? "Artículo",
            imageUrl: art?.url_publica ?? null,
            fechaInicio: row.fecha_inicio,
            fechaFin: row.fecha_fin,
            total: row.total,
            estado: row.estado_reservacion,
            ticketCode,
            qrPayload,
          };
        });

        if (isMounted) {
          setReservations(ui);
        }

        const { data: ownerData, error: ownerError } = await supabase
          .from("reservaciones")
          .select(
            `
          id,
          ticket_validado,
          articulos (
            id_propietario
          )
        `
          )
          .eq("ticket_validado", false)
          .eq("articulos.id_propietario", userId)
          .limit(1);

        if (!ownerError && isMounted) {
          setHasOwnerTickets((ownerData ?? []).length > 0);
        }
      } catch (e: any) {
        console.error("Error cargando reservaciones/tickets", e);
        if (isMounted) {
          setErrorMsg(
            e?.message ?? "No se pudieron cargar tus tickets de reservación."
          );
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadReservations();

    return () => {
      isMounted = false;
    };
  }, []);

  const pageBg = isDark ? "#020617" : "#f9fafb";

  return (
    <View
      className="flex-1"
      style={{
        paddingTop: insets.top + 8,
        paddingBottom: insets.bottom,
        backgroundColor: pageBg,
      }}
    >
      <View className="flex-row items-center px-4 mb-3">
        <Pressable
          onPress={() => router.back()}
          className="h-9 w-9 items-center justify-center rounded-full mr-3"
          style={{ backgroundColor: COLORS.pill }}
        >
          <Feather name="chevron-left" size={20} color={COLORS.icon} />
        </Pressable>

        <View className="flex-1">
          <Text
            className="text-base font-semibold"
            style={{ color: COLORS.icon }}
          >
            Tus e-tickets
          </Text>
          <Text
            className="text-xs mt-0.5"
            style={{ color: COLORS.iconMuted }}
          >
            Reservaciones activas generadas con tu cuenta
          </Text>
        </View>
      </View>

      {!loading && hasOwnerTickets && (
        <View className="px-4 mb-3">
          <Pressable
            className="rounded-2xl px-4 py-3 flex-row items-center justify-between"
            style={{
              backgroundColor: COLORS.pill,
              borderWidth: 1,
              borderColor: COLORS.ring,
            }}
            onPress={() => router.push("/scan-ticket")}
          >
            <View className="flex-row items-center">
              <View className="h-8 w-8 rounded-full items-center justify-center mr-3"
                style={{ backgroundColor: isDark ? "#18181b" : "#e5e7eb" }}
              >
                <Feather
                  name="smartphone"
                  size={18}
                  color={COLORS.icon}
                />
              </View>
              <View>
                <Text
                  className="text-xs font-semibold"
                  style={{ color: COLORS.icon }}
                >
                  Tienes productos en renta
                </Text>
                <Text
                  className="text-[11px]"
                  style={{ color: COLORS.iconMuted }}
                >
                  Escanea el ticket del renter para validar la entrega
                </Text>
              </View>
            </View>

            <Feather name="chevron-right" size={18} color={COLORS.iconMuted} />
          </Pressable>
        </View>
      )}

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator />
          <Text
            className="mt-2 text-xs"
            style={{ color: COLORS.iconMuted }}
          >
            Cargando tus tickets…
          </Text>
        </View>
      ) : errorMsg ? (
        <View className="flex-1 items-center justify-center px-6">
          <Text
            className="text-sm text-center mb-2"
            style={{ color: COLORS.icon }}
          >
            {errorMsg}
          </Text>
          <Pressable
            className="h-10 px-4 rounded-full items-center justify-center"
            style={{ backgroundColor: COLORS.pill }}
            onPress={() => router.replace("/")}
          >
            <Text
              className="text-xs font-semibold"
              style={{ color: COLORS.icon }}
            >
              Ir a inicio
            </Text>
          </Pressable>
        </View>
      ) : reservations.length === 0 ? (
        <View className="flex-1 items-center justify-center px-6">
          <Text
            className="text-sm font-semibold mb-2"
            style={{ color: COLORS.icon }}
          >
            Aún no tienes e-tickets activos
          </Text>
          <Text
            className="text-xs text-center"
            style={{ color: COLORS.iconMuted }}
          >
            Cuando completes una reservación, aquí aparecerá el código QR para
            mostrar al momento de la entrega.
          </Text>
        </View>
      ) : (
        <ScrollView
          className="flex-1"
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingBottom: 24,
          }}
        >
          {reservations.map((res) => {
            const { rangeLabel, nightsLabel } = formatDateRange(
              res.fechaInicio,
              res.fechaFin
            );

            return (
              <View
                key={res.id}
                className="rounded-3xl overflow-hidden mb-4"
                style={{
                  backgroundColor: isDark ? "#020617" : "#ffffff",
                  borderWidth: 1,
                  borderColor: COLORS.ring,
                }}
              >
                <View className="px-6 pt-6 pb-4 items-center">
                  <Text
                    className="text-xs font-medium tracking-[0.25em] mb-3"
                    style={{ color: COLORS.iconMuted }}
                  >
                    RENTIT PASS
                  </Text>

                  <QRCode value={res.qrPayload} size={160} />

                  <Text
                    className="mt-4 text-xs"
                    style={{ color: COLORS.iconMuted }}
                    numberOfLines={1}
                  >
                    Código: {res.ticketCode}
                  </Text>
                </View>

                <View
                  className="flex-row justify-between px-6 py-4 border-t"
                  style={{ borderColor: COLORS.ring }}
                >
                  <View className="flex-1 mr-3">
                    <Text
                      className="text-[11px] uppercase tracking-wide mb-1"
                      style={{ color: COLORS.iconMuted }}
                    >
                      Artículo
                    </Text>
                    <Text
                      className="text-sm font-semibold"
                      style={{ color: COLORS.icon }}
                      numberOfLines={1}
                    >
                      {res.titulo}
                    </Text>
                  </View>

                  <View className="items-end">
                    <Text
                      className="text-[11px] uppercase tracking-wide mb-1"
                      style={{ color: COLORS.iconMuted }}
                    >
                      ID Reserva
                    </Text>
                    <Text
                      className="text-sm font-semibold"
                      style={{ color: COLORS.icon }}
                    >
                      #{res.id}
                    </Text>
                  </View>
                </View>

                <View
                  className="flex-row px-6 py-4 border-t"
                  style={{ borderColor: COLORS.ring }}
                >
                  <View className="flex-1 mr-3">
                    <Text
                      className="text-[11px] uppercase tracking-wide mb-1"
                      style={{ color: COLORS.iconMuted }}
                    >
                      Fechas
                    </Text>
                    <Text
                      className="text-sm font-medium"
                      style={{ color: COLORS.icon }}
                    >
                      {rangeLabel}
                    </Text>
                    <Text
                      className="text-xs mt-0.5"
                      style={{ color: COLORS.iconMuted }}
                    >
                      {nightsLabel}
                    </Text>
                  </View>

                  <View className="flex-1 mr-3">
                    <Text
                      className="text-[11px] uppercase tracking-wide mb-1"
                      style={{ color: COLORS.iconMuted }}
                    >
                      Estado
                    </Text>
                    <Text
                      className="text-sm font-medium"
                      style={{ color: COLORS.icon }}
                    >
                      {res.estado ?? "pendiente"}
                    </Text>
                  </View>

                  <View className="items-end">
                    <Text
                      className="text-[11px] uppercase tracking-wide mb-1"
                      style={{ color: COLORS.iconMuted }}
                    >
                      Total
                    </Text>
                    <Text
                      className="text-sm font-semibold"
                      style={{ color: COLORS.icon }}
                    >
                      {res.total != null
                        ? `$${Number(res.total).toFixed(2)} MXN`
                        : "—"}
                    </Text>
                  </View>
                </View>

                <View
                  className="px-6 py-4 border-t"
                  style={{ borderColor: COLORS.ring }}
                >
                  <Text
                    className="text-xs uppercase tracking-wide mb-1"
                    style={{ color: COLORS.iconMuted }}
                  >
                    Instrucciones
                  </Text>
                  <Text
                    className="text-xs"
                    style={{ color: COLORS.iconMuted }}
                  >
                    Muestra este código al propietario al momento de recoger el
                    artículo. Lleva tu identificación vigente.
                  </Text>
                </View>
              </View>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}
