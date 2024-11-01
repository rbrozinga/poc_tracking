import React, { useEffect, useState } from "react";
import { StyleSheet, View, Alert, Text, AppState } from "react-native";
import Mapbox from "@rnmapbox/maps";
import * as Notifications from "expo-notifications";
import * as Location from "expo-location";
import * as SQLite from "expo-sqlite";
const db = SQLite.openDatabaseSync("rotas.db");
import { useDatabase } from "./useDatabase";
import { useRoute } from "./rotasDb";
import { useGeoCoordenates } from "./rotasDb";
import TrackingsBackground from "./TrackingsBackground";

Mapbox.setAccessToken(
  "pk.eyJ1IjoiZGFuaWxvbWlndWVsMTQ4NSIsImEiOiJjbGZwYzg2ZzQwdW0yM3FwdG91Z3BoZXVtIn0.FOkbq1V7d5cjKTXgyTQVuQ"
);

// Função para calcular a distância entre duas coordenadas
const haversine = ([lon1, lat1], [lon2, lat2]) => {
  const toRad = (x) => (x * Math.PI) / 180;

  const R = 6371e3; // Raio da Terra em metros
  const φ1 = toRad(lat1);
  const φ2 = toRad(lat2);
  const Δφ = toRad(lat2 - lat1);
  const Δλ = toRad(lon2 - lon1);

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  const distance = R * c; // Em metros
  return distance;
};

// Função para formatar a distância
const formatDistance = (distance) => {
  if (distance < 1000) {
    // Se a distância for menor que 1000 metros, mostrar em metros sem casas decimais
    return `${Math.round(distance)} m`;
  } else {
    // Se a distância for maior ou igual a 1000 metros, mostrar em quilômetros com 1 casa decimal
    return `${(distance / 1000).toFixed(1)} km`;
  }
};

export default function App() {
  const db = SQLite.openDatabaseSync("rotas.db");
  // const dataBase = useDatabase(db);
  const [routeCoords, setRouteCoords] = useState([]);
  const [currentLocation, setCurrentLocation] = useState([0, 0]);
  const [totalDistance, setTotalDistance] = useState(0); // Distância total percorrida
  const [modalVisible, setModalVisible] = useState(false); // Controle de visibilidade do modal

  const queryRoute = useRoute();
  const queryGeoCoords = useGeoCoordenates();

  // queryRoute.deleteRouteTable();
  // queryGeoCoords.deleteGeoCoordenatesTable();

  // manipular o botão de home
  // useEffect(() => {
  //   const subscription = AppState.addEventListener("change", (nextAppState) => {
  //     if (nextAppState === "background") {
  //       console.log("O aplicativo entrou em segundo plano.");
  //     }

  //     // if (appState.match(/inactive|background/) && nextAppState === "active") {
  //     //   console.log("O aplicativo voltou ao primeiro plano!");
  //     // }

  //     setAppState(nextAppState);
  //   });

  //   return () => {
  //     subscription.remove();
  //   };
  // }, [appState]);

  useEffect(() => {
    const startTracking = async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permissão de localização negada!");
        return;
      }

      // Obter localização inicial
      let location = await Location.getCurrentPositionAsync({});
      setCurrentLocation([location.coords.longitude, location.coords.latitude]);

      // Começar a rastrear a posição do usuário
      Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 1000,
          distanceInterval: 5,
        },
        (newLocation) => {
          const { latitude, longitude } = newLocation.coords;
          const newCoords = [longitude, latitude];

          if (routeCoords.length > 0) {
            const lastCoords = routeCoords[routeCoords.length - 1];
            const distance = haversine(lastCoords, newCoords);

            // Considerar apenas distâncias maiores que 1 metro para evitar pequenos erros de precisão
            if (distance > 1) {
              setTotalDistance((prevDistance) => prevDistance + distance); // Atualiza a distância total
            }
          }
          setCurrentLocation(newCoords);
          setRouteCoords((prevCoords) => [...prevCoords, newCoords]);
        }
      );
    };
    startTracking();
  }, []);

  const saveDataBase = async () => {
    for (let i = 0; i < routeCoords.length; i++) {
      const [longitude, latitude] = routeCoords[i];
      let id_routeGeoCoords = await queryGeoCoords.insertGeoCoordenates(
        latitude,
        longitude
      );
      queryRoute.insertRoute(
        formatDistance(totalDistance),
        "rota",
        id_routeGeoCoords
      );
      queryRoute.getRoute();
    }
  };
  // saveDataBase();

  return (
    <>
      <View style={styles.container}>
        <Mapbox.MapView style={styles.map} styleURL={Mapbox.StyleURL.Satellite}>
          <Mapbox.Camera
            zoomLevel={15}
            centerCoordinate={currentLocation}
            followUserMode="normal"
          />

          {/* localização atual do usuário */}
          {currentLocation && (
            <Mapbox.PointAnnotation
              key="current-location"
              id="current-location"
              coordinate={currentLocation}
            >
              <View style={styles.annotationContainer} />
              <Mapbox.Callout title="Você está aqui!" />
            </Mapbox.PointAnnotation>
          )}

          {/* Desenha a linha da rota */}
          {routeCoords.length > 1 && (
            <Mapbox.ShapeSource
              id="routeSource"
              shape={{
                type: "LineString",
                coordinates: routeCoords,
              }}
            >
              <Mapbox.LineLayer
                id="routeLine"
                style={{
                  lineWidth: 4,
                  lineColor: "blue",
                }}
              />
            </Mapbox.ShapeSource>
          )}
        </Mapbox.MapView>

        {/* Modal que exibe a distância */}
        <View style={styles.cardContainer}>
          <View style={styles.card}>
            <Text style={styles.cardText}>
              Distância Percorrida: {formatDistance(totalDistance)}
            </Text>
          </View>
        </View>
      </View>
      <TrackingsBackground />
    </>
  );
}

const styles = StyleSheet.create({
  pipContainer: {
    width: 140,
    height: 240,
  },

  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  annotationContainer: {
    width: 15,
    height: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#00658B",
    borderRadius: 50,
    borderColor: "white",
    borderWidth: 2,
  },
  cardContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: "center",
  },

  card: {
    backgroundColor: "white",
    width: "100%",
    padding: 20,
  },

  cardText: {
    fontSize: 18,
    color: "#001D29",
    textAlign: "center",
  },
});
