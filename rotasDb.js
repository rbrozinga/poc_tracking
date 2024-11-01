import * as SQLite from "expo-sqlite/next";
const db = SQLite.openDatabaseSync("rotas.db");

export async function createRouteTable() {
  try {
    await db.execAsync(`
        CREATE TABLE IF NOT EXISTS route (
          id_routes INTEGER PRIMARY KEY,
          data_route DATETIME DEFAULT CURRENT_TIMESTAMP,
          title TEXT,
          distance DOUBLE,
          geo_coordinates VARCHAR,
          id_routeGeoCoords INTEGER,
          FOREIGN KEY (id_routeGeoCoords) REFERENCES geoCoordenates(id_route) ON DELETE CASCADE ON UPDATE CASCADE
        );
      `);
    console.log("Tabela de rotas criadas com sucesso");
  } catch (error) {
    console.error("Erro ao criar a tabela de rotas", error);
  }
}

export async function createGeoCoordenates() {
  try {
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS geoCoordenates (
        id_route INTEGER PRIMARY KEY,
        latitude DOUBLE NOT NULL,
        longitude DOUBLE NOT NULL
      );
    `);
    console.log("Tabela de geo coordenadas criada com sucesso.");
  } catch (error) {
    console.error("Erro ao criar a tabela de geoCoordenadas", error);
  }
}

export function useGeoCoordenates() {
  async function insertGeoCoordenates(latitude, longitude) {
    try {
      if (!db) {
        throw new Error("Database connection is not open");
      }
      const statement = await db.prepareAsync(
        "INSERT INTO geoCoordenates (latitude,longitude) VALUES (?,?)"
      );

      const result = await statement.executeAsync([latitude, longitude]);
      // Obter o último ID inserido
      const resultIdRouteGeoCoords = await db.getFirstAsync(
        "SELECT last_insert_rowid() AS id"
      );

      // Verificar e retornar o ID corretamente
      const id_routeGeoCoords = resultIdRouteGeoCoords.id;
      // console.log("id_routeGeoCoords", id_routeGeoCoords);
      return id_routeGeoCoords;
    } catch (error) {
      console.log("Erro ao inserir dados na tabela de coordenadas", error);
    }
  }

  async function getGeoCoordenates(setGeoCoordinates) {
    try {
      const statement = await db.prepareAsync("SELECT * FROM geoCoordenates");

      const result = await statement.executeAsync([]);

      const allRows = await result.getAllAsync();

      console.log("Total de registros obtidos: ", allRows.length);

      allRows.forEach((item) => {
        console.log("Dados da tabela geoCoordenates", item);
      });

      if (typeof setGeoCoordinates === "function") {
        setMarkers(allRows);
      }
    } catch (error) {
      console.log("erro durante a seleção na tabela geoCoordenates", error);
    }
  }
  async function deleteGeoCoordenatesTable() {
    try {
      await db.execAsync("DROP TABLE IF EXISTS geoCoordenates");
      console.log("geoCoordenates deletada com sucesso");
    } catch (error) {
      console.error("Erro durante a deleção na tabela geoCoordenates:", error);
    }
  }

  return {
    insertGeoCoordenates,
    getGeoCoordenates,
    deleteGeoCoordenatesTable,
  };
}

export function useRoute() {
  async function insertRoute(distance, title, id_routeGeoCoords, geo_coordinates) {
    try {
      const statement = await db.prepareAsync(
        "INSERT INTO route(title,distance, id_routeGeoCoords, geo_coordinates) VALUES (?,?,?,?)"
      );

      const result = await statement.executeAsync([
        title,
        distance,
        id_routeGeoCoords,
        geo_coordinates
      ]);

      console.log("Resultado da inserção na tabela rotas:", result);
      console.log("Inserção de rotas (id_routeGeoCoords): ", id_routeGeoCoords);
    } catch (error) {
      console.log("Erro ao inserir dados na tabela de rotas", error);
    }
  }

  async function getRoute(setRoute) {
    try {
      const statement = await db.prepareAsync(
        "SELECT *, strftime('%d/%m/%Y %H:%M:%S', datetime(data_route, '-03:00')) AS data_route FROM route"
      );

      const result = await statement.executeAsync([]);

      const allRows = await result.getAllAsync();

      console.log("Total de registros obtidos: ", allRows.length);

      allRows.forEach((item) => {
        console.log("Dados da tabela rotas", item);
      });

      if (result.length > 0) {
        const route = result[0];
        // Converta o campo `routes_point` de volta para array
        const routesPointArray = JSON.parse(route.routes_point);

        console.log("Rota obtida:", {
          ...route,
          routes_point: routesPointArray,
        });
        return {
          ...route,
          routes_point: routesPointArray,
        };
      } else {
        console.log("Nenhuma rota encontrada");
      }

      if (typeof setRoute === "function") {
        setMarkers(allRows);
      }
    } catch (error) {
      console.log("erro durante a seleção na tabela rotas", error);
    }
  }

  async function deleteRouteTable() {
    try {
      await db.execAsync("DROP TABLE IF EXISTS route");
      console.log("rotas  deletadas com sucesso");
    } catch (error) {
      console.error("Erro durante a deleção na tabela markings:", error);
    }
  }

  return {
    insertRoute,
    getRoute,
    deleteRouteTable,
  };
}
