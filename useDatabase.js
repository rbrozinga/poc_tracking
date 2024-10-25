import { useEffect } from "react";
import { createRouteTable } from "./rotasDb";
import { createGeoCoordenates } from "./rotasDb";

export const useDatabase = (db) => {
  useEffect(() => {
    const initDB = async () => {
      try {
        if (db) {
          await createGeoCoordenates(db);
          await createRouteTable(db);
          console.log("Banco de dados inicializado com sucesso.");
        } else {
          console.error("Instância do banco de dados não disponível.");
        }
      } catch (error) {
        console.error("Erro ao inicializar banco de dados:", error);
      }
    };

    initDB();
  }, [db]);
};
