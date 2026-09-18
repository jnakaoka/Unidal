import React, { useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";

import { biometricsApi } from "../services/api";

const INSTRUCTIONS = [
  "Olhe diretamente para a câmera",
  "Vire levemente o rosto para a esquerda",
  "Vire levemente o rosto para a direita",
];

export default function FaceEnrollmentScreen({ navigation }: any) {
  const cameraRef = useRef<CameraView | null>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [cameraReady, setCameraReady] = useState(false);
  const [userId, setUserId] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [capturing, setCapturing] = useState(false);
  const [sending, setSending] = useState(false);

  async function capture() {
    if (!cameraRef.current || !cameraReady || capturing || photos.length >= 3) return;

    try {
      setCapturing(true);
      const picture = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        exif: false,
      });

      if (picture?.uri) {
        setPhotos((current) => [...current, picture.uri].slice(0, 3));
      }
    } catch {
      Alert.alert("Erro", "Não foi possível capturar a fotografia.");
    } finally {
      setCapturing(false);
    }
  }

  async function submit() {
    const parsedUserId = Number(userId);
    if (!Number.isInteger(parsedUserId) || parsedUserId <= 0) {
      Alert.alert("Atenção", "Informe um ID de utilizador válido.");
      return;
    }
    if (photos.length !== 3) {
      Alert.alert("Atenção", "Faça as 3 capturas antes de enviar.");
      return;
    }

    try {
      setSending(true);
      await biometricsApi.enroll(parsedUserId, photos);
      Alert.alert("Sucesso", "Cadastro facial enviado com sucesso.", [
        {
          text: "OK",
          onPress: () => {
            setPhotos([]);
            setUserId("");
            navigation.goBack();
          },
        },
      ]);
    } catch (error: any) {
      const detail = error?.response?.data?.detail;
      Alert.alert(
        "Cadastro facial",
        typeof detail === "string"
          ? detail
          : "Não foi possível concluir o cadastro facial."
      );
    } finally {
      setSending(false);
    }
  }

  if (!permission) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" />
      </SafeAreaView>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.center}>
        <Text style={styles.permissionTitle}>Acesso à câmera</Text>
        <Text style={styles.permissionText}>
          A Unidal precisa da câmera frontal para realizar o cadastro facial.
        </Text>
        <TouchableOpacity style={styles.primaryButton} onPress={requestPermission}>
          <Text style={styles.primaryButtonText}>Permitir câmera</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const instruction =
    photos.length < 3 ? INSTRUCTIONS[photos.length] : "Capturas concluídas";

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.form}>
        <Text style={styles.title}>Cadastro facial</Text>
        <Text style={styles.subtitle}>
          Informe o funcionário e faça três capturas com a câmera frontal.
        </Text>

        <Text style={styles.label}>ID do funcionário</Text>
        <TextInput
          value={userId}
          onChangeText={setUserId}
          keyboardType="number-pad"
          placeholder="Ex.: 25"
          editable={!sending}
          style={styles.input}
        />
      </View>

      <View style={styles.cameraContainer}>
        <CameraView
          ref={cameraRef}
          style={styles.camera}
          facing="front"
          mirror
          onCameraReady={() => setCameraReady(true)}
        />
        <View style={styles.faceGuide} pointerEvents="none" />
      </View>

      <View style={styles.controls}>
        <Text style={styles.instruction}>{instruction}</Text>
        <Text style={styles.counter}>{photos.length}/3 capturas</Text>

        {photos.length < 3 ? (
          <TouchableOpacity
            style={[styles.captureButton, (!cameraReady || capturing) && styles.disabled]}
            onPress={capture}
            disabled={!cameraReady || capturing}
          >
            {capturing ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.primaryButtonText}>Capturar</Text>
            )}
          </TouchableOpacity>
        ) : (
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => setPhotos([])}
              disabled={sending}
            >
              <Text style={styles.secondaryButtonText}>Refazer</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.primaryButton, sending && styles.disabled]}
              onPress={submit}
              disabled={sending}
            >
              {sending ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.primaryButtonText}>Enviar cadastro</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb" },
  center: {
    flex: 1,
    padding: 24,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f9fafb",
  },
  form: { padding: 16 },
  title: { fontSize: 24, fontWeight: "700", color: "#111827" },
  subtitle: { marginTop: 6, color: "#6b7280", lineHeight: 20 },
  label: { marginTop: 16, marginBottom: 6, fontWeight: "600", color: "#374151" },
  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 11,
  },
  cameraContainer: {
    marginHorizontal: 16,
    flex: 1,
    minHeight: 300,
    overflow: "hidden",
    borderRadius: 18,
    backgroundColor: "#111827",
  },
  camera: { flex: 1 },
  faceGuide: {
    position: "absolute",
    alignSelf: "center",
    top: "14%",
    width: 210,
    height: 270,
    borderRadius: 110,
    borderWidth: 3,
    borderColor: "#fff",
  },
  controls: { padding: 16 },
  instruction: { textAlign: "center", fontSize: 17, fontWeight: "600", color: "#111827" },
  counter: { textAlign: "center", marginTop: 5, marginBottom: 12, color: "#6b7280" },
  permissionTitle: { fontSize: 22, fontWeight: "700", marginBottom: 8 },
  permissionText: { textAlign: "center", color: "#6b7280", marginBottom: 20 },
  primaryButton: {
    backgroundColor: "#2563eb",
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
  },
  captureButton: {
    backgroundColor: "#2563eb",
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: "center",
  },
  primaryButtonText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  secondaryButton: {
    borderWidth: 1,
    borderColor: "#9ca3af",
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: "center",
    flex: 1,
  },
  secondaryButtonText: { color: "#374151", fontWeight: "700", fontSize: 16 },
  actionRow: { flexDirection: "row", gap: 10 },
  disabled: { opacity: 0.55 },
});
