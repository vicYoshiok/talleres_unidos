import React from 'react';
import { View, Text, StyleSheet, Image, Pressable } from 'react-native';
import MapView, { Marker } from 'react-native-maps';

export default function DetallesSolicitudScreen({ route, navigation }) {
  const { solicitud } = route.params || {};

  if (!solicitud) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>No hay información de la solicitud</Text>
      </View>
    );
  }

  const hasLocation = solicitud.localizacion && solicitud.localizacion.latitude && solicitud.localizacion.longitude;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Detalles de la Solicitud</Text>
      <Text style={styles.detailText}>VIN: {solicitud.vin || 'N/A'}</Text>
      <Text style={styles.detailText}>Pieza: {solicitud.pieza || 'N/A'}</Text>
      <Text style={styles.detailText}>Taller: {solicitud.taller || 'N/A'}</Text>
      <Text style={styles.detailText}>Fecha: {solicitud.fecha ? new Date(solicitud.fecha).toLocaleDateString() : 'N/A'}</Text>
      <Text style={styles.detailText}>Estado: {solicitud.estado || 'N/A'}</Text>

      {solicitud.foto ? (
        <Image source={{ uri: solicitud.foto }} style={styles.image} />
      ) : (
        <Text style={styles.noImageText}>No hay imagen disponible</Text>
      )}

      {/* Mapa */}
      {hasLocation ? (
        <View style={styles.mapContainer}>
          <MapView
            style={styles.map}
            initialRegion={{
              latitude: solicitud.localizacion.latitude,
              longitude: solicitud.localizacion.longitude,
              latitudeDelta: 0.0922,
              longitudeDelta: 0.0421,
            }}
          >
            <Marker
              coordinate={{
                latitude: solicitud.localizacion.latitude,
                longitude: solicitud.localizacion.longitude,
              }}
              title="Ubicación del taller"
              description={solicitud.taller}
            />
          </MapView>
        </View>
      ) : (
        <Text style={styles.noLocationText}>No hay ubicación disponible para este taller.</Text>
      )}

      {/* Botón para responder la solicitud */}
      <Pressable
        style={styles.button}
        onPress={() => navigation.navigate('ResponderSolicitud', { solicitud })}
      >
        <Text style={styles.buttonText}>Responder Solicitud</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  detailText: {
    fontSize: 16,
    marginBottom: 10,
  },
  image: {
    width: '100%',
    height: 200,
    borderRadius: 10,
    marginTop: 15,
  },
  noImageText: {
    marginTop: 10,
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
  },
  mapContainer: {
    marginTop: 20,
    height: 300,
    borderRadius: 10,
    overflow: 'hidden',
  },
  map: {
    width: '100%',
    height: '100%',
  },
  noLocationText: {
    marginTop: 20,
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
  },
  button: {
    marginTop: 20,
    backgroundColor: '#009BFF',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
