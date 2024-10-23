import React, { useEffect, useState } from "react";
import { StyleSheet, View, Alert } from "react-native";
import Mapbox from "@rnmapbox/maps";
import * as Location from "expo-location";
import polyline from "@mapbox/polyline";

Mapbox.setAccessToken(
  "pk.eyJ1IjoiZGFuaWxvbWlndWVsMTQ4NSIsImEiOiJjbGZwYzg2ZzQwdW0yM3FwdG91Z3BoZXVtIn0.FOkbq1V7d5cjKTXgyTQVuQ"
);

export default function App() {
  const [routeCoords, setRouteCoords] = useState([]);
  const [currentLocation, setCurrentLocation] = useState([0, 0]);

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

          setCurrentLocation([longitude, latitude]);

          setRouteCoords((prevCoords) => [
            ...prevCoords,
            [longitude, latitude],
          ]);
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
          followUserMode="normal" // Centralizar a câmera no usuário
        />

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
});
