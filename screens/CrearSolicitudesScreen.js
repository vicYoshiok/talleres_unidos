import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Image, Alert, ScrollView, StyleSheet, Pressable, Switch, ActivityIndicator } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { db } from "../database/firebaseConfig";
import { collection, addDoc } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import DateTimePicker from '@react-native-community/datetimepicker';

export default function CrearSolicitudesScreen() {
  const [state, setState] = useState({
    vin: "",
    pieza: "",
    taller: "",
    fecha: new Date(),
    localizacion: null,
    foto: "",
    estadoInstalacion: false,
    nombreMecanico: "",
  });

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [hasCameraPermission, setHasCameraPermission] = useState(null);
  const [hasLocationPermission, setHasLocationPermission] = useState(null);
  const [loading, setLoading] = useState(false); // Nuevo estado para el Activity Indicator

  useEffect(() => {
    (async () => {
      const cameraStatus = await ImagePicker.requestCameraPermissionsAsync();
      setHasCameraPermission(cameraStatus.status === 'granted');

      const locationStatus = await Location.requestForegroundPermissionsAsync();
      setHasLocationPermission(locationStatus.status === 'granted');
    })();
  }, []);

  const handleChanges = (name, value) => {
    setState({ ...state, [name]: value });
  };

  const pickImage = async () => {
    if (!hasCameraPermission) {
      Alert.alert('Permiso denegado', 'Necesitas otorgar permisos para usar la cámara.');
      return;
    }

    let result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled && result.assets.length > 0) {
      setState({ ...state, foto: result.assets[0].uri });
    } else {
      Alert.alert('Error', 'No se pudo capturar la foto.');
    }
  };

  const getLocation = async () => {
    if (!hasLocationPermission) {
      Alert.alert('Permiso denegado', 'Necesitas otorgar permisos para obtener la ubicación.');
      return;
    }

    try {
      let location = await Location.getCurrentPositionAsync({});
      setState({ ...state, localizacion: location.coords });
      Alert.alert("Ubicación obtenida", `Lat: ${location.coords.latitude}, Lng: ${location.coords.longitude}`);
    } catch (error) {
      Alert.alert("Error", "No se pudo obtener la ubicación");
    }
  };

  const uploadImageToFirebase = async (imageUri) => {
    try {
      const response = await fetch(imageUri);
      const blob = await response.blob();

      const storage = getStorage();
      const storageRef = ref(storage, `images/${Date.now()}.jpg`);

      await uploadBytes(storageRef, blob);
      return await getDownloadURL(storageRef);
    } catch (error) {
      Alert.alert("Error", "No se pudo subir la imagen");
      return null;
    }
  };

  const crearSolicitud = async () => {
    if (!state.pieza || !state.taller || (!state.estadoInstalacion && (!state.vin || !state.nombreMecanico))) {
      Alert.alert("Error", "Todos los campos son obligatorios");
      return;
    }

    setLoading(true); // Muestra el ActivityIndicator

    try {
      let imageURL = "";
      if (state.foto) {
        imageURL = await uploadImageToFirebase(state.foto);
      }

      const solicitudData = {
        ...state,
        fecha: state.fecha.toISOString(),
        foto: imageURL,
        estado: state.estadoInstalacion ? "Instalada" : "Pendiente",
        ...(!state.estadoInstalacion && { nombreMecanico: state.nombreMecanico }),
      };

      await addDoc(collection(db, "solicitudes"), solicitudData);

      Alert.alert("Éxito", state.estadoInstalacion ? "Instalación registrada correctamente" : "Solicitud creada correctamente");

      setState({
        vin: "",
        pieza: "",
        taller: "",
        fecha: new Date(),
        localizacion: null,
        foto: "",
        estadoInstalacion: false,
        nombreMecanico: "",
      });

    } catch (error) {
      Alert.alert("Error", "No se pudo registrar la solicitud");
    } finally {
      setLoading(false); // Oculta el ActivityIndicator
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>


      <Text style={styles.label}>Pieza:</Text>
      <TextInput
        style={styles.input}
        placeholder="Ingrese la pieza"
        onChangeText={(value) => handleChanges('pieza', value)}
        value={state.pieza}
      />

      <Text style={styles.label}>Taller:</Text>
      <TextInput
        style={styles.input}
        placeholder="Ingrese el taller"
        onChangeText={(value) => handleChanges('taller', value)}
        value={state.taller}
      />

      <Text style={styles.label}>Fecha de instalación:</Text>
      <Pressable onPress={() => setShowDatePicker(true)} style={styles.button}>
        <Text style={styles.buttonText}>Seleccionar fecha</Text>
      </Pressable>

      {showDatePicker && (
        <DateTimePicker
          value={state.fecha}
          mode="date"
          display="default"
          onChange={(event, selectedDate) => {
            setShowDatePicker(false);
            if (selectedDate) handleChanges('fecha', selectedDate);
          }}
        />
      )}

      <Pressable onPress={getLocation} style={styles.button}>
        <Text style={styles.buttonText}>Obtener ubicación</Text>
      </Pressable>

      <Pressable onPress={pickImage} style={styles.button}>
        <Text style={styles.buttonText}>Tomar foto</Text>
      </Pressable>
      {state.foto && <Image source={{ uri: state.foto }} style={styles.image} />}

      <View style={styles.switchContainer}>
        <Text style={styles.label}>Estado de la refacción:</Text>
        <Switch value={state.estadoInstalacion} onValueChange={(value) => handleChanges('estadoInstalacion', value)} />
        <Text>{state.estadoInstalacion ? "Instalada" : "Pendiente"}</Text>
      </View>
      {!state.estadoInstalacion && (
        <View style={styles.groupContainer}>
          <View style={styles.groupItem}>
            <Text style={styles.label}>VIN del vehículo:</Text>
            <TextInput
              style={styles.input}
              placeholder="Ingrese el VIN"
              onChangeText={(value) => handleChanges('vin', value)}
              value={state.vin}
            />
          </View>

          <View style={styles.groupItem}>
            <Text style={styles.label}>Nombre del mecánico:</Text>
            <TextInput
              style={styles.input}
              placeholder="Ingrese el nombre"
              onChangeText={(value) => handleChanges('nombreMecanico', value)}
              value={state.nombreMecanico}
            />
          </View>
        </View>
      )}

      {loading ? (
        <ActivityIndicator size="large" color="#009BFF" />
      ) : (
        <Pressable style={styles.button} onPress={crearSolicitud}>
          <Text style={styles.buttonText}>{state.estadoInstalacion ? "Registrar instalación" : "Crear solicitud"}</Text>
        </Pressable>
      )}
    </ScrollView>
  );
}


const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 10,
    marginBottom: 5,
    color: '#333',
  },
  input: {
    height: 45,
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    marginBottom: 12,
    backgroundColor: '#fff',
    fontSize: 16,
  },
  image: {
    width: '100%',
    height: 250,
    borderRadius: 8,
    marginTop: 20,
    marginBottom: 25,
  },
  locationText: {
    fontSize: 14,
    marginVertical: 10,
    color: '#333',
  },
  selectedDateText: {
    fontSize: 14,
    marginBottom: 10,
    color: '#555',
  },
  button: {
    marginTop: 15,
    marginBottom: 15,
    backgroundColor: '#007AFF',
    borderRadius: 25,
    paddingVertical: 12,
    paddingHorizontal: 25,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    height: 50,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  groupContainer: {
    marginTop: 15,
  },
  groupItem: {
    marginBottom: 15,
  },
});
