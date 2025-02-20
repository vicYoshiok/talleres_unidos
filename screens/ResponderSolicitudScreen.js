import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Image, Alert, ScrollView, StyleSheet, Pressable } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { db } from "../database/firebaseConfig";
import { doc, deleteDoc, addDoc, collection } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import DateTimePicker from '@react-native-community/datetimepicker';


export default function ResponderSolicitudScreen({ route, navigation }) {
  const { solicitud } = route.params;
  const [respuesta, setRespuesta] = useState({
    mecanico: "",
    taller: "",
    fechaEnvio: new Date(),
    localizacion: null,
    foto: "",
    solicitudOriginal: solicitud
  });

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [hasCameraPermission, setHasCameraPermission] = useState(null);
  const [hasLocationPermission, setHasLocationPermission] = useState(null);

  useEffect(() => {
    (async () => {
      const cameraStatus = await ImagePicker.requestCameraPermissionsAsync();
      setHasCameraPermission(cameraStatus.status === 'granted');

      const locationStatus = await Location.requestForegroundPermissionsAsync();
      setHasLocationPermission(locationStatus.status === 'granted');
    })();
  }, []);

  const handleChanges = (name, value) => {
    setRespuesta({ ...respuesta, [name]: value });
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

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setRespuesta({ ...respuesta, foto: result.assets[0].uri });
    }
  };

  const onChangeDate = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setRespuesta({ ...respuesta, fechaEnvio: selectedDate });
    }
  };
  const getLocation = async () => {
    if (!hasLocationPermission) {
      Alert.alert('Permiso denegado', 'Necesitas otorgar permisos para obtener la ubicación.');
      return;
    }

    try {
      let location = await Location.getCurrentPositionAsync({});
      setRespuesta({
        ...respuesta,
        localizacion: {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude
        }
      });
    } catch (error) {
      console.error("Error obteniendo ubicación:", error);
      Alert.alert("Error", "No se pudo obtener la ubicación");
    }
  };

  const uploadImageToFirebase = async (imageUri) => {
    try {
      const response = await fetch(imageUri);
      const blob = await response.blob();
      const storage = getStorage();
      const storageRef = ref(storage, `respuestas/${Date.now()}.jpg`);
      await uploadBytes(storageRef, blob);
      return await getDownloadURL(storageRef);
    } catch (error) {
      console.error("Error al subir la imagen: ", error);
      return null;
    }
  };

  const enviarRespuesta = async () => {
    if (!respuesta.mecanico || !respuesta.taller || !respuesta.localizacion || !respuesta.foto) {
      Alert.alert("Error", "Todos los campos son obligatorios");
      return;
    }

    try {
      const imageURL = await uploadImageToFirebase(respuesta.foto);
      
      const respuestaData = {
        ...respuesta,
        fechaEnvio: respuesta.fechaEnvio.toISOString(),
        foto: imageURL,
        estatus: "enviado",
        solicitudOriginalId: solicitud.id
      };

      await deleteDoc(doc(db, "solicitudes", solicitud.id));
      await addDoc(collection(db, "solicitudes_respondidas"), respuestaData);
        navigation.navigate('ListarSolicitudes', { reload: true });

      Alert.alert("Éxito", "Respuesta enviada correctamente");
      setRespuesta({
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
      console.error("Error al enviar respuesta: ", error);
      Alert.alert("Error", "No se pudo enviar la respuesta");
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Responder Solicitud</Text>

      <Text style={styles.label}>Mecánico que envía:</Text>
      <TextInput
        style={styles.input}
        placeholder="Nombre del mecánico"
        onChangeText={(value) => handleChanges('mecanico', value)}
      />

      <Text style={styles.label}>Taller que envía:</Text>
      <TextInput
        style={styles.input}
        placeholder="Nombre del taller"
        onChangeText={(value) => handleChanges('taller', value)}
      />

        <Text style={styles.label}>Ubicación del taller:</Text>
        {respuesta.localizacion && (
        <Text style={styles.locationText}>
            Lat: {respuesta.localizacion.latitude}, Lng: {respuesta.localizacion.longitude}
        </Text>
        )}
        <Pressable onPress={getLocation} style={styles.button}>
              <Text style={styles.buttonText}>Obtener ubicación</Text>
        </Pressable>

        <Text style={styles.label}>Fecha de instalación:</Text>
        <Text style={styles.selectedDateText}>
            Fecha seleccionada: {respuesta.fechaEnvio ? respuesta.fechaEnvio.toLocaleDateString() : "No seleccionada"}
        </Text>
        <Pressable onPress={() => setShowDatePicker(true)} style={styles.button}>
         <Text style={styles.buttonText}>Seleccionar fecha</Text>
        </Pressable>

      {showDatePicker && (
        <DateTimePicker
          value={respuesta.fechaEnvio}
          mode="date"
          display="default"
          onChange={onChangeDate}
        />
      )}

     

      <Pressable onPress={pickImage} style={styles.button}>
        <Text style={styles.buttonText}>Tomar foto de evidencia</Text>
      </Pressable>
      {respuesta.foto && (
        <Image source={{ uri: respuesta.foto }} style={styles.image} />
      )}

      <Pressable style={styles.button} onPress={enviarRespuesta}>
        <Text style={styles.buttonText}>Enviar Respuesta</Text>
      </Pressable>
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
      fontWeight: 'bold',
      marginTop: 5,
      marginBottom: 5,
    },
    input: {
      height: 40,
      borderColor: '#ccc',
      borderWidth: 1,
      borderRadius: 5,
      paddingHorizontal: 10,
      marginBottom: 10,
      backgroundColor: '#fff',
    },
    image: {
      width: '100%',
      height: 200,
      borderRadius: 10,
      marginTop: 15,
      marginBottom: 20,
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
      marginTop: 10,
      marginBottom: 10,
      backgroundColor: '#009BFF',
      borderRadius: 20,
      paddingVertical: 12,
      paddingHorizontal: 20,
      alignItems: 'center',
      justifyContent: 'center',
      elevation: 3,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 3,
      height: 40,
    },
    buttonText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: 'bold',
    },
    switchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginVertical: 15,
    },
    switchText: {
      marginLeft: 10,
      fontSize: 16,
    },
  });