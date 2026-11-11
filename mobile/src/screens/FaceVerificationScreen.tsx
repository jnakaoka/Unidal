import React, { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Alert, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { SafeAreaView } from "react-native-safe-area-context";
import { biometricsApi, FaceVerificationResult } from "../services/api";
import { faceCaptureError } from "../utils/faceCapture";

const LIVE_FACE_ENABLED = process.env.EXPO_PUBLIC_FACE_BIOMETRICS_ENABLED === "true";

export default function FaceVerificationScreen() {
  const cameraRef = useRef<CameraView | null>(null);
  const requestRef = useRef<AbortController | null>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [userId, setUserId] = useState("");
  const [cameraReady, setCameraReady] = useState(false);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [result, setResult] = useState<FaceVerificationResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState("Posicione o rosto inteiro de frente, com boa iluminação.");
  const id = Number(userId);
  const validId = Number.isSafeInteger(id) && id > 0;

  useEffect(() => () => { requestRef.current?.abort(); }, []);

  function resetCapture() {
    if (photoUri) setCameraReady(false);
    setPhotoUri(null);
    setResult(null);
    setFeedback("Posicione o rosto inteiro de frente, com boa iluminação.");
  }

  async function captureAndVerify() {
    if (!cameraRef.current || !cameraReady || !validId || busy || requestRef.current || photoUri) return;
    const controller = new AbortController();
    requestRef.current = controller;
    setBusy(true);
    setResult(null);
    setFeedback("A capturar a selfie...");
    try {
      let picture;
      try {
        picture = await cameraRef.current.takePictureAsync({ quality: .8, exif: false });
      } catch {
        if (!controller.signal.aborted) {
          setFeedback("Não foi possível capturar a selfie. Tente novamente.");
          Alert.alert("Erro na câmara", "Não foi possível capturar a selfie. Tente novamente.");
        }
        return;
      }
      if (controller.signal.aborted) return;
      if (!picture?.uri) {
        setFeedback("A câmara não devolveu uma fotografia. Tente novamente.");
        return;
      }
      setPhotoUri(picture.uri);
      setFeedback("A comparar com o perfil facial escolhido...");
      try {
        const comparison = await biometricsApi.verify(id, picture.uri, controller.signal);
        if (controller.signal.aborted) return;
        setResult(comparison);
        setFeedback(comparison.matched
          ? "A selfie corresponde ao perfil escolhido neste teste."
          : "Não foi possível confirmar. Repita de frente e com boa iluminação.");
      } catch (error: any) {
        if (controller.signal.aborted) return;
        const failure = faceCaptureError(error, "verify");
        setFeedback(failure.message);
        Alert.alert(failure.title, failure.message);
      }
    } finally {
      requestRef.current = null;
      if (!controller.signal.aborted) setBusy(false);
    }
  }

  if (!LIVE_FACE_ENABLED) {
    return <SafeAreaView style={styles.center}><Text>Verificação facial experimental desativada neste APK.</Text></SafeAreaView>;
  }
  if (!permission) {
    return <SafeAreaView style={styles.center}><ActivityIndicator size="large" /></SafeAreaView>;
  }
  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.center}>
        <Text style={styles.title}>Acesso à câmara</Text>
        <Text style={styles.description}>Permita a câmara frontal para verificar o rosto.</Text>
        <TouchableOpacity style={styles.button} onPress={requestPermission}>
          <Text style={styles.buttonText}>Permitir câmara</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["bottom", "left", "right"]}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.form}>
          <Text style={styles.title}>Verificar rosto</Text>
          <Text style={styles.description}>A nova selfie será comparada apenas com o perfil do funcionário indicado. Este teste não regista presença e não verifica prova de vida.</Text>
          <Text style={styles.label}>ID do funcionário cadastrado</Text>
          <TextInput value={userId} onChangeText={(value) => { resetCapture(); setUserId(value); }}
            editable={!busy} keyboardType="number-pad" placeholder="ID do utilizador" style={styles.input} />
          {!!userId && !validId && <Text style={styles.feedback}>Indique um ID válido.</Text>}
        </View>
        {result && (
          <View style={[styles.result, result.matched ? styles.match : styles.noMatch]} accessibilityLiveRegion="polite">
            <Text style={styles.resultTitle}>{result.matched ? "Rosto corresponde" : "Não foi possível confirmar"}</Text>
            <Text>{result.user_name} · ID {result.user_id}</Text>
            <Text style={styles.description}>Resultado experimental da comparação. Não confirma presença.</Text>
            <Text style={styles.diagnostics}>Semelhança (aprox.): {result.similarity.toFixed(4)} · Limiar do teste: {result.threshold.toFixed(3)}</Text>
            <Text style={styles.diagnostics}>Referência: {result.request_id}</Text>
          </View>
        )}
        <View style={[styles.cameraContainer, result?.matched ? styles.validated : null]}>
          {photoUri ? (
            <Image source={{ uri: photoUri }} style={styles.camera} resizeMode="contain" accessibilityLabel="Selfie usada na comparação" />
          ) : (
            <>
              <CameraView ref={cameraRef} style={styles.camera} facing="front" mirror
                onCameraReady={() => setCameraReady(true)}
                onMountError={() => { setCameraReady(false); setFeedback("Não foi possível abrir a câmara. Verifique a permissão."); }} />
              <View pointerEvents="none" style={styles.faceGuide} />
            </>
          )}
        </View>
        <View style={styles.form}>
          <Text style={styles.feedback} accessibilityLiveRegion="polite">{feedback}</Text>
          {photoUri ? (
            <TouchableOpacity style={[styles.button, busy && styles.disabled]} disabled={busy} onPress={resetCapture}>
              {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Nova selfie</Text>}
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={[styles.button, (!cameraReady || !validId || busy) && styles.disabled]}
              disabled={!cameraReady || !validId || busy} onPress={captureAndVerify}>
              {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Capturar e verificar</Text>}
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb" },
  center: { flex: 1, padding: 24, gap: 16, alignItems: "center", justifyContent: "center" },
  content: { paddingBottom: 20 },
  form: { padding: 16 },
  title: { fontSize: 24, fontWeight: "700", color: "#111827" },
  description: { marginTop: 8, color: "#4b5563", lineHeight: 20 },
  label: { marginTop: 16, marginBottom: 6, fontWeight: "600", color: "#374151" },
  input: { padding: 12, borderRadius: 10, borderWidth: 1, borderColor: "#d1d5db", backgroundColor: "#fff" },
  cameraContainer: { marginHorizontal: 16, aspectRatio: 3 / 4, overflow: "hidden", borderRadius: 18, backgroundColor: "#111827" },
  camera: { flex: 1 },
  faceGuide: { position: "absolute", left: "15%", top: "15%", width: "70%", height: "70%", borderRadius: 1000, borderWidth: 3, borderColor: "#fff" },
  validated: { borderWidth: 3, borderColor: "#16a34a" },
  feedback: { textAlign: "center", color: "#374151", marginBottom: 12, lineHeight: 20 },
  button: { backgroundColor: "#2563eb", borderRadius: 12, padding: 16, alignItems: "center" },
  buttonText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  disabled: { opacity: .5 },
  result: { marginHorizontal: 16, marginBottom: 16, padding: 16, borderRadius: 12, borderWidth: 1 },
  match: { backgroundColor: "#f0fdf4", borderColor: "#16a34a" },
  noMatch: { backgroundColor: "#fffbeb", borderColor: "#d97706" },
  resultTitle: { fontSize: 21, fontWeight: "700", color: "#111827", marginBottom: 8 },
  diagnostics: { fontSize: 12, color: "#4b5563", marginTop: 8 },
});
