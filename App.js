import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  View,
  Alert,
  Modal,
  Text,
  TouchableOpacity,
} from "react-native";
import Mapbox from "@rnmapbox/maps";
import * as Location from "expo-location";

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
  const [routeCoords, setRouteCoords] = useState([]);
  const [currentLocation, setCurrentLocation] = useState([0, 0]);
  const [totalDistance, setTotalDistance] = useState(0); // Distância total percorrida
  const [modalVisible, setModalVisible] = useState(false); // Controle de visibilidade do modal

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

  return (
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

      {/* Botão para abrir o modal */}
      <TouchableOpacity
        style={styles.modalButton}
        onPress={() => setModalVisible(true)}
      >
        <Text style={styles.modalButtonText}>Mostrar Distância Percorrida</Text>
      </TouchableOpacity>

      {/* Modal que exibe a distância */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalView}>
          <Text style={styles.modalText}>
            Distância Percorrida: {formatDistance(totalDistance)}
          </Text>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setModalVisible(false)}
          >
            <Text style={styles.closeButtonText}>Fechar</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  annotationContainer: {
    width: 18,
    height: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#00658B",
    borderRadius: 50,
    borderColor: "white",
    borderWidth: 2,
  },
  modalButton: {
    position: "absolute",
    bottom: 30,
    left: 20,
    backgroundColor: "#00658B",
    padding: 10,
    borderRadius: 10,
  },
  modalButtonText: {
    color: "#fff",
    fontSize: 16,
  },
  modalView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalText: {
    fontSize: 24,
    color: "#fff",
    marginBottom: 20,
  },
  closeButton: {
    backgroundColor: "#00658B",
    padding: 10,
    borderRadius: 10,
  },
  closeButtonText: {
    color: "#fff",
    fontSize: 16,
  },
});
