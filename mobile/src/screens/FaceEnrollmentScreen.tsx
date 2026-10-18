import React, { useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";


const INSTRUCTIONS = [
  "Olhe diretamente para a câmera",
  "Mantenha o rosto quase de frente e mude ligeiramente a posição",
  "Olhe novamente para a câmera, com uma pequena variação natural",
];

export default function FaceEnrollmentScreen({ navigation }: any) {
  const cameraRef = useRef<CameraView | null>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [cameraReady, setCameraReady] = useState(false);
  const [photos, setPhotos] = useState<string[]>([]);
  const [capturing, setCapturing] = useState(false);
  const [feedback, setFeedback] = useState("Posicione o rosto na moldura e mantenha boa iluminação.");
  const [retakeIndex, setRetakeIndex] = useState<number | null>(null);

  async function capture() {
    if (!cameraRef.current || !cameraReady || capturing || (photos.length >= 3 && retakeIndex === null)) return;

    try {
      setCapturing(true);
      const picture = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        exif: false,
      });

      if (picture?.uri) {
        setFeedback("Fotografia capturada localmente. Verifique o enquadramento antes de continuar.");
        setPhotos((current) => {
          if (retakeIndex !== null) {
            return current.map((uri, index) => index === retakeIndex ? picture.uri : uri);
          }
          return [...current, picture.uri].slice(0, 3);
        });
        setRetakeIndex(null);
      }
    } catch {
      Alert.alert("Erro", "Não foi possível capturar a fotografia.");
    } finally {
      setCapturing(false);
    }
  }

  function finishDemo() {
    Alert.alert(
      "Demonstração concluída",
      "As três fotografias foram capturadas no dispositivo. Não foram enviadas para a API nem foi criado um cadastro biométrico.",
      [
        { text: "Continuar a testar", style: "cancel" },
        { text: "Recomeçar", onPress: () => { setPhotos([]); setRetakeIndex(null); setFeedback("Posicione o rosto na moldura e mantenha boa iluminação."); } },
      ]
    );
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
    retakeIndex !== null ? INSTRUCTIONS[retakeIndex] : photos.length < 3 ? INSTRUCTIONS[photos.length] : "Capturas concluídas";

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.form}>
        <Text style={styles.title}>Demonstração facial local</Text>
        <Text style={styles.subtitle}>
          Teste da câmara e das três fotografias no Samsung. Não há deteção automática de rostos nem envio de imagens à API. Use luz uniforme e mantenha apenas um rosto na moldura.
        </Text>
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
        <Text style={styles.feedback}>{feedback}</Text>

        {(photos.length < 3 || retakeIndex !== null) ? (
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
              onPress={() => { setPhotos([]); setRetakeIndex(null); }}
            >
              <Text style={styles.secondaryButtonText}>Refazer</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={finishDemo}
            >
              <Text style={styles.primaryButtonText}>Concluir demonstração</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  feedback: { textAlign: "center", color: "#374151", fontSize: 13, marginBottom: 10 },
  retakeRow: { flexDirection: "row", gap: 6, marginTop: 10 },
  retakeButton: { flex: 1, paddingVertical: 9, alignItems: "center", borderRadius: 8, backgroundColor: "#e5e7eb" },
  retakeText: { color: "#374151", fontSize: 12, fontWeight: "600" },
  hint: { fontSize: 12, color: "#6b7280", marginTop: 10, textAlign: "center" },
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
