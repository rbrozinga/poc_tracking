import React, { useEffect } from "react";
import { AppState } from "react-native";
import * as Notifications from "expo-notifications";
import * as Location from "expo-location";
import * as SQLite from "expo-sqlite";
import * as TaskManager from "expo-task-manager";

const LOCATION_TASK_NAME = "background-location-task";

TaskManager.defineTask(LOCATION_TASK_NAME, ({ data, error }) => {
  if (error) {
    console.error("Erro na tarefa em segundo plano:", error);
    return;
  }
  if (data) {
    const { locations } = data;
    console.log("Tarefa em segundo plano executada com dados:", locations);
  } else {
    console.log("Nenhum dado de localização recebido");
  }
});

export default function TrackingsBackground() {
  const requestPermission = async () => {
    const { status: foregroundStatus } =
      await Location.requestForegroundPermissionsAsync();
    if (foregroundStatus !== "granted") {
      console.log("Permissão de localização em primeiro plano não concedida");
      return false;
    }

    const { status: backgroundStatus } =
      await Location.requestBackgroundPermissionsAsync();
    if (backgroundStatus !== "granted") {
      console.log("Permissão de localização em segundo plano não concedida");
      return false;
    }

    await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
      accuracy: Location.Accuracy.Highest,
      distanceInterval: 0,
      deferredUpdatesInterval: 1000,
      foregroundService: {
        notificationTitle: "Rota em andamento",
        notificationBody: "Realização de rota em segundo plano...",
        notificationColor: "#FFFFFF",
      },
    });
    console.log("Tarefa de localização em segundo plano iniciada");

    const { status: notificationStatus } =
      await Notifications.requestPermissionsAsync();
    if (notificationStatus !== "granted") {
      console.log("Permissão de notificações não concedida");
      return false;
    }
    return true;
  };

  useEffect(() => {
    const startBackgroundLocation = async () => {
      await requestPermission();
    };
    startBackgroundLocation();
  }, []);

  return null;
}
