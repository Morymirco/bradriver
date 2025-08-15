import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Image, Alert } from 'react-native';
import { Camera, CameraType } from 'expo-camera';
import { MaterialIcons } from '@expo/vector-icons';

const DARK_BG = '#181A20';
const DARK_CARD = '#23262F';
const DARK_TEXT = '#FFFFFF';
const RED = '#E31837';
const DARK_HEADER = '#23262F';
const DARK_GRAY = '#6B7280';
const LIGHT_GRAY = '#9CA3AF';

interface CameraComponentProps {
  onPhotoTaken: (uri: string) => void;
  onClose: () => void;
}

export const CameraComponent: React.FC<CameraComponentProps> = ({ onPhotoTaken, onClose }) => {
  const cameraRef = useRef<any>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [photoUri, setPhotoUri] = useState<string | null>(null);

  React.useEffect(() => {
    requestCameraPermission();
  }, []);

  const requestCameraPermission = async () => {
    try {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    } catch (error) {
      console.error('Erreur permission caméra:', error);
      setHasPermission(false);
    }
  };

  const capturePhoto = async () => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.8,
          base64: false,
        });
        setPhotoUri(photo.uri);
      } catch (error) {
        console.error('Erreur lors de la prise de photo:', error);
        Alert.alert('Erreur', 'Impossible de prendre la photo.');
      }
    }
  };

  const retakePhoto = () => {
    setPhotoUri(null);
  };

  const confirmPhoto = () => {
    if (photoUri) {
      onPhotoTaken(photoUri);
    }
  };

  if (hasPermission === null) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Demande d'accès à la caméra...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (hasPermission === false) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <MaterialIcons name="camera-alt" size={64} color={LIGHT_GRAY} />
          <Text style={styles.errorTitle}>Accès à la caméra refusé</Text>
          <Text style={styles.errorText}>
            L'accès à la caméra est nécessaire pour confirmer la livraison.
          </Text>
          <TouchableOpacity style={styles.errorBtn} onPress={onClose}>
            <Text style={styles.errorBtnText}>Retour</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (photoUri) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.previewContainer}>
          <View style={styles.previewHeader}>
            <TouchableOpacity style={styles.backBtn} onPress={retakePhoto}>
              <MaterialIcons name="arrow-back" size={24} color={DARK_TEXT} />
            </TouchableOpacity>
            <Text style={styles.previewTitle}>Aperçu de la photo</Text>
            <View style={{width: 40}} />
          </View>
          
          <View style={styles.photoContainer}>
            <Image source={{ uri: photoUri }} style={styles.photoImage} />
          </View>
          
          <View style={styles.previewButtons}>
            <TouchableOpacity style={styles.retakeBtn} onPress={retakePhoto}>
              <MaterialIcons name="refresh" size={20} color={DARK_TEXT} />
              <Text style={styles.retakeBtnText}>Reprendre</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.confirmBtn} onPress={confirmPhoto}>
              <MaterialIcons name="check" size={20} color={DARK_TEXT} />
              <Text style={styles.confirmBtnText}>Confirmer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // Vérification que Camera est bien disponible
  if (!Camera) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <MaterialIcons name="error" size={64} color={LIGHT_GRAY} />
          <Text style={styles.errorTitle}>Caméra non disponible</Text>
          <Text style={styles.errorText}>
            Le composant caméra n'est pas disponible sur cet appareil.
          </Text>
          <TouchableOpacity style={styles.errorBtn} onPress={onClose}>
            <Text style={styles.errorBtnText}>Retour</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // @ts-ignore
  return (
    <SafeAreaView style={styles.container}>
      {/* @ts-ignore */}
      <Camera
        ref={cameraRef}
        style={styles.camera}
        type={"back" as any}
        ratio="16:9"
      >
        <View style={styles.cameraOverlay}>
          <View style={styles.cameraHeader}>
            <TouchableOpacity 
              style={styles.cameraBackBtn}
              onPress={onClose}
            >
              <MaterialIcons name="arrow-back" size={24} color={DARK_TEXT} />
            </TouchableOpacity>
            <Text style={styles.cameraTitle}>Prendre une photo</Text>
            <View style={{width: 40}} />
          </View>
          
          <View style={styles.cameraFrame}>
            <View style={styles.cameraFrameBorder} />
            <Text style={styles.cameraHint}>Placez le client dans le cadre</Text>
          </View>
          
          <View style={styles.cameraFooter}>
            <TouchableOpacity 
              style={styles.captureBtn}
              onPress={capturePhoto}
            >
              <View style={styles.captureBtnInner} />
            </TouchableOpacity>
          </View>
        </View>
      </Camera>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DARK_BG,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: LIGHT_GRAY,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: DARK_TEXT,
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    color: LIGHT_GRAY,
    textAlign: 'center',
    marginBottom: 24,
  },
  errorBtn: {
    backgroundColor: RED,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  errorBtnText: {
    color: DARK_TEXT,
    fontWeight: '600',
    fontSize: 16,
  },
  camera: {
    flex: 1,
  },
  cameraOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  cameraHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
  },
  cameraBackBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: DARK_TEXT,
  },
  cameraFrame: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraFrameBorder: {
    width: 250,
    height: 250,
    borderWidth: 2,
    borderColor: RED,
    borderRadius: 12,
    backgroundColor: 'transparent',
  },
  cameraHint: {
    fontSize: 14,
    color: DARK_TEXT,
    marginTop: 16,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  cameraFooter: {
    alignItems: 'center',
    paddingBottom: 40,
  },
  captureBtn: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: DARK_TEXT,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: RED,
  },
  captureBtnInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: RED,
  },
  previewContainer: {
    flex: 1,
    backgroundColor: DARK_BG,
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
    backgroundColor: DARK_HEADER,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: DARK_GRAY,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: DARK_TEXT,
  },
  photoContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  photoImage: {
    width: 300,
    height: 300,
    borderRadius: 12,
    backgroundColor: DARK_HEADER,
  },
  previewButtons: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingBottom: 24,
    gap: 12,
  },
  retakeBtn: {
    flex: 1,
    backgroundColor: DARK_HEADER,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: DARK_GRAY,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  retakeBtnText: {
    color: DARK_TEXT,
    fontWeight: '600',
    fontSize: 16,
    marginLeft: 6,
  },
  confirmBtn: {
    flex: 1,
    backgroundColor: RED,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  confirmBtnText: {
    color: DARK_TEXT,
    fontWeight: '700',
    fontSize: 16,
    marginLeft: 6,
  },
}); 