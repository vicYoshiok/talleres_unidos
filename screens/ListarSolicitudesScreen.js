import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, Pressable } from 'react-native';
import { db } from "../database/firebaseConfig";
import { collection, query, where, getDocs } from "firebase/firestore";
import { useFocusEffect } from '@react-navigation/native';
import { FontAwesome5 } from '@expo/vector-icons';

export default function ListarSolicitudesScreen({ navigation }) {
  const [solicitudes, setSolicitudes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSolicitudes = async () => {
      try {
        const q = query(collection(db, "solicitudes"), where("estado", "==", "Pendiente"));
        const querySnapshot = await getDocs(q);
        const solicitudesData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setSolicitudes(solicitudesData);
      } catch (error) {
        console.error("Error obteniendo solicitudes: ", error);
        Alert.alert("Error", "No se pudieron obtener las solicitudes");
      } finally {
        setLoading(false);
      }
    };

    fetchSolicitudes();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      const fetchSolicitudes = async () => {
        try {
          const q = query(collection(db, "solicitudes"), where("estado", "==", "Pendiente"));
          const querySnapshot = await getDocs(q);
          const solicitudesData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setSolicitudes(solicitudesData);
        } catch (error) {
          console.error("Error obteniendo solicitudes: ", error);
          Alert.alert("Error", "No se pudieron obtener las solicitudes");
        } finally {
          setLoading(false);
        }
      };
      fetchSolicitudes(); // Función que obtiene las solicitudes de Firestore
    }, [])
);

  if (loading) {
    return <ActivityIndicator size="large" color="#4B9CD3" />;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Solicitudes Pendientes</Text>
      <FlatList
        data={solicitudes}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => navigation.navigate('DetallesSolicitud', { solicitud: item })}
          >
            <View style={styles.solicitudItem}>
              <FontAwesome5 name="car" size={20} color="#4B9CD3" style={styles.icon} />
              <Text style={styles.vinText}>VIN: {item.vin}</Text>
              <Text style={styles.text}>Pieza: {item.pieza}</Text>
              <Text style={styles.text}>Taller: {item.taller}</Text>
              <Text style={styles.text}>Fecha: {new Date(item.fecha).toLocaleDateString()}</Text>
            </View>
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#FAFAFA',
  },
  title: {
    fontSize: 26,
    fontWeight: '600',
    marginBottom: 20,
    color: '#333',
    textAlign: 'center',
  },
  solicitudItem: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 12,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  vinText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#4B9CD3',
    marginBottom: 8,
  },
  text: {
    fontSize: 16,
    color: '#555',
    marginBottom: 4,
  },
  icon: {
    marginBottom: 10,
  },
});
