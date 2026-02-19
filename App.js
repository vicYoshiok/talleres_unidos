import * as React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import CrearSolicitudScreen from './screens/CrearSolicitudesScreen';
import ListarSolicitudesScreen from './screens/ListarSolicitudesScreen';
import DetallesSolicitudScreen from './screens/DetallesSolicitudScreen';
import ResponderSolicitudScreen from './screens/ResponderSolicitudScreen';
import ListarSolicitudesAtendidasScreen from './screens/ListarSolicitudesAtendidasScreen'; 

const Tab = createBottomTabNavigator();
const SolicitudesStack = createStackNavigator();

function SolicitudesStackScreen() {
  return (
    <SolicitudesStack.Navigator>
      <SolicitudesStack.Screen
        name="ListarSolicitudes"
        component={ListarSolicitudesScreen}
        options={{ title: 'Solicitudes Pendientes' }}
      />
      <SolicitudesStack.Screen
        name="DetallesSolicitud"
        component={DetallesSolicitudScreen}
        options={{ title: 'Detalles de la Solicitud' }}
      />
      <SolicitudesStack.Screen
        name="ResponderSolicitud"
        component={ResponderSolicitudScreen}
        options={{ title: 'Responder Solicitud' }}
      />
    </SolicitudesStack.Navigator>
  );
}

export default function App() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            let iconName;

            if (route.name === 'Crear Solicitud') {
              iconName = focused ? 'add-circle' : 'add-circle-outline';
            } else if (route.name === 'Solicitudes Pendientes') {
              iconName = focused ? 'list' : 'list-outline';
            }

            return <Ionicons name={iconName} size={size} color={color} />;
          },
          tabBarActiveTintColor: '#009BFF',
          tabBarInactiveTintColor: 'gray',
        })}
      >
        <Tab.Screen name="Crear Solicitud" component={CrearSolicitudScreen} />
        <Tab.Screen
          name="Solicitudes Pendientes"
          component={SolicitudesStackScreen}
          options={{ headerShown: false }}
        />
        <Tab.Screen
          name="Solicitudes Atendidas"
          component={ListarSolicitudesAtendidasScreen}
          options={{
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="checkmark-done" size={size} color={color} />
            ),
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}


/*import { StatusBar } from 'expo-status-bar';
import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Image, Alert, ScrollView, StyleSheet, Pressable, Switch } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { db } from "./database/firebaseConfig";
import { collection, addDoc } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import DateTimePicker from '@react-native-community/datetimepicker';

export default function App() {
  const [state, setState] = useState({
    vin: "",
    pieza: "",
    taller: "",
    fecha: new Date(),
    localizacion: null,
    foto: "",
    estadoInstalacion: false, // false = Pendiente, true = Instalada
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

    if (!result.canceled && result.assets && result.assets.length > 0) {
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
      const coords = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };
      setState({ ...state, localizacion: coords });
      Alert.alert("Ubicación obtenida", `Lat: ${coords.latitude}, Lng: ${coords.longitude}`);
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
      const storageRef = ref(storage, `images/${Date.now()}.jpg`);

      await uploadBytes(storageRef, blob);

      const downloadURL = await getDownloadURL(storageRef);
      return downloadURL;
    } catch (error) {
      console.error("Error al subir la imagen: ", error);
      Alert.alert("Error", "No se pudo subir la imagen");
      return null;
    }
  };

  const crearSolicitud = async () => {
    if (!state.vin || !state.pieza || !state.taller) {
      Alert.alert("Error", "Todos los campos son obligatorios");
      return;
    }

    try {
      let imageURL = "";

      if (state.foto) {
        imageURL = await uploadImageToFirebase(state.foto);
      }

      const solicitudData = {
        ...state,
        fecha: state.fecha.toISOString(),
        foto: imageURL,
        estado: state.estadoInstalacion ? "Instalada" : "Pendiente", // Agregar estado
      };

      console.log("Datos a registrar: ", solicitudData);
      const docRef = await addDoc(collection(db, "solicitudes"), solicitudData);
      console.log("Solicitud registrada con ID: ", docRef.id);

      Alert.alert("Éxito", state.estadoInstalacion ? "Instalación registrada correctamente" : "Solicitud de refacción creada correctamente");

      // Reiniciar el estado
      setState({
        vin: "",
        pieza: "",
        taller: "",
        fecha: new Date(),
        localizacion: null,
        foto: "",
        estadoInstalacion: false,
      });
    } catch (error) {
      console.error("Error al registrar solicitud: ", error);
      Alert.alert("Error", "No se pudo registrar la solicitud");
    }
  };

  const onChangeDate = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setState({ ...state, fecha: selectedDate });
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.label}>VIN del vehículo:</Text>
      <TextInput
        style={styles.input}
        placeholder="Ingrese el VIN"
        onChangeText={(value) => handleChanges('vin', value)}
      />

      <Text style={styles.label}>Pieza:</Text>
      <TextInput
        style={styles.input}
        placeholder="Ingrese la pieza"
        onChangeText={(value) => handleChanges('pieza', value)}
      />

      <Text style={styles.label}>Taller:</Text>
      <TextInput
        style={styles.input}
        placeholder="Ingrese el taller"
        onChangeText={(value) => handleChanges('taller', value)}
      />

      <Text style={styles.label}>Fecha de instalación:</Text>
      <Text style={styles.selectedDateText}>
        Fecha seleccionada: {state.fecha.toLocaleDateString()}
      </Text>
      <Pressable onPress={() => setShowDatePicker(true)} style={styles.button}>
        <Text style={styles.buttonText}>Seleccionar fecha</Text>
      </Pressable>

      {showDatePicker && (
        <DateTimePicker
          value={state.fecha}
          mode="date"
          display="default"
          onChange={onChangeDate}
        />
      )}

      <Text style={styles.label}>Ubicación del taller:</Text>
      {state.localizacion && (
        <Text style={styles.locationText}>
          Lat: {state.localizacion.latitude}, Lng: {state.localizacion.longitude}
        </Text>
      )}
      <Pressable onPress={getLocation} style={styles.button}>
        <Text style={styles.buttonText}>Obtener ubicación</Text>
      </Pressable>

      <Pressable onPress={pickImage} style={styles.button}>
        <Text style={styles.buttonText}>Seleccionar foto de evidencia</Text>
      </Pressable>
      {state.foto && (
        <Image source={{ uri: state.foto }} style={styles.image} />
      )}

      <View style={styles.switchContainer}>
        <Text style={styles.label}>Estado de la refacción:</Text>
        <Switch
          value={state.estadoInstalacion}
          onValueChange={(value) => handleChanges('estadoInstalacion', value)}
        />
        <Text style={styles.switchText}>
          {state.estadoInstalacion ? "Instalada" : "Pendiente"}
        </Text>
      </View>

      <Pressable style={styles.button} onPress={crearSolicitud}>
        <Text style={styles.buttonText}>
          {state.estadoInstalacion ? "Registrar instalación" : "Crear solicitud de refacción"}
        </Text>
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
    marginTop: 10,
    marginBottom: 5,
  },
  input: {
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
    marginBottom: 15,
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


*/