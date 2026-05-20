import { useRef, useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { useCameraPermissions } from 'expo-camera';

import CameraScreen from './src/components/cameraScreen';
import ResultScreen from './src/components/resultScreen';
import { analyzeImage } from './src/services/visionServices';
import { searchPokemonCards } from './src/services/pokemonService';
import { extractCardName } from './src/services/pokemonService';
import { styles } from './src/styles/styles';

export default function App() {
  const [permission, requestPermission] = useCameraPermissions();
  const [photoUri, setPhotoUri] = useState(null);
  const [ocrText, setOcrText] = useState('');
  const [loading, setLoading] = useState(false);
  const [cardMatches, setCardMatches] = useState([]);

  const cameraRef = useRef(null);

  async function takePhoto() {
    if (!cameraRef.current) return;

    const photo = await cameraRef.current.takePictureAsync({ quality: 0.7 });
    setPhotoUri(photo.uri);

    try {
      setLoading(true);
      setOcrText('Reading card...');
      setCardMatches([]);

      const rawText = await analyzeImage(photo.uri);

      if (!rawText) {
        setOcrText('No text detected. Try better lighting / closer photo.');
        return;
      }

      const cardName = extractCardName(rawText);
      setOcrText(`Detected Card: ${cardName}\n\nRaw OCR:\n${rawText}`);

      const matches = await searchPokemonCards(cardName);
      setCardMatches(matches);
    } catch (error) {
      setOcrText(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }

  function resetScan() {
    setPhotoUri(null);
    setOcrText('');
    setCardMatches([]);
  }

  if (!permission) {
    return (
      <View style={styles.center}>
        <Text>Loading camera permissions...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Text style={styles.text}>Camera access is needed</Text>

        <Pressable style={styles.button} onPress={requestPermission}>
          <Text style={styles.buttonText}>Allow Camera</Text>
        </Pressable>
      </View>
    );
  }

  if (photoUri) {
    return (
      <ResultScreen
        photoUri={photoUri}
        ocrText={ocrText}
        loading={loading}
        cardMatches={cardMatches}
        onRetake={resetScan}
      />
    );
  }

  return <CameraScreen cameraRef={cameraRef} takePhoto={takePhoto} />;
}