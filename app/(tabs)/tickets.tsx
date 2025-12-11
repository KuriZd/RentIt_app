// app/tickets/index.tsx
import { supabase } from "@/utils/supabase";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useColorScheme,
} from "react-native";
import QRCode from "react-native-qrcode-svg";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type UnidadPrecio = "hora" | "dia" | "semana";

type DbReservation = {
  id: number;
  id_usuario: string;
  id_articulo: number;
  fecha_inicio: string;
  fecha_fin: string;
  total: number;
  estado_reservacion: string;
  unidad_precio: UnidadPrecio | null;
  cantidad: number | null;
  notas: string | null;
};

type DbArticle = {
  id: number;
  id_propietario: string | null;
  titulo: string;
  url_publica: string | null;
};

type DbProfile = {
  id: string;
  nombre: string | null;
  telefono: string | null;
};

type Ticket = {
  reservaId: number;
  dateLabel: string;
  name: string;
  phone: string;
  article: string;
  duration: string;
  lessorName: string;
  lessorPhone: string;
  pickupAddress: string;
  imageUrl: string | null;
  qrValue: string;
};

export default function TicketScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [hasOwnerTickets, setHasOwnerTickets] = useState(false);

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

  useEffect(() => {
    let isMounted = true;

    const loadTickets = async () => {
      try {
        setLoading(true);
        setErrorMsg(null);
        setHasOwnerTickets(false);

        const { data: userData, error: userError } =
          await supabase.auth.getUser();
        if (userError || !userData.user) {
          if (isMounted) {
            setErrorMsg("Debes iniciar sesión para ver tus tickets.");
            setTickets([]);
          }
          return;
        }
        const userId = userData.user.id;

        const { data: perfil, error: perfilErr } = await supabase
          .from("perfiles")
          .select("id, nombre, telefono")
          .eq("id", userId)
          .maybeSingle();

        if (perfilErr) {
          console.log("Error cargando perfil del usuario", perfilErr);
        }

        const renterProfile = (perfil ?? null) as DbProfile | null;

        const { data: reservData, error: reservErr } = await supabase
          .from("reservaciones")
          .select(
            "id, id_usuario, id_articulo, fecha_inicio, fecha_fin, total, estado_reservacion, unidad_precio, cantidad, notas"
          )
          .eq("id_usuario", userId)
          .eq("estado_reservacion", "pendiente")
          .order("fecha_inicio", { ascending: false });

        if (reservErr) throw reservErr;

        const reservas = (reservData ?? []) as DbReservation[];

        if (!reservas.length) {
          if (isMounted) {
            setTickets([]);
          }
        } else {
          const articleIds = Array.from(
            new Set(reservas.map((r) => r.id_articulo))
          );

          const { data: artData, error: artErr } = await supabase
            .from("articulos")
            .select("id, id_propietario, titulo, url_publica")
            .in("id", articleIds);

          if (artErr) throw artErr;

          const articulos = (artData ?? []) as (DbArticle & {
            id_propietario?: string | null;
          })[];

          const ownerIds = Array.from(
            new Set(
              articulos
                .map((a) => a.id_propietario)
                .filter((x): x is string => !!x)
            )
          );

          let owners: DbProfile[] = [];
          if (ownerIds.length) {
            const { data: ownersData, error: ownersErr } = await supabase
              .from("perfiles")
              .select("id, nombre, telefono")
              .in("id", ownerIds);

            if (ownersErr) throw ownersErr;
            owners = (ownersData ?? []) as DbProfile[];
          }

          const artById = new Map<
            number,
            DbArticle & { id_propietario?: string | null }
          >();
          articulos.forEach((a) => {
            artById.set(a.id, a);
          });

          const ownerById = new Map<string, DbProfile>();
          owners.forEach((o) => {
            ownerById.set(o.id, o);
          });

          const renterName =
            renterProfile?.nombre && renterProfile.nombre.trim().length > 0
              ? renterProfile.nombre
              : "Tú";
          const renterPhone = renterProfile?.telefono ?? "";

          const builtTickets: Ticket[] = reservas.map((r) => {
            const art = artById.get(r.id_articulo);
            const owner =
              art && art.id_propietario
                ? ownerById.get(art.id_propietario)
                : undefined;

            const start = new Date(r.fecha_inicio);
            const dateLabel = start.toLocaleDateString("es-MX", {
              day: "2-digit",
              month: "short",
            });

            const cantidad = r.cantidad ?? 1;
            let duration = `${cantidad} `;
            switch (r.unidad_precio) {
              case "hora":
                duration += cantidad === 1 ? "hora" : "horas";
                break;
              case "semana":
                duration += cantidad === 1 ? "semana" : "semanas";
                break;
              case "dia":
              default:
                duration += cantidad === 1 ? "día" : "días";
                break;
            }

            const lessorName =
              owner?.nombre && owner.nombre.trim().length > 0
                ? owner.nombre
                : "Arrendador";
            const lessorPhone = owner?.telefono ?? "";

            const pickupAddress = "Por acordar con el arrendador";

            const qrValue = JSON.stringify({
              reservationId: r.id,
            });

            const imageUrl = art?.url_publica ?? null;

            return {
              reservaId: r.id,
              dateLabel,
              name: renterName,
              phone: renterPhone,
              article: art?.titulo ?? "Artículo rentado",
              duration,
              lessorName,
              lessorPhone,
              pickupAddress,
              imageUrl,
              qrValue,
            };
          });

          if (isMounted) {
            setTickets(builtTickets);
          }
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
        console.log("Error cargando tickets", e);
        if (isMounted) {
          setTickets([]);
          setErrorMsg(
            e?.message ?? "No se pudieron cargar tus tickets de reservación."
          );
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadTickets();

    return () => {
      isMounted = false;
    };
  }, []);

  if (loading) {
    return (
      <View
        style={[
          styles.screen,
          {
            backgroundColor: screenBg,
            paddingTop: insets.top + 12,
            paddingBottom: insets.bottom + 16,
            justifyContent: "center",
            alignItems: "center",
          },
        ]}
      >
        <ActivityIndicator />
        <Text style={{ marginTop: 8, color: COLORS.iconMuted }}>
          Cargando tus tickets…
        </Text>
      </View>
    );
  }

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
      {/* Header */}
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
          onPress={() => { }}
          style={[styles.iconButton, { backgroundColor: COLORS.pill }]}
        >
          <Feather name="share-2" size={20} color={COLORS.icon} />
        </Pressable>
      </View>

      {/* Banner para propietarios */}
      {hasOwnerTickets && (
        <View
          style={{
            paddingHorizontal: 4,
            marginTop: 12,
            marginBottom: 4,
          }}
        >
          <Pressable
            onPress={() => router.push("/scan-ticket")}
            style={{
              borderRadius: 16,
              paddingHorizontal: 16,
              paddingVertical: 12,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              backgroundColor: COLORS.pill,
              borderWidth: 1,
              borderColor: COLORS.ring,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <View
                style={{
                  height: 32,
                  width: 32,
                  borderRadius: 999,
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: 10,
                  backgroundColor: isDark ? "#18181b" : "#e5e7eb",
                }}
              >
                <Feather name="smartphone" size={18} color={COLORS.icon} />
              </View>
              <View>
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: "600",
                    color: COLORS.icon,
                  }}
                >
                  Tienes productos en renta
                </Text>
                <Text
                  style={{
                    fontSize: 11,
                    color: COLORS.iconMuted,
                    marginTop: 2,
                  }}
                >
                  Escanea el ticket del renter para validar la entrega
                </Text>
              </View>
            </View>

            <Feather name="chevron-right" size={18} color={COLORS.iconMuted} />
          </Pressable>
        </View>
      )}

      {errorMsg ? (
        <View
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            paddingHorizontal: 24,
          }}
        >
          <Text
            style={{
              fontSize: 14,
              textAlign: "center",
              marginBottom: 8,
              color: COLORS.icon,
            }}
          >
            {errorMsg}
          </Text>
          <Pressable
            onPress={() => router.replace("/main")}
            style={{
              height: 40,
              paddingHorizontal: 20,
              borderRadius: 999,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: COLORS.pill,
            }}
          >
            <Text
              style={{
                fontSize: 12,
                fontWeight: "600",
                color: COLORS.icon,
              }}
            >
              Ir a inicio
            </Text>
          </Pressable>
        </View>
      ) : tickets.length === 0 ? (
        <View
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            paddingHorizontal: 24,
          }}
        >
          <Text
            style={{
              fontSize: 14,
              fontWeight: "600",
              marginBottom: 6,
              color: COLORS.icon,
            }}
          >
            Aún no tienes e-tickets activos
          </Text>
          <Text
            style={{
              fontSize: 12,
              textAlign: "center",
              color: COLORS.iconMuted,
            }}
          >
            Cuando completes una reservación, aquí aparecerá tu ticket con
            código QR para mostrar al momento de la entrega.
          </Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            paddingVertical: 24,
          }}
          showsVerticalScrollIndicator={false}
        >
          {tickets.map((ticket) => (
            <View
              key={ticket.reservaId}
              style={[
                styles.ticketCard,
                {
                  backgroundColor: ticketBg,
                  shadowColor: isDark ? "#000000" : "#000000",
                  marginBottom: 24,
                },
              ]}
            >
              {/* “Mordidas” laterales */}
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
              {/* Notch superior */}
              <View
                style={[
                  styles.notchTop,
                  {
                    backgroundColor: ticketBg,
                  },
                ]}
              />

              {/* Logo / Imagen & fecha */}
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
                  {ticket.imageUrl ? (
                    <Image
                      source={{ uri: ticket.imageUrl }}
                      style={styles.logoImage}
                      resizeMode="cover"
                    />
                  ) : (
                    <Text style={styles.logoText}>Logo</Text>
                  )}
                </View>

                <Text style={[styles.dateText, { color: COLORS.icon }]}>
                  {ticket.dateLabel}
                </Text>
              </View>

              {/* Datos */}
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
                    {ticket.phone || "—"}
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
                    {ticket.lessorPhone || "—"}
                  </Text>
                </View>
              </View>

              {/* Línea punteada */}
              <View
                style={[
                  styles.dashedLine,
                  {
                    borderColor: COLORS.ring,
                  },
                ]}
              />

              {/* QR */}
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
                  <QRCode value={ticket.qrValue} size={140} />
                </View>
              </View>
            </View>
          ))}
        </ScrollView>
      )}
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
    overflow: "hidden",
  },
  logoImage: {
    width: "100%",
    height: "100%",
    borderRadius: 16,
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
