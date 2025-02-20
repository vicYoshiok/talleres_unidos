import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, Pressable, Alert, Modal, TouchableOpacity } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { db } from "../database/firebaseConfig";
import { collection, query, getDocs, updateDoc, doc, where, deleteDoc } from "firebase/firestore";
import { MaterialIcons } from '@expo/vector-icons';

export default function ListarSolicitudesAtendidasScreen() {
  const [solicitudes, setSolicitudes] = useState([]);
  const [talleres, setTalleres] = useState([]);
  const [tallerSeleccionado, setTallerSeleccionado] = useState("Todos");
  const [loading, setLoading] = useState(true);
  const [isModalVisible, setIsModalVisible] = useState(false);

  const fetchSolicitudesAtendidas = async () => {
    try {
      const q1 = query(collection(db, "solicitudes_respondidas"));
      const querySnapshot1 = await getDocs(q1);
      const data1 = querySnapshot1.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      const q2 = query(collection(db, "solicitudes"), where("estado", "==", "Instalada"));
      const querySnapshot2 = await getDocs(q2);
      const data2 = querySnapshot2.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      const allSolicitudes = [...data1, ...data2].map(item => ({
        ...item,
        estatus: item.estatus || "Instalada"
      }));

      const talleresUnicos = [
        ...new Set(allSolicitudes.map(item => item.taller.trim().replace(/\s+/g, ' ')))
      ];

      setTalleres(["Todos", ...talleresUnicos]);
      setSolicitudes(allSolicitudes);
    } catch (error) {
      console.error("Error obteniendo solicitudes: ", error);
      Alert.alert("Error", "No se pudieron obtener las solicitudes");
    } finally {
      setLoading(false);
    }
  };

  const solicitudesFiltradas = solicitudes.filter(item => {
    return tallerSeleccionado === "Todos" || item.taller === tallerSeleccionado;
  });

  const solicitudesOrdenadas = solicitudesFiltradas.sort((a, b) => {
    if (a.estatus === "enviado" && b.estatus !== "enviado") return -1;
    if (a.estatus !== "enviado" && b.estatus === "enviado") return 1;
    return 0;
  });

  const finalizarSolicitud = async (id) => {
    try {
      await updateDoc(doc(db, "solicitudes_respondidas", id), {
        estatus: "finalizado"
      });
      Alert.alert("Éxito", "Solicitud finalizada correctamente");
      fetchSolicitudesAtendidas();
    } catch (error) {
      console.error("Error finalizando solicitud: ", error);
      Alert.alert("Error", "No se pudo finalizar la solicitud");
    }
  };

  const eliminarSolicitud = async (id) => {
    Alert.alert(
      "Confirmación",
      "¿Seguro que deseas eliminar esta solicitud?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          onPress: async () => {
            try {
              await deleteDoc(doc(db, "solicitudes_respondidas", id));
              Alert.alert("Eliminado", "Solicitud eliminada correctamente");
              fetchSolicitudesAtendidas();
            } catch (error) {
              console.error("Error eliminando solicitud: ", error);
              Alert.alert("Error", "No se pudo eliminar la solicitud");
            }
          },
          style: "destructive",
        },
      ]
    );
  };

  useEffect(() => {
    fetchSolicitudesAtendidas();
  }, []);

  if (loading) {
    return <ActivityIndicator size="large" color="#009BFF" />;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Solicitudes Atendidas</Text>

      <View style={styles.pickerContainer}>
        <TouchableOpacity style={styles.pickerInput} onPress={() => setIsModalVisible(true)}>
          <Text style={styles.pickerText}>{tallerSeleccionado}</Text>
        </TouchableOpacity>
      </View>

      <Modal
        transparent={true}
        visible={isModalVisible}
        animationType="slide"
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <TouchableOpacity style={styles.closeButton} onPress={() => setIsModalVisible(false)}>
              <MaterialIcons name="close" size={30} color="#333" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Seleccionar Taller</Text>
            <Picker
              selectedValue={tallerSeleccionado}
              onValueChange={(itemValue) => {
                setTallerSeleccionado(itemValue);
                setIsModalVisible(false);
              }}
              style={styles.picker}
            >
              {talleres.map((taller, index) => (
                <Picker.Item key={index} label={taller} value={taller} color="#2c3e50" />
              ))}
            </Picker>
          </View>
        </View>
      </Modal>

      <FlatList
        data={solicitudesOrdenadas}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const estado = item.estatus;
          const estadoColor = estado === "Instalada" ? styles.estadoInstalada : (estado === "enviado" ? styles.estadoEnviado : styles.estadoFinalizado);

          return (
            <View style={styles.solicitudItem}>
              <Text style={styles.vinText}>
                VIN: {item.solicitudOriginal?.vin ? item.solicitudOriginal.vin : 'No necesario'}
              </Text>
              <Text>Pieza: {item.solicitudOriginal?.pieza || 'No disponible'}</Text>
              <Text>Mecánico: {item.mecanico || 'No disponible'}</Text>
              <Text>Fecha: {new Date(item.fechaEnvio).toLocaleDateString()}</Text>

              <Text style={[styles.estadoText, estadoColor]}>Estado: {estado}</Text>

              {item.estatus === "enviado" && (
                <Pressable style={styles.finalizarButton} onPress={() => finalizarSolicitud(item.id)}>
                  <Text style={styles.buttonText}>Finalizar</Text>
                </Pressable>
              )}

              {(item.estatus === "finalizado" || item.estatus === "Instalada") && (
                <TouchableOpacity style={styles.eliminarButton} onPress={() => eliminarSolicitud(item.id)}>
                  <MaterialIcons name="delete" size={20} color="#aaa" />
                </TouchableOpacity>
              )}
            </View>
          );
        }}
      />
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f8f9fa',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 20,
    color: '#2c3e50',
  },
  pickerContainer: {
    marginBottom: 20,
  },
  pickerInput: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 15,
    borderWidth: 1,
    borderColor: '#dcdcdc',
    fontSize: 16,
    color: '#2c3e50',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickerText: {
    fontSize: 16,
    color: '#2c3e50',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 15,
    paddingTop: 10,
    maxHeight: '60%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  closeButton: {
    position: 'absolute',
    top: 20,
    right: 20,
  },
  picker: {
    width: '100%',
    height: 200,
  },
  solicitudItem: {
    backgroundColor: '#ffffff',
    padding: 15,
    marginBottom: 10,
    borderRadius: 10,
  },
  estadoText: {
    marginTop: 10,
  },
  estadoEnviado: {
    color: '#e74c3c',
  },
  estadoFinalizado: {
    color: '#27ae60',
  },
  estadoInstalada: {
    color: '#2ecc71', // Verde para "Instalada"
  },
  finalizarButton: {
    backgroundColor: '#27ae60',
    padding: 10,
    marginTop: 10,
    borderRadius: 5,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  eliminarButton: {
    position: 'absolute',
    top: 40,
    right: 5,
    padding: 5,
    height:90,
    width:90,
  },
});
